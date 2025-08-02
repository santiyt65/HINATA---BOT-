export const command = '.ping';
export async function run(sock, m) {
  await sock.sendMessage(m.key.remoteJid, { text: '🏓 Pong!' });
}
