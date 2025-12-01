/**
 * @file Plugin de Trivia - Juego de preguntas y respuestas
 * @version 1.0.0
 */

export const command = '.trivia';

const preguntas = [
    {
        pregunta: '¿Cuál es la capital de Francia?',
        opciones: ['París', 'Lyon', 'Marsella', 'Toulouse'],
        respuesta: 0
    },
    {
        pregunta: '¿Cuántos planetas hay en el sistema solar?',
        opciones: ['7', '8', '9', '10'],
        respuesta: 1
    },
    {
        pregunta: '¿En qué año se descubrió América?',
        opciones: ['1491', '1492', '1493', '1490'],
        respuesta: 1
    },
    {
        pregunta: '¿Cuál es el elemento químico más abundante en la Tierra?',
        opciones: ['Oxígeno', 'Nitrógeno', 'Hierro', 'Hidrógeno'],
        respuesta: 0
    },
    {
        pregunta: '¿Quién pintó la Mona Lisa?',
        opciones: ['Michelangelo', 'Leonardo da Vinci', 'Raphael', 'Donatello'],
        respuesta: 1
    }
];

let triviaActiva = {};

export async function run(sock, m, { text, args }) {
    const chatId = m.key.remoteJid;
    const userId = m.key.participant || chatId;

    if (!text || text.toLowerCase() === 'nuevo' || text.toLowerCase() === 'empezar') {
        // Iniciar nueva trivia
        const preguntaAleatoria = preguntas[Math.floor(Math.random() * preguntas.length)];
        
        triviaActiva[userId] = {
            pregunta: preguntaAleatoria,
            respuestaUsuario: null
        };

        let mensaje = `❓ *TRIVIA* ❓\n\n*Pregunta:* ${preguntaAleatoria.pregunta}\n\n`;
        preguntaAleatoria.opciones.forEach((opcion, index) => {
            mensaje += `${index + 1}. ${opcion}\n`;
        });
        mensaje += `\n*Responde con el número de la opción correcta*`;

        await sock.sendMessage(chatId, { text: mensaje }, { quoted: m });
    } else if (triviaActiva[userId]) {
        // Verificar respuesta
        const respuesta = parseInt(text) - 1;
        const triviaData = triviaActiva[userId];

        if (isNaN(respuesta) || respuesta < 0 || respuesta > 3) {
            return await sock.sendMessage(chatId, { text: '❌ Por favor, responde con un número entre 1 y 4' }, { quoted: m });
        }

        if (respuesta === triviaData.pregunta.respuesta) {
            await sock.sendMessage(chatId, { text: `✅ ¡Respuesta correcta! La opción ${respuesta + 1} es la correcta: *${triviaData.pregunta.opciones[respuesta]}*` }, { quoted: m });
        } else {
            await sock.sendMessage(chatId, { text: `❌ Respuesta incorrecta. La respuesta correcta era: *${triviaData.pregunta.opciones[triviaData.pregunta.respuesta]}*` }, { quoted: m });
        }

        delete triviaActiva[userId];
    } else {
        await sock.sendMessage(chatId, { text: '📝 Escribe *.trivia nuevo* para empezar a jugar' }, { quoted: m });
    }
}
