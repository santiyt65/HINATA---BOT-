/**
 * @file Plugin del juego del Ahorcado
 * @version 1.0.0
 */

export const command = '.ahorcado';

const palabras = [
    'javascript', 'python', 'whatsapp', 'hinata', 'programación',
    'gato', 'perro', 'computadora', 'teléfono', 'internet',
    'desarrollo', 'código', 'función', 'variable', 'constante'
];

let juegoAhorcado = {};

export async function run(sock, m, { text }) {
    const chatId = m.key.remoteJid;
    const userId = m.key.participant || chatId;

    if (!text || text.toLowerCase() === 'nuevo' || text.toLowerCase() === 'empezar') {
        // Iniciar nuevo juego
        if (juegoAhorcado[userId]) {
            return await sock.sendMessage(chatId, { text: 'Ya hay un juego en curso. Intenta adivinar letras o escribe *.ahorcado salir* para abandonar.' }, { quoted: m });
        }

        const palabra = palabras[Math.floor(Math.random() * palabras.length)];
        const guiones = '_'.repeat(palabra.length);

        juegoAhorcado[userId] = {
            palabra: palabra,
            adivinadas: guiones,
            letrasUsadas: [],
            intentos: 6
        };

        let mensaje = `🎮 *AHORCADO* 🎮\n\n`;
        mensaje += `Palabra: ${guiones}\n`;
        mensaje += `Intentos restantes: 6\n`;
        mensaje += `Letras usadas: Ninguna\n\n`;
        mensaje += `Escribe una letra para empezar. (Ejemplo: .ahorcado a)`;

        await sock.sendMessage(chatId, { text: mensaje }, { quoted: m });
    } else if (text.toLowerCase() === 'salir' || text.toLowerCase() === 'rendirse') {
        if (juegoAhorcado[userId]) {
            const juego = juegoAhorcado[userId];
            await sock.sendMessage(chatId, { text: `😢 ¡Te rendiste! La palabra era: *${juego.palabra.toUpperCase()}*` }, { quoted: m });
            delete juegoAhorcado[userId];
        } else {
            await sock.sendMessage(chatId, { text: 'No hay un juego en curso. Escribe *.ahorcado nuevo* para empezar.' }, { quoted: m });
        }
    } else {
        if (!juegoAhorcado[userId]) {
            return await sock.sendMessage(chatId, { text: 'No hay un juego en curso. Escribe *.ahorcado nuevo* para empezar.' }, { quoted: m });
        }

        const letra = text.toLowerCase().trim()[0];
        if (!letra || !/[a-z]/.test(letra)) {
            return await sock.sendMessage(chatId, { text: '❌ Por favor, escribe una letra válida.' }, { quoted: m });
        }

        const juego = juegoAhorcado[userId];

        if (juego.letrasUsadas.includes(letra)) {
            return await sock.sendMessage(chatId, { text: `⚠️ Ya usaste la letra "${letra.toUpperCase()}". Intenta con otra.` }, { quoted: m });
        }

        juego.letrasUsadas.push(letra);

        if (juego.palabra.includes(letra)) {
            // Letra correcta
            let nuevaAdivinada = '';
            for (let i = 0; i < juego.palabra.length; i++) {
                if (juego.palabra[i] === letra || juego.adivinadas[i] !== '_') {
                    nuevaAdivinada += juego.palabra[i];
                } else {
                    nuevaAdivinada += '_';
                }
            }
            juego.adivinadas = nuevaAdivinada;

            if (!juego.adivinadas.includes('_')) {
                // ¡Ganó!
                await sock.sendMessage(chatId, { text: `🎉 ¡Felicidades! ¡Adivinaste la palabra: *${juego.palabra.toUpperCase()}*!` }, { quoted: m });
                delete juegoAhorcado[userId];
            } else {
                let mensaje = `✅ ¡Correcto! La letra "${letra.toUpperCase()}" está en la palabra.\n\n`;
                mensaje += `Palabra: ${juego.adivinadas}\n`;
                mensaje += `Intentos restantes: ${juego.intentos}\n`;
                mensaje += `Letras usadas: ${juego.letrasUsadas.map(l => l.toUpperCase()).join(', ')}`;
                await sock.sendMessage(chatId, { text: mensaje }, { quoted: m });
            }
        } else {
            // Letra incorrecta
            juego.intentos--;

            if (juego.intentos <= 0) {
                await sock.sendMessage(chatId, { text: `💀 ¡Perdiste! La palabra era: *${juego.palabra.toUpperCase()}*` }, { quoted: m });
                delete juegoAhorcado[userId];
            } else {
                let mensaje = `❌ La letra "${letra.toUpperCase()}" no está en la palabra.\n\n`;
                mensaje += `Palabra: ${juego.adivinadas}\n`;
                mensaje += `Intentos restantes: ${juego.intentos}\n`;
                mensaje += `Letras usadas: ${juego.letrasUsadas.map(l => l.toUpperCase()).join(', ')}`;
                await sock.sendMessage(chatId, { text: mensaje }, { quoted: m });
            }
        }
    }
}
