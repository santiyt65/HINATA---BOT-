/**
 * @file Plugin de Ahorcado en la carpeta plugins
 * @version 1.0.0
 */

export const command = '.ahorcado';

const palabras = [
    'javascript', 'python', 'whatsapp', 'hinata', 'programación',
    'gato', 'perro', 'computadora', 'teléfono', 'internet',
    'desarrollo', 'código', 'función', 'variable', 'constante'
];

let juegoAhorcado = {};

function normalizeText(s) {
    return String(s || '')
        .normalize('NFD')
        .replace(/\p{M}/gu, '')
        .toLowerCase();
}

function isLetter(ch) {
    return /\p{L}/u.test(ch);
}

export async function run(sock, m, { text }) {
    const chatId = m.key.remoteJid;
    const userId = m.key.participant || chatId;
    const comando = String(text || '').trim();

    if (!comando || ['nuevo', 'empezar'].includes(comando.toLowerCase())) {
        // Iniciar nuevo juego
        if (juegoAhorcado[userId]) {
            return await sock.sendMessage(chatId, { text: 'Ya hay un juego en curso. Intenta adivinar letras o escribe *.ahorcado salir* para abandonar.' }, { quoted: m });
        }

        const palabraOriginal = palabras[Math.floor(Math.random() * palabras.length)];
        const palabraNorm = normalizeText(palabraOriginal);

        // Mostrar guiones sólo en letras, mantener espacios/puntuación
        const guiones = palabraOriginal.split('').map(ch => isLetter(ch) ? '_' : ch).join('');

        juegoAhorcado[userId] = {
            palabraOriginal,
            palabraNorm,
            adivinadas: guiones,
            letrasUsadas: [],
            intentos: 6
        };

        let mensaje = `🎮 *AHORCADO* 🎮\n\n`;
        mensaje += `Palabra: ${guiones}\n`;
        mensaje += `Intentos restantes: 6\n`;
        mensaje += `Letras usadas: Ninguna\n\n`;
        mensaje += `Escribe una letra para empezar (Ejemplo: .ahorcado a) o intenta adivinar la palabra completa.`;

        await sock.sendMessage(chatId, { text: mensaje }, { quoted: m });
        return;
    }

    if (['salir', 'rendirse'].includes(comando.toLowerCase())) {
        if (juegoAhorcado[userId]) {
            const juego = juegoAhorcado[userId];
            await sock.sendMessage(chatId, { text: `😢 ¡Te rendiste! La palabra era: *${juego.palabraOriginal.toUpperCase()}*` }, { quoted: m });
            delete juegoAhorcado[userId];
        } else {
            await sock.sendMessage(chatId, { text: 'No hay un juego en curso. Escribe *.ahorcado nuevo* para empezar.' }, { quoted: m });
        }
        return;
    }

    if (!juegoAhorcado[userId]) {
        return await sock.sendMessage(chatId, { text: 'No hay un juego en curso. Escribe *.ahorcado nuevo* para empezar.' }, { quoted: m });
    }

    const juego = juegoAhorcado[userId];
    const guessRaw = comando;

    // Si el usuario intenta adivinar la palabra completa
    if (guessRaw.length > 1) {
        const guessNorm = normalizeText(guessRaw);
        if (guessNorm === juego.palabraNorm) {
            await sock.sendMessage(chatId, { text: `🎉 ¡Felicidades! ¡Adivinaste la palabra: *${juego.palabraOriginal.toUpperCase()}*!` }, { quoted: m });
            delete juegoAhorcado[userId];
            return;
        } else {
            juego.intentos--;
            if (juego.intentos <= 0) {
                await sock.sendMessage(chatId, { text: `💀 ¡Perdiste! La palabra era: *${juego.palabraOriginal.toUpperCase()}*` }, { quoted: m });
                delete juegoAhorcado[userId];
                return;
            }
            let mensaje = `❌ La palabra "${guessRaw}" no es correcta.\n\n`;
            mensaje += `Palabra: ${juego.adivinadas}\n`;
            mensaje += `Intentos restantes: ${juego.intentos}\n`;
            mensaje += `Letras usadas: ${juego.letrasUsadas.map(l => l.toUpperCase()).join(', ') || 'Ninguna'}`;
            await sock.sendMessage(chatId, { text: mensaje }, { quoted: m });
            return;
        }
    }

    // Proceso para una sola letra
    const letraRaw = guessRaw[0];
    if (!letraRaw || !isLetter(letraRaw)) {
        return await sock.sendMessage(chatId, { text: '❌ Por favor, escribe una letra válida.' }, { quoted: m });
    }

    const letra = normalizeText(letraRaw)[0];

    if (juego.letrasUsadas.includes(letra)) {
        return await sock.sendMessage(chatId, { text: `⚠️ Ya usaste la letra "${letra.toUpperCase()}". Intenta con otra.` }, { quoted: m });
    }

    juego.letrasUsadas.push(letra);

    if (juego.palabraNorm.includes(letra)) {
        // Letra correcta: reconstruir adivinadas usando la palabra original (preserva acentos)
        let nuevaAdivinada = '';
        for (let i = 0; i < juego.palabraNorm.length; i++) {
            if (juego.palabraNorm[i] === letra || juego.adivinadas[i] !== '_') {
                nuevaAdivinada += juego.palabraOriginal[i];
            } else {
                nuevaAdivinada += isLetter(juego.palabraOriginal[i]) ? '_' : juego.palabraOriginal[i];
            }
        }
        juego.adivinadas = nuevaAdivinada;

        if (!juego.adivinadas.includes('_')) {
            await sock.sendMessage(chatId, { text: `🎉 ¡Felicidades! ¡Adivinaste la palabra: *${juego.palabraOriginal.toUpperCase()}*!` }, { quoted: m });
            delete juegoAhorcado[userId];
            return;
        }

        let mensaje = `✅ ¡Correcto! La letra "${letra.toUpperCase()}" está en la palabra.\n\n`;
        mensaje += `Palabra: ${juego.adivinadas}\n`;
        mensaje += `Intentos restantes: ${juego.intentos}\n`;
        mensaje += `Letras usadas: ${juego.letrasUsadas.map(l => l.toUpperCase()).join(', ')}`;
        await sock.sendMessage(chatId, { text: mensaje }, { quoted: m });
        return;
    } else {
        // Letra incorrecta
        juego.intentos--;

        if (juego.intentos <= 0) {
            await sock.sendMessage(chatId, { text: `💀 ¡Perdiste! La palabra era: *${juego.palabraOriginal.toUpperCase()}*` }, { quoted: m });
            delete juegoAhorcado[userId];
            return;
        }

        let mensaje = `❌ La letra "${letra.toUpperCase()}" no está en la palabra.\n\n`;
        mensaje += `Palabra: ${juego.adivinadas}\n`;
        mensaje += `Intentos restantes: ${juego.intentos}\n`;
        mensaje += `Letras usadas: ${juego.letrasUsadas.map(l => l.toUpperCase()).join(', ')}`;
        await sock.sendMessage(chatId, { text: mensaje }, { quoted: m });
        return;
    }
}
