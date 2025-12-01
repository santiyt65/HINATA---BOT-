import { run as economy } from '../economia.js';
import { db } from './db.js';

/**
 * @file Plugin para un juego de máquina tragamonedas (slots).
 * @author Gemini Code Assist
 * @version 1.0.0
 */

// Emojis para la máquina tragamonedas
const slots = ["🍒", "🍋", "🍊", "🍇", "🔔", "💎"];

export const command = '.slot';

export async function run(sock, m, { text }) {
    const chatId = m.key.remoteJid;
    // Obtener la cantidad apostada desde el parámetro `text` o desde el contenido del mensaje
    const rawText = (text || (m.message && (m.message.conversation || (m.message.extendedTextMessage && m.message.extendedTextMessage.text))) || '').toString().trim();
    const cantidadApostada = parseInt(rawText, 10);

    if (isNaN(cantidadApostada) || cantidadApostada <= 0) {
        return await sock.sendMessage(chatId, { text: `❌ Uso: .slot <cantidad>\nEjemplo: .slot 50` }, { quoted: m });
    }

    try {
        // Verificar saldo del usuario
        let usuario = await db.get('SELECT saldo FROM usuarios WHERE chatId = ?', [chatId]);
        if (!usuario) {
            await db.run('INSERT INTO usuarios (chatId) VALUES (?)', [chatId]);
            usuario = { saldo: 100 };
        }

        if (cantidadApostada > usuario.saldo) {
            return await sock.sendMessage(chatId, { text: '❌ No tienes suficiente saldo para realizar esa apuesta.' }, { quoted: m });
        }

        // Deducir la apuesta inmediatamente
        await db.run('UPDATE usuarios SET saldo = saldo - ? WHERE chatId = ?', [cantidadApostada, chatId]);
    } catch (error) {
        console.error('Error al procesar la apuesta:', error);
        return await sock.sendMessage(chatId, { text: '❌ Ocurrió un error al procesar la apuesta.' }, { quoted: m });
    }
    // Generar tres resultados aleatorios
    const slot1 = slots[Math.floor(Math.random() * slots.length)];
    const slot2 = slots[Math.floor(Math.random() * slots.length)];
    const slot3 = slots[Math.floor(Math.random() * slots.length)];

    let resultText = `🎰 *¡TRAGAMONEDAS!* 🎰\n\n[ ${slot1} | ${slot2} | ${slot3} ]\n\n`;

    // Comprobar si el usuario ha ganado y calcular premio
    let multiplier = 0;
    if (slot1 === slot2 && slot2 === slot3) {
        multiplier = 5; // Jackpot
        resultText += `🎉 *¡JACKPOT!* ¡Has ganado el premio gordo! 🎉`;
    } else if (slot1 === slot2 || slot1 === slot3 || slot2 === slot3) {
        multiplier = 2; // Premio menor
        resultText += `🎊 ¡Bien! ¡Has ganado un premio menor! 🎊`;
    } else {
        multiplier = 0;
        resultText += `😕 Lo siento, no has ganado esta vez. ¡Inténtalo de nuevo! 😕`;
    }

    try {
        if (multiplier > 0) {
            const ganancia = cantidadApostada * multiplier;
            await db.run('UPDATE usuarios SET saldo = saldo + ? WHERE chatId = ?', [ganancia, chatId]);
            const usuario = await db.get('SELECT saldo FROM usuarios WHERE chatId = ?', [chatId]);
            resultText += `\n\n💸 Ganaste: ${ganancia} puntos.\n💰 Saldo actual: ${usuario.saldo} puntos.`;
        } else {
            const usuario = await db.get('SELECT saldo FROM usuarios WHERE chatId = ?', [chatId]);
            resultText += `\n\n💰 Saldo actual: ${usuario.saldo} puntos.`;
        }
    } catch (error) {
        console.error('Error actualizando saldo:', error);
        resultText += `\n\n⚠️ Ocurrió un error al actualizar tu saldo. Por favor intenta de nuevo.`;
    }

    await sock.sendMessage(chatId, { text: resultText }, { quoted: m });
}
