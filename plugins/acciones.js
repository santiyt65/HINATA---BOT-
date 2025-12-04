/**
 * @file Plugin Acciones - Envía GIFs de anime con acciones interactivas
 * @version 2.0.0
 * @description Usa la API de Nekos.best para GIFs de anime de alta calidad
 */

import axios from 'axios';

export const command = [
  '.pegar', '.slap',
  '.abrazar', '.hug',
  '.besar', '.kiss',
  '.acariciar', '.pat',
  '.morder', '.bite',
  '.alimentar', '.feed',
  '.sonrojar', '.blush',
  '.sonreir', '.smile',
  '.saludar', '.wave',
  '.bailar', '.dance',
  '.llorar', '.cry',
  '.reir', '.laugh',
  '.dormir', '.sleep',
  '.pensar', '.think',
  '.guiñar', '.wink',
  '.abrazar2', '.cuddle',
  '.bofetada', '.slap',
  '.patada', '.kick',
  '.picar', '.poke',
  '.cosquillas', '.tickle'
];

export const help = `
Envía GIFs de anime con acciones interactivas 🎭

*Acciones disponibles:*

*Agresivas:* 👊
  • \`.pegar\` / \`.slap\` @usuario
  • \`.bofetada\` @usuario
  • \`.patada\` / \`.kick\` @usuario
  • \`.morder\` / \`.bite\` @usuario

*Cariñosas:* 💕
  • \`.abrazar\` / \`.hug\` @usuario
  • \`.besar\` / \`.kiss\` @usuario
  • \`.acariciar\` / \`.pat\` @usuario
  • \`.abrazar2\` / \`.cuddle\` @usuario
  • \`.alimentar\` / \`.feed\` @usuario

*Interactivas:* 🎪
  • \`.picar\` / \`.poke\` @usuario
  • \`.cosquillas\` / \`.tickle\` @usuario
  • \`.saludar\` / \`.wave\` @usuario
  • \`.bailar\` / \`.dance\` @usuario
  • \`.guiñar\` / \`.wink\` @usuario

*Emocionales:* 😊
  • \`.sonrojar\` / \`.blush\`
  • \`.sonreir\` / \`.smile\`
  • \`.llorar\` / \`.cry\`
  • \`.reir\` / \`.laugh\`
  • \`.dormir\` / \`.sleep\`
  • \`.pensar\` / \`.think\`

*Uso:*
  Menciona a un usuario para realizar la acción
  
*Ejemplos:*
  - \`.pegar @usuario\` - Le pega a alguien
  - \`.abrazar @usuario\` - Abraza a alguien
  - \`.besar @usuario\` - Besa a alguien
  - \`.llorar\` - Llora (sin mención)

*Nota:* Usa la API de Nekos.best - GIFs de alta calidad
`;

// Mapeo de comandos a endpoints de Nekos.best API
const ACCIONES_MAP = {
  '.pegar': 'slap',
  '.slap': 'slap',
  '.abrazar': 'hug',
  '.hug': 'hug',
  '.besar': 'kiss',
  '.kiss': 'kiss',
  '.acariciar': 'pat',
  '.pat': 'pat',
  '.morder': 'bite',
  '.bite': 'bite',
  '.alimentar': 'feed',
  '.feed': 'feed',
  '.sonrojar': 'blush',
  '.blush': 'blush',
  '.sonreir': 'smile',
  '.smile': 'smile',
  '.saludar': 'wave',
  '.wave': 'wave',
  '.bailar': 'dance',
  '.dance': 'dance',
  '.llorar': 'cry',
  '.cry': 'cry',
  '.reir': 'laugh',
  '.laugh': 'laugh',
  '.dormir': 'sleep',
  '.sleep': 'sleep',
  '.pensar': 'think',
  '.think': 'think',
  '.guiñar': 'wink',
  '.wink': 'wink',
  '.abrazar2': 'cuddle',
  '.cuddle': 'cuddle',
  '.bofetada': 'slap',
  '.patada': 'kick',
  '.kick': 'kick',
  '.picar': 'poke',
  '.poke': 'poke',
  '.cosquillas': 'tickle',
  '.tickle': 'tickle'
};

