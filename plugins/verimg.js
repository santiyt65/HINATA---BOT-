const handler = async (sock, m, { args }) => {
  const url = args[0];
  // Check if the URL is valid
  if (!url || !url.startsWith('http')) {
    return sock.sendMessage(m.key.remoteJid, { text: '❌ URL no válida' }, { quoted: m });
  }

  try {
    // Send the image message
    await sock.sendMessage(m.key.remoteJid, {
      image: { url },
      caption: '🖼 Imagen seleccionada de Pinterest.',
    // Catch any errors
    }, { quoted: m });
  } catch (e) {
    console.error('🛑 Error al mostrar imagen:', e);
    await sock.sendMessage(m.key.remoteJid, { text: '❌ No se pudo mostrar la imagen.' }, { quoted: m });
  }
};

handler.command = ['verimg'];
export default handler;
