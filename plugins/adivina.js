/**
 * @file Plugin de Adivina - Juego para adivinar números con recompensas
 * @version 2.0.0
 */

import { db } from './db.js';

export const command = '.adivina';

export const help = `
Juego de adivinar números con recompensas 🎲

*Cómo jugar:*
1. Usa \`.adivina\` para iniciar un juego
2. El bot pensará un número entre 1 y 100
3. Responde con números para adivinar
4. El bot te dirá si es más alto o más bajo
5. ¡Adivina el número y gana puntos!

*Comandos:*
  • \`.adivina\` - Iniciar nuevo juego
  • \`.adivina rendirse\` - Rendirse y ver el número

*Recompensas:*
  • 1-3 intentos: 150 puntos 🏆
  • 4-6 intentos: 100 puntos 🥈
  • 7-10 intentos: 50 puntos 🥉
  • 11+ intentos: 25 puntos 💰

*Nota:* Solo responde con números cuando haya un juego activo.
`;

// Función para calcular recompensa según intentos
function calcularRecompensa(intentos) {
  if (intentos <= 3) return 150;
  if (intentos <= 6) return 100;
  if (intentos <= 10) return 50;
  return 25;
}

// Función para obtener emoji según intentos
function obtenerEmoji(intentos) {
  if (intentos <= 3) return '🏆';
  if (intentos <= 6) return '🥈';
  if (intentos <= 10) return '🥉';
  return '💰';
}

async function iniciarJuego(sock, chatId, userId) {
  try {
    // Verificar si ya hay un juego activo
    const juegoExistente = await db.get(
      'SELECT * FROM adivina WHERE chatId = ? AND userId = ?',
      [chatId, userId]
    );

    if (juegoExistente) {
      return await sock.sendMessage(chatId, {
        text: `⚠️ Ya tienes un juego en curso.\n\n` +
              `📊 Intentos actuales: ${juegoExistente.intentos}\n` +
              `💡 Sigue adivinando o usa \`.adivina rendirse\` para terminar.`
      });
    }

    // Generar número secreto
    const numeroSecreto = Math.floor(Math.random() * 100) + 1;

    // Guardar en base de datos
    await db.run(
      'INSERT INTO adivina (chatId, userId, numeroSecreto, intentos, createdAt) VALUES (?, ?, ?, 0, ?)',
      [chatId, userId, numeroSecreto, new Date().toISOString()]
    );

    await sock.sendMessage(chatId, {
      text: `🎲 *JUEGO DE ADIVINAR* 🎲\n\n` +
            `He pensado un número entre *1 y 100*\n\n` +
            `🎯 ¿Cuál crees que es?\n` +
            `💰 Gana hasta 150 puntos si adivinas rápido\n\n` +
            `💡 Solo responde con un número para jugar\n` +
            `❌ Usa \`.adivina rendirse\` para terminar`
    });

  } catch (error) {
    console.error('Error al iniciar juego de adivina:', error);
    await sock.sendMessage(chatId, {
      text: '❌ Ocurrió un error al iniciar el juego. Intenta nuevamente.'
    });
  }
}

