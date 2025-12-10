/**
 * @file Plugin Musica - Descarga y envía música desde múltiples plataformas usando Cobalt API
 * @version 2.0.0
 */

import axios from 'axios';
import yts from 'yt-search';
import { obtenerConfig } from '../lib/functions.js';

export const command = '.musica';

export const help = `
Descarga y envía música desde YouTube, SoundCloud y otras plataformas en diferentes formatos.

*Uso:*
  \`.musica <URL o término de búsqueda> [formato]\`

*Formatos disponibles:*
  - mp3 (predeterminado)
  - wav
  - ogg
  - opus
  - m4a

*Ejemplos:*
  - \`.musica Queen - Bohemian Rhapsody\`
  - \`.musica https://www.youtube.com/watch?v=fJ9rUzIMcZQ\`
  - \`.musica https://www.youtube.com/watch?v=fJ9rUzIMcZQ wav\`
  - \`.musica never gonna give you up mp3\`

*Plataformas soportadas:*
  YouTube, SoundCloud, Twitter, TikTok, y más.
`;

// Función para buscar en YouTube
async function buscarEnYouTube(query) {
  try {
    const config = obtenerConfig();
    
    // Si hay API key de Google, usar búsqueda personalizada (mantenemos esta lógica)
    if (config.googleSearchApiKey && config.googleCseId) {
      const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${config.googleSearchApiKey}&cx=${config.googleCseId}&q=${encodeURIComponent(query + ' site:youtube.com')}`;
      const response = await axios.get(searchUrl);
      
      if (response.data.items && response.data.items.length > 0) {
        // Asegurarnos de que el link sea un video de YouTube válido
        const link = response.data.items[0].link;
        if (link.includes('youtube.com/watch')) {
          return link;
        }
      }
    }
    
    // Fallback: usar yt-search para encontrar el primer video
    const searchResult = await yts(query);
    if (searchResult.videos && searchResult.videos.length > 0) {
      return searchResult.videos[0].url;
    }

    return null; // Si no se encuentra nada
  } catch (err) {
    console.error('Error en búsqueda de YouTube:', err);
    return null;
  }
}

// Función para validar si es una URL válida
function esURL(text) {
  try {
    new URL(text);
    return true;
  } catch {
    return false;
  }
}

// Función para descargar usando Cobalt API
async function descargarConCobalt(url, formato = 'mp3') {
  const COBALT_API = 'https://api.cobalt.tools/api/json';
  
  try {
    const response = await axios.post(COBALT_API, {
      url: url,
      vCodec: 'h264',
      vQuality: '720',
      aFormat: formato,
      filenamePattern: 'basic',
      isAudioOnly: true,
      disableMetadata: false
    }, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30 segundos timeout
    });

    if (response.data && response.data.status === 'redirect' && response.data.url) {
      return {
        success: true,
        url: response.data.url,
        filename: response.data.filename || 'audio'
      };
    } else if (response.data && response.data.status === 'picker' && response.data.picker) {
      // Si hay múltiples opciones, tomar la primera
      return {
        success: true,
        url: response.data.picker[0].url,
        filename: response.data.picker[0].filename || 'audio'
      };
    } else {
      return {
        success: false,
        error: response.data.text || 'No se pudo procesar la URL'
      };
    }
  } catch (err) {
    console.error('Error en Cobalt API:', err.message);
    return {
      success: false,
      error: err.response?.data?.text || err.message || 'Error al conectar con el servicio de descarga'
    };
  }
}

export async function run(sock, m, { text }) {
  const chatId = m.key.remoteJid;

  if (!text || text.trim().length === 0) {
    return await sock.sendMessage(chatId, { 
      text: `🎵 *Uso del comando .musica*\n\n` +
            `\`.musica <URL o búsqueda> [formato]\`\n\n` +
            `*Formatos:* mp3, wav, ogg, opus, m4a\n\n` +
            `*Ejemplos:*\n` +
            `• \`.musica Bohemian Rhapsody\`\n` +
            `• \`.musica https://youtu.be/xxxx\`\n` +
            `• \`.musica https://youtu.be/xxxx wav\`\n\n` +
            `*Plataformas:* YouTube, SoundCloud, TikTok, Twitter, etc.`
    }, { quoted: m });
  }

  // Parsear argumentos
  const args = text.trim().split(/\s+/);
  const formatosValidos = ['mp3', 'wav', 'ogg', 'opus', 'm4a'];
  
  // Verificar si el último argumento es un formato
  let formato = 'mp3';
  let query = text.trim();
  
  const ultimoArg = args[args.length - 1].toLowerCase();
  if (formatosValidos.includes(ultimoArg)) {
    formato = ultimoArg;
    query = args.slice(0, -1).join(' ');
  }

  let url = null;

  // Verificar si es una URL directa
  if (esURL(query)) {
    url = query;
  } else {
    // Buscar en YouTube
    await sock.sendMessage(chatId, { 
      text: `🔍 Buscando: *${query}*...` 
    }, { quoted: m });
    
    url = await buscarEnYouTube(query);
    
    if (!url) {
      return await sock.sendMessage(chatId, { 
        text: `❌ No se encontraron resultados para: *${query}*\n\n` +
              `Intenta con una URL directa de YouTube, SoundCloud, etc.`
      }, { quoted: m });
    }
  }

  // Informar inicio de descarga
  await sock.sendMessage(chatId, { 
    text: `⬇️ *Descargando audio...*\n\n` +
          `📎 Formato: *${formato.toUpperCase()}*\n` +
          `🔗 URL: ${url}\n\n` +
          `⏳ Esto puede tardar unos segundos...`
  }, { quoted: m });

  try {
    // Descargar usando Cobalt API
    const resultado = await descargarConCobalt(url, formato);

    if (!resultado.success) {
      return await sock.sendMessage(chatId, { 
        text: `❌ *Error al descargar:*\n${resultado.error}\n\n` +
              `💡 Verifica que la URL sea válida y que el contenido esté disponible.`
      }, { quoted: m });
    }

    // Descargar el archivo de audio
    const audioResponse = await axios.get(resultado.url, {
      responseType: 'arraybuffer',
      timeout: 60000, // 60 segundos para descargar
      maxContentLength: 50 * 1024 * 1024, // 50 MB máximo
      maxBodyLength: 50 * 1024 * 1024
    });

    const buffer = Buffer.from(audioResponse.data);

    // Verificar tamaño
    const maxSizeBytes = 50 * 1024 * 1024; // 50 MB
    if (buffer.length > maxSizeBytes) {
      return await sock.sendMessage(chatId, { 
        text: `❌ El archivo es demasiado grande para WhatsApp (${(buffer.length / 1024 / 1024).toFixed(2)} MB).\n\n` +
              `Intenta con una canción más corta o usa formato MP3 para reducir el tamaño.`
      }, { quoted: m });
    }

    // Determinar mimetype según formato
    const mimetypes = {
      mp3: 'audio/mpeg',
      wav: 'audio/wav',
      ogg: 'audio/ogg',
      opus: 'audio/opus',
      m4a: 'audio/mp4'
    };

    const mimetype = mimetypes[formato] || 'audio/mpeg';
    const filename = resultado.filename || `audio.${formato}`;

    // Enviar audio
    await sock.sendMessage(chatId, {
      audio: buffer,
      mimetype: mimetype,
      fileName: filename,
      ptt: false // No es nota de voz
    }, { quoted: m });

    console.log(`✅ Audio enviado: ${filename} (${(buffer.length / 1024).toFixed(2)} KB)`);

  } catch (err) {
    console.error('Error al procesar audio:', err);
    
    let errorMsg = '❌ Ocurrió un error al procesar el audio.\n\n';
    
    if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') {
      errorMsg += '⏱️ Tiempo de espera agotado. El archivo puede ser muy grande o el servidor está lento.';
    } else if (err.response && err.response.status === 404) {
      errorMsg += '🔍 No se encontró el contenido. Verifica que la URL sea correcta.';
    } else if (err.message && err.message.includes('maxContentLength')) {
      errorMsg += '📦 El archivo es demasiado grande para descargar.';
    } else {
      errorMsg += `💡 Intenta con otra URL o formato.\n\nError: ${err.message}`;
    }
    
    await sock.sendMessage(chatId, { text: errorMsg }, { quoted: m });
  }
}