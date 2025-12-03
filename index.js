/**
 * @file Archivo principal del Bot de WhatsApp HINATA.
 * @description Este archivo maneja la conexión con WhatsApp, carga los plugins de comandos
 * y procesa los mensajes entrantes.
 * @version 2.0.0
 */

// ----------------------------------------
//          IMPORTS Y CONFIGURACIÓN
// ----------------------------------------
import {
    default as makeWASocket,
    DisconnectReason,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore
} from '@whiskeysockets/baileys';
import pino from 'pino';
import qrcode from 'qrcode-terminal';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { Boom } from '@hapi/boom';
import { initDB, db } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Almacén global para los comandos cargados
export const plugins = {};
// Almacén global para la configuración
let config = {};

// Cooldown maps for rate-limiting
// key: `${command}:${userId}` -> timestamp (ms)
const cooldownsMap = new Map();
// key: chatId -> array of timestamps (ms) of recent commands
const groupUsageMap = new Map();

// ----------------------------------------
//          FUNCIONES AUXILIARES
// ----------------------------------------

/**
 * Carga la configuración desde config.json.
 * Es buena práctica mover esta función a un archivo en una carpeta 'lib'.
 */
async function obtenerConfig() {
    try {
        const data = await fs.readFile('config/config.json', 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('❌ Error al leer o parsear config/config.json. Asegúrate de que el archivo existe y es un JSON válido.', error);
        // Termina el proceso si no hay configuración, ya que es vital.
        process.exit(1);
    }
}

/**
 * Carga dinámicamente todos los comandos desde la carpeta 'plugins'.
 */
export async function cargarPlugins() {
    // Limpiar plugins antiguos para permitir la recarga en caliente
    Object.keys(plugins).forEach(key => delete plugins[key]);

    const pluginsDir = path.join(__dirname, 'plugins');
    try {
        const files = await fs.readdir(pluginsDir);
        const pluginFiles = files.filter(file => file.endsWith('.js') && file !== 'db.js');

        console.log('🔌 Cargando plugins...');
        for (const file of pluginFiles) {
            try {
                // Usamos un timestamp para evitar problemas de caché con import()
                const pluginPath = path.join(pluginsDir, file) + `?v=${Date.now()}`;
                const plugin = await import(pluginPath);

                if (plugin.command) {
                    const commands = Array.isArray(plugin.command) ? plugin.command : [plugin.command];
                    commands.forEach(cmd => {
                        const commandKey = cmd.startsWith('.') ? cmd : `.${cmd}`;
                        if (plugins[commandKey]) {
                            console.warn(`⚠️ ¡Comando duplicado! "${cmd}" en "${file}" será omitido.`);
                        } else {
                            plugins[commandKey] = plugin.run;
                        }
                    });
                }
            } catch (err) {
                console.error(`❌ Error al cargar el plugin "${file}":`, err);
            }
        }
        console.log(`✅ ${Object.keys(plugins).length} comandos cargados.`);
    } catch (error) {
        console.error('❌ No se pudo leer el directorio de plugins. Asegúrate de que la carpeta "plugins" existe.', error);
    }
}

// ----------------------------------------
//          CONEXIÓN A WHATSAPP
// ----------------------------------------

async function connectToWhatsApp() {
    // Inicializar base de datos
    await initDB();

    // Cargar configuración y plugins al inicio
    config = await obtenerConfig();
    await cargarPlugins();

    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(`🤖 Usando WhatsApp v${version.join('.')} (isLatest: ${isLatest})`);

    const sock = makeWASocket({
        version,
        printQRInTerminal: true,
        auth: {
            creds: state.creds,
            // Almacenamiento en caché para mejorar el rendimiento
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })),
        },
        logger: pino({ level: 'silent' }),
        // Opciones adicionales para más robustez
        shouldIgnoreJid: jid => jid.includes('@broadcast'),
        getMessage: async (key) => {
            // Lógica para obtener mensajes si es necesario (ej. para reintentos)
            return { conversation: 'hello' };
        }
    });

    // ---- MANEJO DE EVENTOS DE CONEXIÓN ----
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;

        // Mostrar el QR explícitamente en terminal si viene en el update
        if (update.qr) {
            try {
                qrcode.generate(update.qr, { small: true });
                console.log('🔑 Escanea el QR mostrado en la terminal para iniciar sesión.');
            } catch (err) {
                console.log('🔑 QR recibido pero no se pudo mostrar en terminal:', err.message || err);
            }
        }
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error instanceof Boom) ?
                lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut :
                true;
            console.log('🔌 Conexión cerrada por:', lastDisconnect.error, ', reconectando:', shouldReconnect);
            if (shouldReconnect) {
                connectToWhatsApp();
            }
        } else if (connection === 'open') {
            console.log('✅ Conexión abierta. ¡Hinata-Bot está en línea!');
        }
    });

    // ---- GUARDADO DE CREDENCIALES ----
    sock.ev.on('creds.update', saveCreds);

    // ---- MANEJO DE MENSAJES ENTRANTES ----
    sock.ev.on('messages.upsert', async (m) => {
        if (m.type !== 'notify' || !m.messages[0]?.key) return;

        const msg = m.messages[0];
        // Ignorar mensajes propios y de estado
        if (msg.key.fromMe || msg.key.remoteJid === 'status@broadcast') return;

        const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
        const prefix = '.'; // Prefijo para los comandos

        if (!text.startsWith(prefix)) return;

        const senderId = msg.key.remoteJid;

        const args = text.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();
        const command = prefix + commandName;

        const commandHandler = plugins[command];

        if (commandHandler) {
            // Cooldown and rate-limiting logic
            try {
                const now = Date.now();
                const userId = msg.key.participant || msg.key.remoteJid;
                const chatId = msg.key.remoteJid;

                // Reload runtime config so changes via .setcooldown apply immediately
                let runtimeConfig = {};
                try {
                    runtimeConfig = await obtenerConfig();
                } catch (e) {
                    runtimeConfig = config || {};
                }

                // Load cooldown config (defaults)
                const perUserSec = (runtimeConfig.cooldowns && runtimeConfig.cooldowns.perUser) ? runtimeConfig.cooldowns.perUser : 5;
                const groupBurstLimit = (runtimeConfig.cooldowns && runtimeConfig.cooldowns.groupBurstLimit) ? runtimeConfig.cooldowns.groupBurstLimit : 25;
                const groupBurstSeconds = (runtimeConfig.cooldowns && runtimeConfig.cooldowns.groupBurstSeconds) ? runtimeConfig.cooldowns.groupBurstSeconds : 60;

                // Owner bypass: if sender is owner, skip cooldowns
                const ownerId = (runtimeConfig.ownerJid && runtimeConfig.ownerJid.toString().trim()) || (runtimeConfig.propietario && runtimeConfig.propietario.toString().trim()) || '';
                let isOwner = false;
                if (ownerId) {
                    try {
                        if (ownerId.includes('@')) {
                            isOwner = userId === ownerId;
                        } else {
                            // allow matching by phone or partial match
                            isOwner = userId === ownerId || userId.includes(ownerId) || userId.startsWith(ownerId);
                        }
                    } catch (e) {
                        isOwner = false;
                    }
                }

                if (isOwner) {
                    // propietario exento de cooldowns
                    console.log(`🔓 Usuario propietario detectado (${userId}), saltando cooldowns para ${command}`);
                    await commandHandler(sock, msg, { text: args.join(' '), command, args });
                    return;
                }

                // Per-user per-command cooldown
                const cmdKey = `${command}:${userId}`;
                const lastUsed = cooldownsMap.get(cmdKey) || 0;
                const waitMs = perUserSec * 1000 - (now - lastUsed);
                if (lastUsed && waitMs > 0) {
                    const waitSec = Math.ceil(waitMs / 1000);
                    await sock.sendMessage(chatId, { text: `⌛ Por favor espera ${waitSec}s antes de usar el comando ${command} nuevamente.` }, { quoted: msg });
                    return;
                }

                // Group burst limiting to reduce spam
                const windowStart = now - (groupBurstSeconds * 1000);
                let timestamps = groupUsageMap.get(chatId) || [];
                // Keep only recent timestamps
                timestamps = timestamps.filter(t => t >= windowStart);
                if (timestamps.length >= groupBurstLimit) {
                    await sock.sendMessage(chatId, { text: `⚠️ Demasiados comandos en este grupo. Por favor espera unos segundos antes de usar más comandos.` }, { quoted: msg });
                    // update map with filtered list (no push since blocked)
                    groupUsageMap.set(chatId, timestamps);
                    return;
                }

                // Record usage
                timestamps.push(now);
                groupUsageMap.set(chatId, timestamps);
                cooldownsMap.set(cmdKey, now);

                console.log(`💬 Comando: ${command} | Argumentos: [${args.join(', ')}] | De: ${senderId}`);
                await commandHandler(sock, msg, { text: args.join(' '), command, args });
            } catch (err) {
                console.error(`❌ Error ejecutando el comando "${command}":`, err);
                await sock.sendMessage(msg.key.remoteJid, { text: '❌ Ocurrió un error inesperado al ejecutar ese comando.' }, { quoted: msg });
            }
        }
    });

    return sock;
}

// Iniciar el bot
connectToWhatsApp().catch(err => console.error("❌ Error fatal al iniciar el bot:", err));
