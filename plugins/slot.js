import { run as economy } from './economia.js';

/**
 * @file Plugin para un juego de máquina tragamonedas (slots).
 * @author Gemini Code Assist
 * @version 1.0.0
 */

// Emojis para la máquina tragamonedas
const slots = ["🍒", "🍋", "🍊", "🍇", "🔔", "💎"];

export const command = '.slot';

export async function run(sock, m) {
    const chatId = m.key.remoteJid;
    let cantidadApostada;

    try {
        cantidadApostada = await economy(sock, m, { text: m.message.conversation, command: '.apostar' });
    } catch (error) {
        console.error('Error al apostar:', error);
        return await sock.sendMessage(chatId, { text: '❌ Ocurrió un error al realizar la apuesta.' }, { quoted: m });
    }

    if (!cantidadApostada) {
        return;
    }
    // Generar tres resultados aleatorios
    const slot1 = slots[Math.floor(Math.random() * slots.length)];
    const slot2 = slots[Math.floor(Math.random() * slots.length)];
    const slot3 = slots[Math.floor(Math.random() * slots.length)];

    let resultText = `🎰 *¡TRAGAMONEDAS!* 🎰\n\n[ ${slot1} | ${slot2} | ${slot3} ]\n\n`;

    // Comprobar si el usuario ha ganado
    if (slot1 === slot2 && slot2 === slot3) {
        resultText += `🎉 *¡JACKPOT!* ¡Has ganado el premio gordo! 🎉`;
    } else if (slot1 === slot2 || slot1 === slot3 || slot2 === slot3) {
        resultText += `🎊 ¡Bien! ¡Has ganado un premio menor! 🎊`;
    } else {
        resultText += `😕 Lo siento, no has ganado esta vez. ¡Inténtalo de nuevo! 😕`;
    }

    await sock.sendMessage(chatId, { text: resultText }, { quoted: m });
}
