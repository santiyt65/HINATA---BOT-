/**
 * @file Plugin Robar - Roba saldo de otros usuarios con riesgo
 * @version 1.0.0
 */

import { db } from './db.js';

export const command = '.robar';

export const help = `
Intenta robar saldo de otro usuario 💰🔫

*Cómo funciona:*
1. Menciona a un usuario para intentar robarle
2. Hay 50% de probabilidad de éxito
3. Si tienes éxito, robas entre 20-50% de su saldo
4. Si fallas, pierdes entre 10-30% de tu saldo
5. Solo puedes robar cada 2 horas

*Uso:*
  \`.robar @usuario\` - Intenta robar a alguien

*Requisitos:*
  • El objetivo debe tener al menos 50 puntos
  • Tú debes tener al menos 30 puntos
  • No puedes robar al propietario del bot
  • Cooldown de 2 horas entre robos

*Ejemplos:*
  - \`.robar @usuario\` - Intenta el robo

*Nota:* ¡Usa con precaución! Puedes perder puntos si fallas.
`;

// Cooldown en milisegundos (2 horas)
const COOLDOWN_MS = 2 * 60 * 60 * 1000;

async function verificarCooldown(userId) {
    try {
        const ultimoRobo = await db.get(
            'SELECT * FROM robos WHERE userId = ? ORDER BY createdAt DESC LIMIT 1',
            [userId]
        );

        if (!ultimoRobo) {
            return { enCooldown: false };
        }

        const ahora = new Date();
        const ultimaFecha = new Date(ultimoRobo.createdAt);
        const tiempoTranscurrido = ahora - ultimaFecha;

        if (tiempoTranscurrido < COOLDOWN_MS) {
            const tiempoRestante = COOLDOWN_MS - tiempoTranscurrido;
            const horasRestantes = Math.floor(tiempoRestante / (60 * 60 * 1000));
            const minutosRestantes = Math.floor((tiempoRestante % (60 * 60 * 1000)) / (60 * 1000));
            
            return {
                enCooldown: true,
                horasRestantes,
                minutosRestantes
            };
        }

        return { enCooldown: false };

    } catch (error) {
        console.error('Error al verificar cooldown:', error);
        return { enCooldown: false };
    }
}

async function registrarRobo(userId, targetId, exitoso, cantidadRobada) {
    try {
        await db.run(
            'INSERT INTO robos (userId, targetId, exitoso, cantidad, createdAt) VALUES (?, ?, ?, ?, ?)',
            [userId, targetId, exitoso ? 1 : 0, cantidadRobada, new Date().toISOString()]
        );
    } catch (error) {
        console.error('Error al registrar robo:', error);
    }
}

