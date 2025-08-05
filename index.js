import baileys from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import fs from 'fs';
import path from 'path';
import { obtenerConfig, verificarLlave, agregarCanal } from './lib/functions.js';
import qrcode from 'qrcode-terminal';

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} = baileys;

// Objeto para almacenar todos los comandos cargados
const plugins = {};

// Función para cargar dinámicamente los plugins desde la carpeta /plugins
async function cargarPlugins() {
  const pluginDir = './plugins';
  const files = fs.readdirSync(pluginDir).filter(file => file.endsWith('.js'));

  for (const file of files) {
    try {
      const module = await import(`${pluginDir}/${file}`);
      // Unificar el manejo de plugins (acepta `export default handler` y `export const run`)
      const handler = module.default || module.run;
      let commands = module.default?.command || module.command;

      if (typeof handler !== 'function' || !commands) {
        console.warn(`[AVISO] El plugin ${file} no tiene un formato válido y fue omitido.`);
        continue;
      }

      if (!Array.isArray(commands)) commands = [commands];

      commands.forEach(command => plugins[command.toLowerCase().replace(/^[.#!/]/, '')] = handler);
    } catch (e) {
      console.error(`[ERROR] No se pudo cargar el plugin ${file}:`, e);
    }
  }
}

async function iniciarBot() {
  const config = obtenerConfig();

  if (!verificarLlave(config.llave)) {
    console.error('❌ Llave incorrecta. Editá config.json para activar el bot.');
    process.exit(1);
  }

  const { state, saveCreds } = await useMultiFileAuthState('./session');
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state
  });

  // Manejo de la conexión y QR en la terminal
  sock.ev.on('connection.update', (update) => {
    const { connection, qr } = update;

    if (qr) {
      console.log('📲 Escanea el siguiente código QR para vincular el bot:\n');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'open') {
      console.log('✅ Conectado a WhatsApp');
    } else if (connection === 'close') {
      console.log('❌ Conexión cerrada, reconectando...');
      iniciarBot();
    }
  });

  // Manejo de mensajes entrantes
  sock.ev.on('messages.upsert', async ({ messages }) => {
    const m = messages[0];
    if (!m.message || m.key.fromMe) return;

    const body = m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || '';
    const prefix = /^[.#!/]/;
    const isCmd = prefix.test(body);

    if (!isCmd) return;

    // Parseo del comando y argumentos
    const [command, ...args] = body.slice(1).trim().split(/ +/);
    const lowerCaseCommand = command.toLowerCase();
    const text = args.join(' ');

    // Buscar y ejecutar el plugin correspondiente
    const pluginToExecute = plugins[lowerCaseCommand];

    if (pluginToExecute) {
      try {
        // El objeto de contexto pasa información útil al plugin
        const context = { args, text, command: lowerCaseCommand, conn: sock };
        await pluginToExecute(sock, m, context);

        // Enviar el enlace al canal de WhatsApp (si aplica)
        await sock.sendMessage(m.key.remoteJid, {
          text: agregarCanal('')
        });
      } catch (err) {
        console.error(`❌ Error en comando ${lowerCaseCommand}:`, err);
        await sock.sendMessage(m.key.remoteJid, { text: `❌ Ocurrió un error al ejecutar el comando.` }, { quoted: m });
      }
    }
  });
  
  sock.ev.on('creds.update', saveCreds);

  console.log('✅ HINATA - BOT iniciado correctamente!');
}

await cargarPlugins();
await iniciarBot();
