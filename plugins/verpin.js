export const command = '.verpin';

export const run = async (sock, m) => {
  const url = m.message.conversation?.split(' ')[1];
  if (!url) return;

  await sock.sendMessage(m.key.remoteJid, {
    image: { url },
    caption: '📌 Imagen desde Pinterest',
  }, { quoted: m });
};