// Textos para cada acción
const TEXTOS_ACCIONES = {
  'slap': ['le pegó a', 'abofeteó a', 'le dio una cachetada a'],
  'hug': ['abrazó a', 'le dio un abrazo a', 'está abrazando a'],
  'kiss': ['besó a', 'le dio un beso a', 'está besando a'],
  'pat': ['acarició a', 'le hizo cariños a', 'le dio palmaditas a'],
  'bite': ['mordió a', 'le dio un mordisco a', 'está mordiendo a'],
  'feed': ['alimentó a', 'le dio de comer a', 'está alimentando a'],
  'blush': ['se sonrojó', 'está sonrojado/a', 'se puso rojo/a'],
  'smile': ['sonrió', 'está sonriendo', 'tiene una sonrisa'],
  'wave': ['saludó a', 'le hizo señas a', 'está saludando a'],
  'dance': ['bailó con', 'está bailando con', 'invitó a bailar a'],
  'cry': ['está llorando', 'lloró', 'se puso a llorar'],
  'laugh': ['se rió', 'está riendo', 'se carcajeó'],
  'sleep': ['se durmió', 'está durmiendo', 'se fue a dormir'],
  'think': ['está pensando', 'reflexionó', 'se puso a pensar'],
  'wink': ['le guiñó el ojo a', 'le hizo un guiño a', 'guiñó a'],
  'cuddle': ['acurrucó a', 'se acurrucó con', 'está mimando a'],
  'kick': ['pateó a', 'le dio una patada a', 'golpeó con el pie a'],
  'poke': ['picó a', 'le dio un toque a', 'está molestando a'],
  'tickle': ['le hizo cosquillas a', 'está haciéndole cosquillas a', 'molestó a']
};

// Función para obtener GIF de Nekos.best API
async function obtenerGifNekos(action) {
  try {
    const url = `https://nekos.best/api/v2/${action}`;
    const response = await axios.get(url, { timeout: 10000 });

    if (response.data && response.data.results && response.data.results.length > 0) {
      // Nekos.best devuelve un array de resultados, tomamos el primero
      return response.data.results[0].url;
    }
    return null;
  } catch (error) {
    console.error('Error al obtener GIF de Nekos.best:', error.message);
    return null;
  }
}

export async function run(sock, m, { command }) {
  const chatId = m.key.remoteJid;
  const senderId = m.key.participant || m.key.remoteJid;
  const senderName = senderId.split('@')[0];

  try {
    // Obtener usuario mencionado
    const mentionedJid = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
    
    // Obtener acción de la API
    const action = ACCIONES_MAP[command];
    
    if (!action) {
      return await sock.sendMessage(chatId, {
        text: '❌ Acción no reconocida. Usa `.help acciones` para ver las acciones disponibles.'
      }, { quoted: m });
    }

    // Obtener textos posibles para la acción
    const textosAccion = TEXTOS_ACCIONES[action] || ['realizó una acción con'];
    const textoAleatorio = textosAccion[Math.floor(Math.random() * textosAccion.length)];

    // Construir mensaje
    let mensaje = '';
    let mentions = [senderId];

    // Acciones que no requieren mención (emocionales)
    const accionesSinMencion = ['blush', 'smile', 'cry', 'laugh', 'sleep', 'think'];

    if (mentionedJid && !accionesSinMencion.includes(action)) {
      const targetName = mentionedJid.split('@')[0];
      mensaje = `*@${senderName}* ${textoAleatorio} *@${targetName}*! 💫`;
      mentions.push(mentionedJid);
    } else {
      // Mensaje sin mención
      mensaje = `*@${senderName}* ${textoAleatorio}! 💫`;
    }

    // Buscar GIF
    const gifUrl = await obtenerGifNekos(action);

    if (!gifUrl) {
      return await sock.sendMessage(chatId, {
        text: `❌ No se pudo obtener el GIF. Intenta nuevamente o usa otra acción.`
      }, { quoted: m });
    }

    // Descargar el GIF
    const gifResponse = await axios.get(gifUrl, {
      responseType: 'arraybuffer',
      timeout: 30000,
      maxContentLength: 50 * 1024 * 1024 // 50 MB máximo
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
    
    let errorMsg = '❌ Ocurrió un error al procesar la acción.';
    
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      errorMsg += '\n⏱️ Tiempo de espera agotado. Intenta nuevamente.';
    } else if (error.response && error.response.status === 404) {
      errorMsg += '\n🔍 Acción no disponible en este momento.';
    }
    
    await sock.sendMessage(chatId, { text: errorMsg }, { quoted: m });
  }
}