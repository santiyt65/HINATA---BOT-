import axios from 'axios';

const handler = async (sock, m, { args }) => {
  const query = args.join(' ');
  if (!query) {
    return sock.sendMessage(m.key.remoteJid, {
      text: '🦆 Escribe algo para buscar.\n\n*Ejemplo:*\n.duck Gato con botas'
    }, { quoted: m });
  }

  await sock.sendMessage(m.key.remoteJid, {
    text: `🔎 Buscando "${query}"...`
  }, { quoted: m });

  try {
    // Usamos la API de DuckDuckGo para obtener una imagen directamente
    const response = await axios.get(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json`);
    const imageUrl = response.data.Image;

    if (!imageUrl) {
      return sock.sendMessage(m.key.remoteJid, {
        text: `❌ No encontré una imagen para "${query}".`
      }, { quoted: m });
    }

    await sock.sendMessage(m.key.remoteJid, {
      image: { url: `https://duckduckgo.com${imageUrl}` },
      caption: `🦆 Resultado para: *${query}*`
    }, { quoted: m });

  } catch (error) {
    console.error('🛑 Error en .duck:', error);
    await sock.sendMessage(m.key.remoteJid, {
      text: '❌ Ocurrió un error al realizar la búsqueda. Inténtalo de nuevo.'
    }, { quoted: m });
  }
};

handler.command = ['duck', 'duckduckgo'];
export default handler;
