/**
 * @file Plugin para el juego de Piedra, Papel o Tijera.
 * @author Gemini Code Assist
 * @version 1.0.0
 */

export const command = '.ppt';

export async function run(sock, m, { text }) {
    const chatId = m.key.remoteJid;
    const userChoice = text?.trim().toLowerCase();
    const choices = ['piedra', 'papel', 'tijera'];
    const choiceEmojis = {
        piedra: '✊',
        papel: '✋',
        tijera: '✌️'
    };

    if (!userChoice || !choices.includes(userChoice)) {
        return await sock.sendMessage(chatId, {
            text: `Por favor, elige una opción válida: piedra, papel o tijera.\n\n*Ejemplo:*\n.ppt piedra`
        }, { quoted: m });
    }

    const botChoice = choices[Math.floor(Math.random() * choices.length)];

    let resultText = `*Piedra, Papel o Tijera*\n\n`;
    resultText += `Tú elegiste: ${choiceEmojis[userChoice]} ${userChoice}\n`;
    resultText += `Yo elegí: ${choiceEmojis[botChoice]} ${botChoice}\n\n`;

    if (userChoice === botChoice) {
        resultText += "😐 ¡Es un empate!";
    } else if (
        (userChoice === 'piedra' && botChoice === 'tijera') ||
        (userChoice === 'papel' && botChoice === 'piedra') ||
        (userChoice === 'tijera' && botChoice === 'papel')
    ) {
        resultText += "🎉 ¡Felicidades, ganaste!";
    } else {
        resultText += "🤖 ¡Gané yo! Mejor suerte la próxima vez.";
    }

    await sock.sendMessage(chatId, { text: resultText }, { quoted: m });
}
