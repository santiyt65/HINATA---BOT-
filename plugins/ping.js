// /plugins/ping.js
export const command = '.ping';

export async function run(sock, m, { text, command }) {
  const chatId = m.key.remoteJid;
  const now = new Date();
  await sock.sendMessage(chatId, { text: `Pong! ${now.toISOString()}` }, { quoted: m });
}

export const help = `
Comprueba la latencia y si el bot está respondiendo. Devuelve "Pong!" junto con la fecha y hora actual.
`;
