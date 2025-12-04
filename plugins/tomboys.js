/**
 * @file Plugin Tomboys - Muestra una lista aleatoria de "tomboys" del grupo
 * @version 1.0.0
 */

export const command = '.tomboys';

export const help = `
Muestra una lista aleatoria de las "tomboys" del grupo 🏀

*Uso:*
  \`.tomboys\` - Muestra 5 tomboys aleatorias
  \`.tomboys [número]\` - Muestra el número especificado de tomboys (máx. 20)

*Ejemplos:*
  - \`.tomboys\` - Lista 5 tomboys
  - \`.tomboys 10\` - Lista 10 tomboys
  
*Nota:* Este comando solo funciona en grupos.
`;

export async function run(sock, m, { text }) {
  const chatId = m.key.remoteJid;

  // Verificar que sea un grupo
  if (!chatId.endsWith('@g.us')) {
    return await sock.sendMessage(chatId, { 
      text: '❌ Este comando solo funciona en grupos.' 
    }, { quoted: m });
  }

  try {
    // Obtener metadata del grupo
    const groupMetadata = await sock.groupMetadata(chatId);
    const participants = groupMetadata.participants;

    if (!participants || participants.length === 0) {
      return await sock.sendMessage(chatId, { 
        text: '❌ No se pudo obtener la lista de participantes del grupo.' 
      }, { quoted: m });
    }

    // Filtrar participantes activos
    const activeParticipants = participants.filter(p => !p.id.includes('bot'));

    if (activeParticipants.length === 0) {
      return await sock.sendMessage(chatId, { 
        text: '❌ No hay suficientes participantes en el grupo.' 
      }, { quoted: m });
    }

    // Determinar cuántas tomboys mostrar
    let cantidad = 5;
    if (text && text.trim()) {
      const num = parseInt(text.trim());
      if (!isNaN(num) && num > 0) {
        cantidad = Math.min(num, 20); // Máximo 20
      }
    }

    // Ajustar si hay menos participantes que la cantidad solicitada
    cantidad = Math.min(cantidad, activeParticipants.length);

    // Seleccionar participantes aleatorios
    const tomboysSeleccionadas = [];
    const participantesCopia = [...activeParticipants];

    for (let i = 0; i < cantidad; i++) {
      const randomIndex = Math.floor(Math.random() * participantesCopia.length);
      tomboysSeleccionadas.push(participantesCopia[randomIndex]);
      participantesCopia.splice(randomIndex, 1);
    }

    // Emojis deportivos y casuales
    const emojis = ['🏀', '⚽', '🎮', '🛹', '🎸', '⚡', '🔥', '💪'];

    // Construir mensaje
    let mensaje = `⚡ *LISTA DE TOMBOYS DEL GRUPO* ⚡\n\n`;
    mensaje += `🏀 *Top ${cantidad} Tomboys:*\n\n`;

    tomboysSeleccionadas.forEach((participant, index) => {
      const emoji = emojis[index % emojis.length];
      const numero = index + 1;
      const nombre = participant.id.split('@')[0];
      
      // Agregar trofeos para los primeros 3
      let trofeo = '';
      if (numero === 1) trofeo = '🏆';
      else if (numero === 2) trofeo = '🥈';
      else if (numero === 3) trofeo = '🥉';
      
      mensaje += `${trofeo} ${emoji} *${numero}.* @${nombre}\n`;
    });

    mensaje += `\n💪 *¡Felicidades a todas las tomboys!* 💪\n`;
    mensaje += `_Este es un ranking aleatorio con fines de entretenimiento._`;

    // Enviar mensaje mencionando a los usuarios
    await sock.sendMessage(chatId, { 
      text: mensaje,
      mentions: tomboysSeleccionadas.map(p => p.id)
    }, { quoted: m });

  } catch (err) {
    console.error('Error en comando tomboys:', err);
    await sock.sendMessage(chatId, { 
      text: '❌ Ocurrió un error al obtener la lista de tomboys. Intenta nuevamente.' 
    }, { quoted: m });
  }
}