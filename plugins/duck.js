import axios from 'axios';

const handler = async (sock, m, { text }) => {
  if (!text) {
    return sock.sendMessage(m.key.remoteJid, {
      text: '🦆 Escribe algo para buscar.\n\n*Ejemplo:*\n.duck Gato con botas'
    }, { quoted: m });
  }

  try {
    await sock.sendMessage(m.key.remoteJid, { text: '🔎 Buscando imágenes...' }, { quoted: m });

    const res = await axios.get(`https://api.duckduckgo.com/?q=${encodeURIComponent(text)}&format=json`);
    const imageUrl = res.data.Image;

    if (!imageUrl) {
      return sock.sendMessage(m.key.remoteJid, { text: '❌ No encontré una imagen para esa búsqueda.' }, { quoted: m });
    }

    await sock.sendMessage(m.key.remoteJid, {
      image: { url: `https://duckduckgo.com${imageUrl}` },
      caption: `🦆 Resultado para: *${text}*`
    }, { quoted: m });
  } catch (e) {
    console.error('🛑 Error en .duck:', e);
    await sock.sendMessage(m.key.remoteJid, { text: '⚠️ Ocurrió un error al buscar la imagen.' }, { quoted: m });
  }
};

handler.command = ['duck'];
export default handler;
