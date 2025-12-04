/**
 * @file Plugin Misiones - Sistema de misiones diarias para ganar saldo
 * @version 1.0.0
 */

import { db } from './db.js';

export const command = ['.mision', '.misiondiaria', '.completarmision'];

// Lista de misiones disponibles con diferentes dificultades
const MISIONES = [
  // Misiones fáciles (50-100 puntos)
  { texto: 'Envía un sticker al grupo', recompensa: 50, dificultad: 'Fácil', emoji: '🎨' },
  { texto: 'Saluda a todos los miembros del grupo', recompensa: 60, dificultad: 'Fácil', emoji: '👋' },
  { texto: 'Comparte un meme divertido', recompensa: 70, dificultad: 'Fácil', emoji: '😂' },
  { texto: 'Envía una foto de tu mascota o comida favorita', recompensa: 80, dificultad: 'Fácil', emoji: '📸' },
  { texto: 'Cuenta un chiste al grupo', recompensa: 75, dificultad: 'Fácil', emoji: '🤣' },
  
  // Misiones medias (100-200 puntos)
  { texto: 'Juega 3 partidas de cualquier juego del bot', recompensa: 120, dificultad: 'Media', emoji: '🎮' },
  { texto: 'Ayuda a otro miembro del grupo con algo', recompensa: 150, dificultad: 'Media', emoji: '🤝' },
  { texto: 'Comparte una canción usando .musica', recompensa: 130, dificultad: 'Media', emoji: '🎵' },
  { texto: 'Busca y comparte información interesante con .google', recompensa: 140, dificultad: 'Media', emoji: '🔍' },
  { texto: 'Crea 5 stickers diferentes', recompensa: 160, dificultad: 'Media', emoji: '🎭' },
  
  // Misiones difíciles (200-300 puntos)
  { texto: 'Gana 3 juegos seguidos en el bot', recompensa: 250, dificultad: 'Difícil', emoji: '🏆' },
  { texto: 'Mantén una conversación activa por 30 minutos', recompensa: 220, dificultad: 'Difícil', emoji: '💬' },
  { texto: 'Consigue que 5 personas usen comandos del bot', recompensa: 280, dificultad: 'Difícil', emoji: '👥' },
  { texto: 'Encuentra y comparte 3 GIFs temáticos', recompensa: 230, dificultad: 'Difícil', emoji: '🎬' },
  { texto: 'Organiza una actividad grupal divertida', recompensa: 300, dificultad: 'Difícil', emoji: '🎉' },
];

export const help = `
Sistema de misiones diarias para ganar saldo 💰

*Comandos:*
  \`.mision\` o \`.misiondiaria\` - Obtén tu misión del día
  \`.completarmision\` - Marca tu misión como completada

*Cómo funciona:*
1. Usa \`.mision\` para recibir una misión aleatoria
2. Completa la misión descrita
3. Usa \`.completarmision\` para recibir tu recompensa
4. Solo puedes completar 1 misión cada 24 horas

*Dificultades:*
  🟢 Fácil: 50-100 puntos
  🟡 Media: 100-200 puntos
  🔴 Difícil: 200-300 puntos

*Nota:* Las misiones se renuevan cada 24 horas.
`;

// Función para obtener o crear misión del usuario
async function obtenerMisionUsuario(userId) {
  try {
    const ahora = new Date();
    const hace24h = new Date(ahora.getTime() - 24 * 60 * 60 * 1000);

    // Buscar misión activa del usuario
    let mision = await db.get(
      'SELECT * FROM misiones WHERE userId = ? AND completada = 0 AND createdAt > ?',
      [userId, hace24h.toISOString()]
    );

    if (mision) {
      return {
        existe: true,
        mision: JSON.parse(mision.misionData),
        completada: false,
        id: mision.id
      };
    }

    // Verificar si completó una misión en las últimas 24h
    const misionReciente = await db.get(
      'SELECT * FROM misiones WHERE userId = ? AND completada = 1 AND completedAt > ?',
      [userId, hace24h.toISOString()]
    );

    if (misionReciente) {
      const tiempoRestante = 24 * 60 * 60 * 1000 - (ahora - new Date(misionReciente.completedAt));
      const horasRestantes = Math.ceil(tiempoRestante / (60 * 60 * 1000));
      return {
        existe: false,
        cooldown: true,
        horasRestantes
      };
    }

    return { existe: false, cooldown: false };
  } catch (error) {
    console.error('Error al obtener misión:', error);
    return { existe: false, error: true };
  }
}

// Función para crear nueva misión
async function crearNuevaMision(userId) {
  try {
    // Seleccionar misión aleatoria
    const misionAleatoria = MISIONES[Math.floor(Math.random() * MISIONES.length)];

    // Guardar en base de datos
    const result = await db.run(
      'INSERT INTO misiones (userId, misionData, recompensa, completada, createdAt) VALUES (?, ?, ?, 0, ?)',
      [userId, JSON.stringify(misionAleatoria), misionAleatoria.recompensa, new Date().toISOString()]
    );

    return {
      success: true,
      mision: misionAleatoria,
      id: result.lastID
    };
  } catch (error) {
    console.error('Error al crear misión:', error);
    return { success: false };
  }
}

