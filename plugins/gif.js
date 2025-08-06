import axios from 'axios';
import { obtenerConfig } from '../lib/functions.js';

export const command = ['gif'];

export async function run(sock, m, { text }) {
  const config = obtenerConfig();
  const apiKey = config.tenorApiKey;

  if (!apiKey || apiKey === 'TU_API_KEY_DE_TENOR') {
    console.error('Error: La API Key de Tenor no está configurada en config.json');
    return await sock.sendMessage(m.key.remoteJid, { text: '⚙️ La función de GIF no está configurada. El propietario debe añadir una API Key de Tenor.' }, { quoted: m });
  }

  if (!text) {
    return await sock.sendMessage(m.key.remoteJid, { text: '👾 Escribe algo para buscar un GIF.\n\n*Ejemplo:*\n.gif risa' }, { quoted: m });
  }

  try {
    await sock.sendMessage(m.key.remoteJid, { text: `🔎 Buscando GIFs de "${text}"...` }, { quoted: m });

    const url = `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(text)}&key=${apiKey}&limit=10&media_filter=mp4`;
    const response = await axios.get(url);
    const results = response.data.results;

    if (!results || results.length === 0) {
      return await sock.sendMessage(m.key.remoteJid, { text: `❌ No encontré GIFs para "${text}".` }, { quoted: m });
    }

    const randomGif = results[Math.floor(Math.random() * results.length)];
    const gifUrl = randomGif.media_formats.mp4.url;

    await sock.sendMessage(m.key.remoteJid, { video: { url: gifUrl }, caption: `✨ GIF para: *${text}*`, gifPlayback: true }, { quoted: m });
  } catch (error) {
    console.error('Error al buscar GIF:', error);
    await sock.sendMessage(m.key.remoteJid, { text: '❌ Ocurrió un error al buscar el GIF.' }, { quoted: m });
  }
}