export async function run(sock, m) {
    const chatId = m.key.remoteJid;
    const userId = m.key.participant || m.key.remoteJid;

    try {
        // Asegurar que la tabla de robos existe
        await db.run(`
            CREATE TABLE IF NOT EXISTS robos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                userId TEXT NOT NULL,
                targetId TEXT NOT NULL,
                exitoso INTEGER NOT NULL,
                cantidad INTEGER NOT NULL,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Obtener usuario mencionado
        const mentionedJid = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];

        if (!mentionedJid) {
            return await sock.sendMessage(chatId, {
                text: `💰 *COMANDO ROBAR* 💰\n\n` +
                      `*Uso:* \`.robar @usuario\`\n\n` +
                      `*Cómo funciona:*\n` +
                      `• 50% probabilidad de éxito\n` +
                      `• Éxito: Robas 20-50% del saldo\n` +
                      `• Fallo: Pierdes 10-30% de tu saldo\n` +
                      `• Cooldown: 2 horas\n\n` +
                      `⚠️ Menciona a alguien para robarle`
            }, { quoted: m });
        }

        // Verificar que no se robe a sí mismo
        if (mentionedJid === userId) {
            return await sock.sendMessage(chatId, {
                text: '❌ No puedes robarte a ti mismo. 🤦'
            }, { quoted: m });
        }

        // Verificar que no sea el bot
        if (mentionedJid === sock.user.id) {
            return await sock.sendMessage(chatId, {
                text: '🤖 ¡No puedes robarle al bot! Soy inmune a tus travesuras. 😎'
            }, { quoted: m });
        }

        // Verificar cooldown
        const cooldownCheck = await verificarCooldown(userId);
        if (cooldownCheck.enCooldown) {
            return await sock.sendMessage(chatId, {
                text: `⏰ *Cooldown Activo*\n\n` +
                      `Debes esperar *${cooldownCheck.horasRestantes}h ${cooldownCheck.minutosRestantes}m* antes de robar nuevamente.\n\n` +
                      `💡 Mientras tanto, puedes ganar puntos con:\n` +
                      `• \`.mision\` - Misiones diarias\n` +
                      `• \`.trivia\` - Preguntas y respuestas\n` +
                      `• \`.adivina\` - Adivina el número\n` +
                      `• \`.ahorcado\` - Juego del ahorcado`
            }, { quoted: m });
        }

        // Obtener saldo del ladrón
        let ladron = await db.get('SELECT * FROM usuarios WHERE chatId = ?', [userId]);
        if (!ladron) {
            await db.run('INSERT INTO usuarios (chatId, saldo) VALUES (?, ?)', [userId, 100]);
            ladron = { saldo: 100 };
        }

        if (ladron.saldo < 30) {
            return await sock.sendMessage(chatId, {
                text: `❌ *Saldo Insuficiente*\n\n` +
                      `Necesitas al menos *30 puntos* para intentar un robo.\n` +
                      `Tu saldo actual: *${ladron.saldo} puntos*\n\n` +
                      `💡 Gana más puntos con \`.mision\` o jugando`
            }, { quoted: m });
        }

        // Obtener saldo de la víctima
        let victima = await db.get('SELECT * FROM usuarios WHERE chatId = ?', [mentionedJid]);
        if (!victima) {
            await db.run('INSERT INTO usuarios (chatId, saldo) VALUES (?, ?)', [mentionedJid, 100]);
            victima = { saldo: 100 };
        }

        if (victima.saldo < 50) {
            return await sock.sendMessage(chatId, {
                text: `❌ *Objetivo sin fondos suficientes*\n\n` +
                      `@${mentionedJid.split('@')[0]} no tiene suficiente saldo para robarle.\n\n` +
                      `💰 Saldo de la víctima: *${victima.saldo} puntos*\n` +
                      `📊 Mínimo requerido: *50 puntos*\n\n` +
                      `💡 Busca otro objetivo con más puntos`
            }, { quoted: m, mentions: [mentionedJid] });
        }

        // Realizar el intento de robo
        const exitoso = Math.random() < 0.5; // 50% de probabilidad

        if (exitoso) {
            // Robo exitoso
            const porcentaje = 20 + Math.floor(Math.random() * 31); // 20-50%
            const cantidadRobada = Math.floor((victima.saldo * porcentaje) / 100);

            // Actualizar saldos
            const nuevoSaldoLadron = ladron.saldo + cantidadRobada;
            const nuevoSaldoVictima = victima.saldo - cantidadRobada;

            await db.run('UPDATE usuarios SET saldo = ? WHERE chatId = ?', [nuevoSaldoLadron, userId]);
            await db.run('UPDATE usuarios SET saldo = ? WHERE chatId = ?', [nuevoSaldoVictima, mentionedJid]);

            // Registrar robo
            await registrarRobo(userId, mentionedJid, true, cantidadRobada);

            await sock.sendMessage(chatId, {
                text: `✅ *¡ROBO EXITOSO!* 💰\n\n` +
                      `🎭 @${userId.split('@')[0]} robó a @${mentionedJid.split('@')[0]}\n\n` +
                      `💵 Cantidad robada: *${cantidadRobada} puntos* (${porcentaje}%)\n\n` +
                      `*Saldos actualizados:*\n` +
                      `🔫 Ladrón: ${ladron.saldo} → *${nuevoSaldoLadron} puntos*\n` +
                      `😢 Víctima: ${victima.saldo} → *${nuevoSaldoVictima} puntos*\n\n` +
                      `⏰ Próximo robo disponible en 2 horas`
            }, { quoted: m, mentions: [userId, mentionedJid] });

        } else {
            // Robo fallido
            const porcentaje = 10 + Math.floor(Math.random() * 21); // 10-30%
            const cantidadPerdida = Math.floor((ladron.saldo * porcentaje) / 100);

            // Actualizar saldo del ladrón
            const nuevoSaldoLadron = Math.max(0, ladron.saldo - cantidadPerdida);

            await db.run('UPDATE usuarios SET saldo = ? WHERE chatId = ?', [nuevoSaldoLadron, userId]);

            // Registrar robo fallido
            await registrarRobo(userId, mentionedJid, false, cantidadPerdida);

            await sock.sendMessage(chatId, {
                text: `❌ *¡ROBO FALLIDO!* 🚨\n\n` +
                      `🚔 @${userId.split('@')[0]} fue atrapado intentando robar a @${mentionedJid.split('@')[0]}\n\n` +
                      `💸 Multa pagada: *${cantidadPerdida} puntos* (${porcentaje}%)\n\n` +
                      `*Saldo actualizado:*\n` +
                      `😭 ${ladron.saldo} → *${nuevoSaldoLadron} puntos*\n\n` +
                      `⏰ Próximo intento disponible en 2 horas\n` +
                      `💡 ¡Mejor suerte la próxima vez!`
            }, { quoted: m, mentions: [userId, mentionedJid] });
        }

    } catch (error) {
        console.error('Error en comando robar:', error);
        await sock.sendMessage(chatId, {
            text: '❌ Ocurrió un error al intentar el robo. Intenta nuevamente.'
        }, { quoted: m });
    }
}