export async function run(sock, m, { command }) {
  const chatId = m.key.remoteJid;
  const userId = m.key.participant || m.key.remoteJid;

  try {
    // Asegurar que la tabla de misiones existe
    await db.run(`
      CREATE TABLE IF NOT EXISTS misiones (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId TEXT NOT NULL,
        misionData TEXT NOT NULL,
        recompensa INTEGER NOT NULL,
        completada INTEGER DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        completedAt DATETIME
      )
    `);

    if (command === '.mision' || command === '.misiondiaria') {
      // Obtener misión actual del usuario
      const resultado = await obtenerMisionUsuario(userId);

      if (resultado.error) {
        return await sock.sendMessage(chatId, {
          text: '❌ Ocurrió un error al obtener tu misión. Intenta nuevamente.'
        }, { quoted: m });
      }

      if (resultado.cooldown) {
        return await sock.sendMessage(chatId, {
          text: `⏰ *Ya completaste tu misión diaria*\n\n` +
                `Podrás obtener una nueva misión en *${resultado.horasRestantes} horas*.\n\n` +
                `💡 Mientras tanto, puedes usar otros comandos del bot.`
        }, { quoted: m });
      }

      if (resultado.existe) {
        const mision = resultado.mision;
        return await sock.sendMessage(chatId, {
          text: `📋 *TU MISIÓN ACTUAL*\n\n` +
                `${mision.emoji} *Misión:* ${mision.texto}\n\n` +
                `🎯 *Dificultad:* ${mision.dificultad}\n` +
                `💰 *Recompensa:* ${mision.recompensa} puntos\n\n` +
                `✅ Cuando completes la misión, usa:\n` +
                `\`.completarmision\` para recibir tu recompensa.`
        }, { quoted: m });
      }

      // Crear nueva misión
      const nuevaMision = await crearNuevaMision(userId);

      if (!nuevaMision.success) {
        return await sock.sendMessage(chatId, {
          text: '❌ No se pudo crear tu misión. Intenta nuevamente.'
        }, { quoted: m });
      }

      const mision = nuevaMision.mision;
      await sock.sendMessage(chatId, {
        text: `🎯 *¡NUEVA MISIÓN ASIGNADA!*\n\n` +
              `${mision.emoji} *Misión:* ${mision.texto}\n\n` +
              `🎯 *Dificultad:* ${mision.dificultad}\n` +
              `💰 *Recompensa:* ${mision.recompensa} puntos\n\n` +
              `✅ Cuando completes la misión, usa:\n` +
              `\`.completarmision\` para recibir tu recompensa.\n\n` +
              `⏰ Tienes 24 horas para completarla.`
      }, { quoted: m });

    } else if (command === '.completarmision') {
      // Verificar si tiene misión activa
      const resultado = await obtenerMisionUsuario(userId);

      if (resultado.error) {
        return await sock.sendMessage(chatId, {
          text: '❌ Ocurrió un error. Intenta nuevamente.'
        }, { quoted: m });
      }

      if (!resultado.existe) {
        return await sock.sendMessage(chatId, {
          text: '❌ No tienes ninguna misión activa.\n\nUsa `.mision` para obtener una nueva misión.'
        }, { quoted: m });
      }

      // Marcar misión como completada
      await db.run(
        'UPDATE misiones SET completada = 1, completedAt = ? WHERE id = ?',
        [new Date().toISOString(), resultado.id]
      );

      // Agregar recompensa al saldo del usuario
      const mision = resultado.mision;
      
      // Verificar si el usuario existe en la tabla de usuarios
      let usuario = await db.get('SELECT * FROM usuarios WHERE chatId = ?', [userId]);
      
      if (!usuario) {
        await db.run('INSERT INTO usuarios (chatId, saldo) VALUES (?, ?)', [userId, 100]);
        usuario = { saldo: 100 };
      }

      const nuevoSaldo = (usuario.saldo || 100) + mision.recompensa;
      await db.run('UPDATE usuarios SET saldo = ? WHERE chatId = ?', [nuevoSaldo, userId]);

      await sock.sendMessage(chatId, {
        text: `✅ *¡MISIÓN COMPLETADA!*\n\n` +
              `${mision.emoji} ${mision.texto}\n\n` +
              `💰 *Recompensa recibida:* +${mision.recompensa} puntos\n` +
              `💳 *Saldo actual:* ${nuevoSaldo} puntos\n\n` +
              `🎉 ¡Excelente trabajo!\n` +
              `⏰ Podrás obtener una nueva misión en 24 horas.`
      }, { quoted: m });
    }

  } catch (error) {
    console.error('Error en comando misiones:', error);
    await sock.sendMessage(chatId, {
      text: '❌ Ocurrió un error al procesar tu misión. Intenta nuevamente.'
    }, { quoted: m });
  }
}