/**
 * @file Plugin Acciones - Envía GIFs de anime con acciones interactivas
 * @version 1.0.0
 */

import axios from 'axios';
import { obtenerConfig } from '../lib/functions.js';

export const command = [
  '.pegar', '.golpear', '.slap',
  '.abrazar', '.hug',
  '.besar', '.kiss',
  '.acariciar', '.pat',
  '.morder', '.bite',
  '.abofetar',
  '.abrazo',
  '.palmadita',
  '.cachetada',
  '.pellizcar',
  '.empujar'
];

export const help = `
Envía GIFs de anime con acciones interactivas 🎭

*Acciones disponibles:*
  • \`.pegar\` / \`.golpear\` / \`.slap\` @usuario
  • \`.abrazar\` / \`.hug\` @usuario
  • \`.besar\` / \`.kiss\` @usuario
  • \`.acariciar\` / \`.pat\` @usuario
  • \`.morder\` / \`.bite\` @usuario
  • \`.abofetar\` / \`.cachetada\` @usuario
  • \`.pellizcar\` @usuario
  • \`.empujar\` @usuario

*Uso:*
  Menciona a un usuario para realizar la acción
  
*Ejemplos:*
  - \`.pegar @usuario\` - Le pega a alguien
  - \`.abrazar @usuario\` - Abraza a alguien
  - \`.besar @usuario\` - Besa a alguien

*Nota:* Si no mencionas a nadie, la acción será genérica.
`;

// Mapeo de comandos a términos de búsqueda en inglés para Tenor
const ACCIONES_MAP = {
  '.pegar': 'anime punch',
  '.golpear': 'anime punch',
  '.slap': 'anime slap',
  '.abrazar': 'anime hug',
  '.hug': 'anime hug',
  '.besar': 'anime kiss',
  '.kiss': 'anime kiss',
  '.acariciar': 'anime pat head',
  '.pat': 'anime pat',
  '.morder': 'anime bite',
  '.bite': 'anime bite',
  '.abofetar': 'anime slap',
  '.abrazo': 'anime hug',
  '.palmadita': 'anime pat',
  '.cachetada': 'anime slap face',
  '.pellizcar': 'anime pinch',
  '.empujar': 'anime push'
};

// Textos para cada acción
const TEXTOS_ACCIONES = {
  '.pegar': ['le pegó a', 'golpeó a', 'le dio un puñetazo a'],
  '.golpear': ['golpeó a', 'le pegó a', 'atacó a'],
  '.slap': ['abofeteó a', 'le dio una cachetada a', 'le pegó a'],
  '.abrazar': ['abrazó a', 'le dio un abrazo a', 'está abrazando a'],
  '.hug': ['abrazó a', 'le dio un abrazo a', 'está abrazando a'],
  '.besar': ['besó a', 'le dio un beso a', 'está besando a'],
  '.kiss': ['besó a', 'le dio un beso a', 'está besando a'],
  '.acariciar': ['acarició a', 'le hizo cariños a', 'está mimando a'],
  '.pat': ['le dio palmaditas a', 'acarició la cabeza de', 'mimó a'],
  '.morder': ['mordió a', 'le dio un mordisco a', 'está mordiendo a'],
  '.bite': ['mordió a', 'le dio un mordisco a', 'está mordiendo a'],
  '.abofetar': ['abofeteó a', 'le dio una cachetada a', 'golpeó a'],
  '.abrazo': ['abrazó a', 'le dio un abrazo a', 'está abrazando a'],
  '.palmadita': ['le dio palmaditas a', 'acarició a', 'mimó a'],
  '.cachetada': ['le dio una cachetada a', 'abofeteó a', 'golpeó a'],
  '.pellizcar': ['pellizcó a', 'le dio un pellizco a', 'está pellizcando a'],
  '.empujar': ['empujó a', 'le dio un empujón a', 'está empujando a']
};

// Función para obtener GIF de Tenor
async function obtenerGifTenor(searchTerm, apiKey) {
  try {
    const url = `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(searchTerm)}&key=${apiKey}&limit=20&media_filter=gif`;
    const response = await axios.get(url, { timeout: 10000 });

    if (response.data && response.data.results && response.data.results.length > 0) {
      // Seleccionar un GIF aleatorio de los resultados
      const randomIndex = Math.floor(Math.random() * response.data.results.length);
      const gif = response.data.results[randomIndex];
      return gif.media_formats.gif.url;
    }
    return null;
  } catch (error) {
    console.error('Error al obtener GIF de Tenor:', error.message);
    return null;
  }
}

export async function run(sock, m, { command }) {
  const chatId = m.key.remoteJid;
  const senderId = m.key.participant || m.key.remoteJid;
  const senderName = senderId.split('@')[0];

  try {
    const config = obtenerConfig();
    const tenorApiKey = config.tenorApiKey;

    if (!tenorApiKey) {
      return await sock.sendMessage(chatId, {
        text: '❌ No se ha configurado la API de Tenor. Contacta al administrador del bot.'
      }, { quoted: m });
    }

    // Obtener usuario mencionado
    const mentionedJid = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
    
    // Obtener término de búsqueda para la acción
    const searchTerm = ACCIONES_MAP[command] || 'anime action';
    
    // Obtener textos posibles para la acción
    const textosAccion = TEXTOS_ACCIONES[command] || ['realizó una acción con'];
    const textoAleatorio = textosAccion[Math.floor(Math.random() * textosAccion.length)];

    // Construir mensaje
    let mensaje = '';
    let mentions = [senderId];

    if (mentionedJid) {
      const targetName = mentionedJid.split('@')[0];
      mensaje = `*@${senderName}* ${textoAleatorio} *@${targetName}*! 💫`;
      mentions.push(mentionedJid);
    } else {
      // Si no hay mención, mensaje genérico
      const accionNombre = command.slice(1); // Quitar el punto
      mensaje = `*@${senderName}* está ${accionNombre === 'pegar' ? 'pegando' : accionNombre === 'abrazar' ? 'abrazando' : accionNombre === 'besar' ? 'besando' : 'realizando una acción'}! 💫`;
    }

    // Buscar GIF
    await sock.sendMessage(chatId, {
      text: `🔍 Buscando el GIF perfecto...`
    }, { quoted: m });

    const gifUrl = await obtenerGifTenor(searchTerm, tenorApiKey);

    if (!gifUrl) {
      return await sock.sendMessage(chatId, {
        text: `❌ No se pudo encontrar un GIF para esta acción. Intenta nuevamente.`
      }, { quoted: m });
    }

    // Descargar el GIF
    const gifResponse = await axios.get(gifUrl, {
      responseType: 'arraybuffer',
      timeout: 30000
    });

    const buffer = Buffer.from(gifResponse.data);

    // Enviar GIF con mensaje
    await sock.sendMessage(chatId, {
      video: buffer,
      gifPlayback: true,
      caption: mensaje,
      mentions: mentions
    }, { quoted: m });

  } catch (error) {
    console.error('Error en comando de acción:', error);
    await sock.sendMessage(chatId, {
      text: '❌ Ocurrió un error al procesar la acción. Intenta nuevamente.'
    }, { quoted: m });
  }
}