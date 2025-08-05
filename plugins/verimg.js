const handler = async (sock, m, { args }) => {
  const url = args[0];
  if (!url || !url.startsWith('http')) {
    return sock.sendMessage(m.key.remoteJid, { text: '❌ URL no válida' }, { quoted: m });
  }

  try {
    await sock.sendMessage(m.key.remoteJid, {
      image: { url },
      caption: '🖼 Imagen seleccionada de Pinterest.',
    }, { quoted: m });
  } catch (e) {
    console.error('🛑 Error al mostrar imagen:', e);
    await sock.sendMessage(m.key.remoteJid, { text: '❌ No se pudo mostrar la imagen.' }, { quoted: m });
  }
};

handler.command = ['verimg'];
export default handler;
