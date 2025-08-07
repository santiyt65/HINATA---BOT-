// /plugins/ping.js
export const command = '.ping';

export async function run(sock, m, { text, command }) {
  const chatId = m.key.remoteJid;
  const now = new Date();
  await sock.sendMessage(chatId, { text: `Pong! ${now.toISOString()}` }, { quoted: m });
}
