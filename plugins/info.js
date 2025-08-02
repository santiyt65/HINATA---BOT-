import { obtenerConfig } from '../lib/functions.js';

export const command = '.info';
export async function run(sock, m) {
  const config = obtenerConfig();
  const info = `🤖 *HINATA - BOT*
🔐 Llave: ${config.llave}
👤 Propietario: ${config.propietario}
🛠 Versión: ${config.version}`;
  await sock.sendMessage(m.key.remoteJid, { text: info });
}
