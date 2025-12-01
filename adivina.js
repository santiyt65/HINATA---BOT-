/**
 * @file Plugin de Adivina - Juego para adivinar números
 * @version 1.0.0
 */

export const command = '.adivina';

let juegoActivo = {};

async function iniciarJuego(sock, chatId) {
    const numeroSecreto = Math.floor(Math.random() * 100) + 1;
    juegoActivo[chatId] = {
        numeroSecreto: numeroSecreto,
        intentos: 0
    };
    
    await sock.sendMessage(chatId, { text: '🎲 ¡He pensado un número entre 1 y 100!\n\n¿Cuál crees que es?' });
    return { numeroSecreto: numeroSecreto, intentos: 0 };
}

async function adivinarNumero(sock, chatId, intento, juego, m) {
    const intenNumber = parseInt(intento);
    
    if (isNaN(intenNumber)) {
        return await sock.sendMessage(chatId, { text: 'Por favor, ingresa un número válido.' }, { quoted: m });
    }

    if (intenNumber === juego.numeroSecreto) {
        await sock.sendMessage(chatId, { text: `🎉 ¡Felicidades! ¡Adivinaste el número ${juego.numeroSecreto} en ${juego.intentos + 1} intentos!` }, { quoted: m });
        delete juegoActivo[chatId];
    } else if (intenNumber < juego.numeroSecreto) {
        juego.intentos++;
        await sock.sendMessage(chatId, { text: `⬆️ El número es más alto. Intenta de nuevo. (Intento ${juego.intentos})` }, { quoted: m });
    } else {
        juego.intentos++;
        await sock.sendMessage(chatId, { text: `⬇️ El número es más bajo. Intenta de nuevo. (Intento ${juego.intentos})` }, { quoted: m });
    }
}

export async function run(sock, m, { text }) {
    const chatId = m.key.remoteJid;

    if (!text || text.toLowerCase() === 'nuevo' || text.toLowerCase() === 'empezar') {
        // Iniciar nuevo juego
        if (juegoActivo[chatId]) {
            await sock.sendMessage(chatId, { text: 'Ya hay un juego en curso. Escribe un número para adivinar o *.adivina rendirse*' }, { quoted: m });
        } else {
            await iniciarJuego(sock, chatId);
        }
    } else if (text.toLowerCase() === 'rendirse' || text.toLowerCase() === 'salir') {
        if (juegoActivo[chatId]) {
            const juego = juegoActivo[chatId];
            await sock.sendMessage(chatId, { text: `😢 ¡Te rendiste! El número era ${juego.numeroSecreto}` }, { quoted: m });
            delete juegoActivo[chatId];
        } else {
            await sock.sendMessage(chatId, { text: 'No hay un juego en curso. Escribe *.adivina nuevo* para empezar.' }, { quoted: m });
        }
    } else {
        // Procesar intento de adivinar
        if (juegoActivo[chatId]) {
            await adivinarNumero(sock, chatId, text, juegoActivo[chatId], m);
        } else {
            await sock.sendMessage(chatId, { text: 'No hay un juego en curso. Escribe *.adivina nuevo* para empezar.' }, { quoted: m });
        }
    }
}

