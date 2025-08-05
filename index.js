import baileys from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import fs from 'fs';
import path from 'path';
import { obtenerConfig, verificarLlave, agregarCanal } from './lib/functions.js';
import qrcode from 'qrcode-terminal'; // <== NUEVO: Librería para mostrar QR

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} = baileys;

const plugins = {};

async function cargarPlugins() {
  const files = fs.readdirSync('./plugins');
  for (const file of files) {
    const plugin = await import(`./plugins/${file}`);
    plugins[plugin.command] = plugin.run;
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

  // Mostrar QR visual con qrcode-terminal
  sock.ev.on('connection.update', (update) => {
    const { connection, qr } = update;

    if (qr) {
      console.log('\n📲 Escaneá el siguiente código QR para vincular el bot:\n');
      qrcode.generate(qr, { small: true }); // <== Mostrar QR como imagen de consola
    }

    if (connection === 'open') {
      console.log('✅ Conectado a WhatsApp');
    } else if (connection === 'close') {
      console.log('❌ Conexión cerrada');
    }
  });

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const m = messages[0];
    if (!m.message) return;

    const body = m.message.conversation || m.message.extendedTextMessage?.text || '';
    const command = body.trim().toLowerCase();

    if (plugins[command]) {
      try {
        await plugins[command](sock, m);

        // Enviar el enlace al canal de WhatsApp
        await sock.sendMessage(m.key.remoteJid, {
          text: agregarCanal('')
        });

      } catch (err) {
        console.error(`❌ Error en comando ${command}:`, err);
      }
    }
  });

  sock.ev.on('creds.update', saveCreds);

  console.log('✅ HINATA - BOT iniciado correctamente!');
}

await cargarPlugins();
await iniciarBot();
