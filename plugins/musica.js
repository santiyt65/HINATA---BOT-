/**
 * @file Plugin Musica - Descarga y envía música en MP3 desde YouTube
 * @version 1.0.0
 */

import ytdl from 'ytdl-core';
import ytSearch from 'yt-search';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from '@ffmpeg-installer/ffmpeg';
import Stream from 'stream';
import { obtenerConfig } from '../lib/functions.js';

ffmpeg.setFfmpegPath(ffmpegPath.path);

export const command = '.musica';

export async function run(sock, m, { text }) {
  const chatId = m.key.remoteJid;
  const config = obtenerConfig();

  if (!text || text.trim().length === 0) {
    return await sock.sendMessage(chatId, { text: '🎵 Uso: .musica <URL de YouTube o término de búsqueda>\nEjemplo: .musica https://youtu.be/xxxx\n         .musica never gonna give you up' }, { quoted: m });
  }

  let query = text.trim();
  let url = null;

  // Si es URL válida de YouTube, usarla; si no, buscar en YouTube
  try {
    if (ytdl.validateURL(query)) {
      url = query;
    } else {
      const search = await ytSearch(query);
      const first = search && search.videos && search.videos.length ? search.videos[0] : null;
      if (!first) {
        return await sock.sendMessage(chatId, { text: `❌ No encontré resultados para: ${query}` }, { quoted: m });
      }
      url = first.url;
    }
  } catch (err) {
    console.error('Error al buscar o validar URL:', err);
    return await sock.sendMessage(chatId, { text: '❌ Ocurrió un error al buscar la canción. Intenta con otra búsqueda.' }, { quoted: m });
  }

  // Informar inicio
  await sock.sendMessage(chatId, { text: `🔽 Descargando audio de: ${url}\n⏳ Esto puede tardar unos segundos...` }, { quoted: m });

  try {
    const info = await ytdl.getInfo(url);
    const titleRaw = info.videoDetails?.title || 'musica';
    const title = titleRaw.replace(/[\\/:*?"<>|]/g, '').slice(0, 64);

    const audioStream = ytdl(url, { quality: 'highestaudio' });

    // Convertir a MP3 con ffmpeg y recolectar en buffer
    const pass = new Stream.PassThrough();
    const chunks = [];

    // Pipe ffmpeg output to pass-through stream
    ffmpeg(audioStream)
      .audioBitrate(128)
      .format('mp3')
      .on('error', function(err) {
        console.error('FFmpeg error:', err.message || err);
        pass.emit('error', err);
      })
      .on('end', function() {
        pass.end();
      })
      .pipe(pass, { end: true });

    await new Promise((resolve, reject) => {
      pass.on('data', chunk => chunks.push(chunk));
      pass.on('end', resolve);
      pass.on('error', reject);
    });

    const buffer = Buffer.concat(chunks);

    // Tamaño máximo prudente (WhatsApp tiene límites). Si es muy grande, notificar.
    const maxSizeBytes = 50 * 1024 * 1024; // 50 MB
    if (buffer.length > maxSizeBytes) {
      return await sock.sendMessage(chatId, { text: '❌ La pista es demasiado grande para enviar por WhatsApp. Intenta una canción más corta.' }, { quoted: m });
    }

    // Enviar audio como MP3
    await sock.sendMessage(chatId, {
      audio: buffer,
      mimetype: 'audio/mpeg',
      fileName: `${title}.mp3`
    }, { quoted: m });

  } catch (err) {
    console.error('Error descargando o procesando audio:', err);
    await sock.sendMessage(chatId, { text: '❌ Ocurrió un error al generar el MP3. Intenta con otra canción.' }, { quoted: m });
  }
}
