import axios from 'axios';
import { generateWAMessageFromContent, proto } from '@whiskeysockets/baileys';

const handler = async (sock, m, { args }) => {
  const texto = args.join(' ');
  if (!texto) {
    return sock.sendMessage(m.key.remoteJid, {
      text: '📸 Escribí algo para buscar en Pinterest.\n\nEjemplo:\n.pinterest Goku'
    }, { quoted: m });
  }

  // Mensaje de espera
  await sock.sendMessage(m.key.remoteJid, {
    text: '🔄 Buscando imágenes en Pinterest...',
  }, { quoted: m });

  try {
    const res = await axios.get(`https://api.akuari.my.id/pinterest?query=${encodeURIComponent(texto)}`);
    const resultados = res.data.result;

    if (!resultados || resultados.length === 0) {
      return sock.sendMessage(m.key.remoteJid, { text: '❌ No encontré imágenes para esa búsqueda.' }, { quoted: m });
    }

    // Elegimos las primeras 5 imágenes (puedes cambiar ese número)
    const imagenes = resultados.slice(0, 5);
    const botones = imagenes.map((img, index) => ({
      buttonId: `.verimg ${img}`,
      buttonText: { displayText: `🖼 Ver ${index + 1}` },
      type: 1
    }));

    const mensaje = {
      image: { url: imagenes[0] },
      caption: `📌 Resultados para: *${texto}*\n\nToca un botón para ver otra imagen.`,
      footer: 'HINATA - BOT',
      buttons: botones,
      headerType: 4
    };

    await sock.sendMessage(m.key.remoteJid, mensaje, { quoted: m });

  } catch (e) {
    console.error('🛑 Error en .pinterest:', e);
    await sock.sendMessage(m.key.remoteJid, {
      text: '❌ Error al buscar imágenes. Intentalo de nuevo más tarde.',
    }, { quoted: m });
  }
};

handler.command = ['pinterest'];
export default handler;
