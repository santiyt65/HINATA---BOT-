import axios from 'axios';
import { obtenerConfig } from '../lib/functions.js';

export const command = '.gif';

export async function run(sock, m, { text }) {
  const config = obtenerConfig();
  const apiKey = config.tenorApiKey;

  if (!apiKey || apiKey === 'TU_API_KEY_DE_TENOR' || apiKey.includes('http')) {
    console.error('Error: La API Key de Tenor no está configurada correctamente en config.json');
    return await sock.sendMessage(m.key.remoteJid, { text: '⚙️ La función de GIF no está configurada. El propietario debe añadir una API Key de Tenor válida.\n\nObtén tu clave en: https://tenor.com/developer/dashboard' }, { quoted: m });
  }

  if (!text) {
    return await sock.sendMessage(m.key.remoteJid, { text: '👾 Escribe algo para buscar un GIF.\n\n*Ejemplo:*\n.gif gatos graciosos' }, { quoted: m });
  }

  try {
    await sock.sendMessage(m.key.remoteJid, { text: `🔎 Buscando GIFs de "${text}"...` }, { quoted: m });

    // Usar la API pública de Tenor sin necesidad de autenticación con búsqueda
    const url = `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(text)}&key=${apiKey}&limit=20&media_filter=mp4,gif`;
    const response = await axios.get(url);
    const results = response.data.results;

    if (!results || results.length === 0) {
      return await sock.sendMessage(m.key.remoteJid, { text: `❌ No encontré GIFs para "${text}".` }, { quoted: m });
    }

    const randomGif = results[Math.floor(Math.random() * results.length)];
    
    // Obtener URL del GIF (intentar múltiples formatos)
    let gifUrl = null;
    if (randomGif.media_formats.gif?.url) {
      gifUrl = randomGif.media_formats.gif.url;
    } else if (randomGif.media_formats.mp4?.url) {
      gifUrl = randomGif.media_formats.mp4.url;
    } else if (randomGif.media_formats.webm?.url) {
      gifUrl = randomGif.media_formats.webm.url;
    }

    if (!gifUrl) {
      return await sock.sendMessage(m.key.remoteJid, { text: '❌ No se pudo obtener el formato del GIF.' }, { quoted: m });
    }

    // Detectar formato y enviar adecuadamente
    if (gifUrl.endsWith('.mp4')) {
      await sock.sendMessage(m.key.remoteJid, { video: { url: gifUrl }, caption: `✨ GIF para: *${text}*`, gifPlayback: true }, { quoted: m });
    } else {
      await sock.sendMessage(m.key.remoteJid, { image: { url: gifUrl }, caption: `✨ GIF para: *${text}*` }, { quoted: m });
    }
  } catch (error) {
    console.error('Error al buscar GIF:', error.response?.status, error.message);
    if (error.response?.status === 401) {
      await sock.sendMessage(m.key.remoteJid, { text: '❌ La API Key de Tenor no es válida. Obtén una en: https://tenor.com/developer/dashboard' }, { quoted: m });
    } else if (error.response?.status === 403) {
      await sock.sendMessage(m.key.remoteJid, { text: '❌ Acceso denegado. Verifica tu API Key de Tenor.' }, { quoted: m });
    } else {
      await sock.sendMessage(m.key.remoteJid, { text: '❌ Ocurrió un error al buscar el GIF.' }, { quoted: m });
    }
  }
}
