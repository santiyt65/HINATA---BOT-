/**
 * @file Plugin Payasos - Muestra una lista aleatoria de "payasos" del grupo
 * @version 1.0.0
 */

export const command = '.payasos';

export const help = `
Muestra una lista aleatoria de los "payasos" del grupo 🤡

*Uso:*
  \`.payasos\` - Muestra 5 payasos aleatorios
  \`.payasos [número]\` - Muestra el número especificado de payasos (máx. 20)

*Ejemplos:*
  - \`.payasos\` - Lista 5 payasos
  - \`.payasos 10\` - Lista 10 payasos
  
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

    // Filtrar solo participantes activos (no administradores del bot si se desea)
    const activeParticipants = participants.filter(p => !p.id.includes('bot'));

    if (activeParticipants.length === 0) {
      return await sock.sendMessage(chatId, { 
        text: '❌ No hay suficientes participantes en el grupo.' 
      }, { quoted: m });
    }

    // Determinar cuántos payasos mostrar
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
    const payasosSeleccionados = [];
    const participantesCopia = [...activeParticipants];

    for (let i = 0; i < cantidad; i++) {
      const randomIndex = Math.floor(Math.random() * participantesCopia.length);
      payasosSeleccionados.push(participantesCopia[randomIndex]);
      participantesCopia.splice(randomIndex, 1);
    }

    // Emojis de payaso variados
    const emojisPayaso = ['🤡', '🎪', '🎭', '🃏', '🎨', '🎉', '🎊', '🎈'];

    // Construir mensaje
    let mensaje = `🎪 *LISTA DE PAYASOS DEL GRUPO* 🎪\n\n`;
    mensaje += `🤡 *Top ${cantidad} Payasos del Circo:*\n\n`;

    payasosSeleccionados.forEach((participant, index) => {
      const emoji = emojisPayaso[index % emojisPayaso.length];
      const numero = index + 1;
      const nombre = participant.id.split('@')[0];
      
      // Agregar medallas para los primeros 3
      let medalla = '';
      if (numero === 1) medalla = '🥇';
      else if (numero === 2) medalla = '🥈';
      else if (numero === 3) medalla = '🥉';
      
      mensaje += `${medalla} ${emoji} *${numero}.* @${nombre}\n`;
    });

    mensaje += `\n🎭 *¡Felicidades a todos los payasos!* 🎭\n`;
    mensaje += `_Este es un ranking aleatorio con fines de entretenimiento._`;

    // Enviar mensaje mencionando a los usuarios
    await sock.sendMessage(chatId, { 
      text: mensaje,
      mentions: payasosSeleccionados.map(p => p.id)
    }, { quoted: m });

  } catch (err) {
    console.error('Error en comando payasos:', err);
    await sock.sendMessage(chatId, { 
      text: '❌ Ocurrió un error al obtener la lista de payasos. Intenta nuevamente.' 
    }, { quoted: m });
  }
}