async function procesarIntento(sock, m, numero) {
  const chatId = m.key.remoteJid;
  const userId = m.key.participant || m.key.remoteJid;

  try {
    // Buscar juego activo
    const juego = await db.get(
      'SELECT * FROM adivina WHERE chatId = ? AND userId = ?',
      [chatId, userId]
    );

    if (!juego) {
      return; // No hay juego activo, no hacer nada
    }

    const intenNumber = parseInt(numero);

    if (isNaN(intenNumber) || intenNumber < 1 || intenNumber > 100) {
      return await sock.sendMessage(chatId, {
        text: '❌ Por favor, ingresa un número válido entre 1 y 100.'
      }, { quoted: m });
    }

    // Incrementar intentos
    const nuevosIntentos = juego.intentos + 1;

    if (intenNumber === juego.numeroSecreto) {
      // ¡Adivinó!
      const recompensa = calcularRecompensa(nuevosIntentos);
      const emoji = obtenerEmoji(nuevosIntentos);

      // Actualizar saldo del usuario
      let usuario = await db.get('SELECT * FROM usuarios WHERE chatId = ?', [userId]);
      
      if (!usuario) {
        await db.run('INSERT INTO usuarios (chatId, saldo) VALUES (?, ?)', [userId, 100]);
        usuario = { saldo: 100 };
      }

      const nuevoSaldo = (usuario.saldo || 100) + recompensa;
      await db.run('UPDATE usuarios SET saldo = ? WHERE chatId = ?', [nuevoSaldo, userId]);

      // Eliminar juego
      await db.run('DELETE FROM adivina WHERE chatId = ? AND userId = ?', [chatId, userId]);

      await sock.sendMessage(chatId, {
        text: `🎉 *¡FELICIDADES!* 🎉\n\n` +
              `${emoji} ¡Adivinaste el número *${juego.numeroSecreto}*!\n\n` +
              `📊 Intentos: *${nuevosIntentos}*\n` +
              `💰 Recompensa: *+${recompensa} puntos*\n` +
              `💳 Saldo actual: *${nuevoSaldo} puntos*\n\n` +
              `🎮 Usa \`.adivina\` para jugar de nuevo`
      }, { quoted: m });

    } else {
      // No adivinó
      await db.run(
        'UPDATE adivina SET intentos = ? WHERE chatId = ? AND userId = ?',
        [nuevosIntentos, chatId, userId]
      );

      let pista = '';
      if (intenNumber < juego.numeroSecreto) {
        pista = '⬆️ *El número es MÁS ALTO*';
      } else {
        pista = '⬇️ *El número es MÁS BAJO*';
      }

      // Dar pista adicional cada 5 intentos
      let pistaExtra = '';
      if (nuevosIntentos % 5 === 0) {
        const diferencia = Math.abs(intenNumber - juego.numeroSecreto);
        if (diferencia <= 5) {
          pistaExtra = '\n🔥 ¡Estás muy cerca!';
        } else if (diferencia <= 15) {
          pistaExtra = '\n🌡️ Estás cerca...';
        } else {
          pistaExtra = '\n❄️ Estás lejos...';
        }
      }

      await sock.sendMessage(chatId, {
        text: `${pista}${pistaExtra}\n\n` +
              `📊 Intento ${nuevosIntentos}\n` +
              `💡 Sigue intentando...`
      }, { quoted: m });
    }

  } catch (error) {
    console.error('Error al procesar intento:', error);
    await sock.sendMessage(chatId, {
      text: '❌ Ocurrió un error al procesar tu intento.'
    }, { quoted: m });
  }
}

export async function run(sock, m, { text }) {
  const chatId = m.key.remoteJid;
  const userId = m.key.participant || m.key.remoteJid;

  try {
    if (!text || text.toLowerCase() === 'nuevo' || text.toLowerCase() === 'empezar') {
      // Iniciar nuevo juego
      await iniciarJuego(sock, chatId, userId);
      
    } else if (text.toLowerCase() === 'rendirse' || text.toLowerCase() === 'salir') {
      // Rendirse
      const juego = await db.get(
        'SELECT * FROM adivina WHERE chatId = ? AND userId = ?',
        [chatId, userId]
      );

      if (juego) {
        await db.run('DELETE FROM adivina WHERE chatId = ? AND userId = ?', [chatId, userId]);
        await sock.sendMessage(chatId, {
          text: `😢 *Te rendiste*\n\n` +
                `El número era: *${juego.numeroSecreto}*\n` +
                `Intentos realizados: ${juego.intentos}\n\n` +
                `🎮 Usa \`.adivina\` para jugar de nuevo`
        }, { quoted: m });
      } else {
        await sock.sendMessage(chatId, {
          text: '❌ No tienes un juego activo.\n\nUsa `.adivina` para empezar.'
        }, { quoted: m });
      }
      
    } else {
      // Procesar como intento de número
      await procesarIntento(sock, m, text);
    }

  } catch (error) {
    console.error('Error en comando adivina:', error);
    await sock.sendMessage(chatId, {
      text: '❌ Ocurrió un error. Intenta nuevamente.'
    }, { quoted: m });
  }
}

// Exportar función para que otros plugins puedan procesar números
export async function procesarMensajeNumero(sock, m) {
  const text = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
  const numero = text.trim();
  
  // Solo procesar si es un número simple
  if (/^\d+$/.test(numero)) {
    await procesarIntento(sock, m, numero);
  }
}