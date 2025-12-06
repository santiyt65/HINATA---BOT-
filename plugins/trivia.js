/**
 * @file Plugin de Trivia - Juego de preguntas y respuestas con recompensas
 * @version 2.0.0
 */

import { db } from './db.js';

export const command = '.trivia';

export const help = `
Juego de preguntas y respuestas con recompensas 🧠

*Cómo jugar:*
1. Usa \`.trivia\` para iniciar una pregunta
2. Lee la pregunta y las opciones
3. Responde con el número de la opción (1, 2, 3 o 4)
4. ¡Responde correctamente y gana puntos!

*Comandos:*
  • \`.trivia\` - Nueva pregunta
  • \`.trivia nueva\` - Nueva pregunta

*Recompensas:*
  • Respuesta correcta: 80 puntos 🎯
  • Respuesta incorrecta: 10 puntos de consolación 💫

*Categorías:*
  • Historia 📚
  • Ciencia 🔬
  • Geografía 🌍
  • Cultura General 🎭
  • Entretenimiento 🎬
  • Deportes ⚽

*Nota:* Solo responde con números (1-4) cuando haya una trivia activa.
`;

const preguntas = [
    // Historia
    {
        pregunta: '¿En qué año se descubrió América?',
        opciones: ['1491', '1492', '1493', '1500'],
        respuesta: 1,
        categoria: 'Historia'
    },
    {
        pregunta: '¿Quién fue el primer presidente de Estados Unidos?',
        opciones: ['Thomas Jefferson', 'George Washington', 'Abraham Lincoln', 'John Adams'],
        respuesta: 1,
        categoria: 'Historia'
    },
    {
        pregunta: '¿En qué año cayó el Muro de Berlín?',
        opciones: ['1987', '1988', '1989', '1990'],
        respuesta: 2,
        categoria: 'Historia'
    },
    {
        pregunta: '¿Quién fue el líder de la Revolución Francesa?',
        opciones: ['Luis XVI', 'Napoleón Bonaparte', 'Robespierre', 'Danton'],
        respuesta: 1,
        categoria: 'Historia'
    },
    
    // Geografía
    {
        pregunta: '¿Cuál es la capital de Francia?',
        opciones: ['Lyon', 'París', 'Marsella', 'Toulouse'],
        respuesta: 1,
        categoria: 'Geografía'
    },
    {
        pregunta: '¿Cuál es el país más grande del mundo?',
        opciones: ['China', 'Canadá', 'Estados Unidos', 'Rusia'],
        respuesta: 3,
        categoria: 'Geografía'
    },
    {
        pregunta: '¿En qué continente está Egipto?',
        opciones: ['Asia', 'África', 'Europa', 'Medio Oriente'],
        respuesta: 1,
        categoria: 'Geografía'
    },
    {
        pregunta: '¿Cuál es el río más largo del mundo?',
        opciones: ['Nilo', 'Amazonas', 'Yangtsé', 'Misisipi'],
        respuesta: 1,
        categoria: 'Geografía'
    },
    
    // Ciencia
    {
        pregunta: '¿Cuántos planetas hay en el sistema solar?',
        opciones: ['7', '8', '9', '10'],
        respuesta: 1,
        categoria: 'Ciencia'
    },
    {
        pregunta: '¿Cuál es el elemento químico más abundante en la Tierra?',
        opciones: ['Oxígeno', 'Nitrógeno', 'Hierro', 'Hidrógeno'],
        respuesta: 0,
        categoria: 'Ciencia'
    },
    {
        pregunta: '¿A qué velocidad viaja la luz?',
        opciones: ['300,000 km/s', '150,000 km/s', '450,000 km/s', '200,000 km/s'],
        respuesta: 0,
        categoria: 'Ciencia'
    },
    {
        pregunta: '¿Cuál es el órgano más grande del cuerpo humano?',
        opciones: ['Hígado', 'Cerebro', 'Piel', 'Corazón'],
        respuesta: 2,
        categoria: 'Ciencia'
    },
    
    // Arte y Cultura
    {
        pregunta: '¿Quién pintó la Mona Lisa?',
        opciones: ['Michelangelo', 'Leonardo da Vinci', 'Raphael', 'Donatello'],
        respuesta: 1,
        categoria: 'Arte'
    },
    {
        pregunta: '¿Quién escribió "Don Quijote de la Mancha"?',
        opciones: ['Miguel de Cervantes', 'Lope de Vega', 'Calderón de la Barca', 'Garcilaso de la Vega'],
        respuesta: 0,
        categoria: 'Literatura'
    },
    {
        pregunta: '¿Cuál es la obra más famosa de Shakespeare?',
        opciones: ['Macbeth', 'Hamlet', 'Romeo y Julieta', 'Otelo'],
        respuesta: 1,
        categoria: 'Literatura'
    },
    
    // Entretenimiento
    {
        pregunta: '¿Qué película ganó el Oscar a Mejor Película en 2020?',
        opciones: ['Joker', 'Parasite', '1917', 'Once Upon a Time in Hollywood'],
        respuesta: 1,
        categoria: 'Cine'
    },
    {
        pregunta: '¿Cuál es el anime más visto de todos los tiempos?',
        opciones: ['Dragon Ball', 'One Piece', 'Naruto', 'Attack on Titan'],
        respuesta: 1,
        categoria: 'Anime'
    },
    {
        pregunta: '¿Quién es el superhéroe conocido como el "Hombre de Acero"?',
        opciones: ['Batman', 'Superman', 'Iron Man', 'Captain America'],
        respuesta: 1,
        categoria: 'Entretenimiento'
    },
    
    // Deportes
    {
        pregunta: '¿Cuántos jugadores hay en un equipo de fútbol?',
        opciones: ['10', '11', '12', '9'],
        respuesta: 1,
        categoria: 'Deportes'
    },
    {
        pregunta: '¿En qué país se originó el fútbol?',
        opciones: ['Brasil', 'Argentina', 'Inglaterra', 'España'],
        respuesta: 2,
        categoria: 'Deportes'
    },
    {
        pregunta: '¿Quién tiene más Balones de Oro?',
        opciones: ['Cristiano Ronaldo', 'Lionel Messi', 'Pelé', 'Maradona'],
        respuesta: 1,
        categoria: 'Deportes'
    }
];

async function iniciarTrivia(sock, chatId, userId) {
    try {
        // Verificar si ya hay una trivia activa
        const triviaExistente = await db.get(
            'SELECT * FROM trivia WHERE chatId = ? AND userId = ?',
            [chatId, userId]
        );

        if (triviaExistente) {
            const preguntaData = JSON.parse(triviaExistente.preguntaData);
            let mensaje = `⚠️ Ya tienes una trivia en curso:\n\n`;
            mensaje += `❓ *${preguntaData.pregunta}*\n\n`;
            preguntaData.opciones.forEach((opcion, index) => {
                mensaje += `${index + 1}. ${opcion}\n`;
            });
            mensaje += `\n💡 Responde con el número de la opción (1-4)`;
            
            return await sock.sendMessage(chatId, { text: mensaje });
        }

        // Seleccionar pregunta aleatoria
        const preguntaAleatoria = preguntas[Math.floor(Math.random() * preguntas.length)];

        // Guardar en base de datos
        await db.run(
            'INSERT INTO trivia (chatId, userId, preguntaData, createdAt) VALUES (?, ?, ?, ?)',
            [chatId, userId, JSON.stringify(preguntaAleatoria), new Date().toISOString()]
        );

        // Construir mensaje
        let mensaje = `🧠 *TRIVIA - ${preguntaAleatoria.categoria.toUpperCase()}* 🧠\n\n`;
        mensaje += `❓ *${preguntaAleatoria.pregunta}*\n\n`;
        preguntaAleatoria.opciones.forEach((opcion, index) => {
            mensaje += `${index + 1}. ${opcion}\n`;
        });
        mensaje += `\n💡 Responde con el número de la opción (1-4)\n`;
        mensaje += `💰 Respuesta correcta: +80 puntos`;

        await sock.sendMessage(chatId, { text: mensaje });

    } catch (error) {
        console.error('Error al iniciar trivia:', error);
        await sock.sendMessage(chatId, {
            text: '❌ Ocurrió un error al iniciar la trivia. Intenta nuevamente.'
        });
    }
}

async function procesarRespuesta(sock, m, respuestaNum) {
    const chatId = m.key.remoteJid;
    const userId = m.key.participant || m.key.remoteJid;

    try {
        // Buscar trivia activa
        const trivia = await db.get(
            'SELECT * FROM trivia WHERE chatId = ? AND userId = ?',
            [chatId, userId]
        );

        if (!trivia) {
            return; // No hay trivia activa, no hacer nada
        }

        const respuesta = parseInt(respuestaNum) - 1;

        if (isNaN(respuesta) || respuesta < 0 || respuesta > 3) {
            return await sock.sendMessage(chatId, {
                text: '❌ Por favor, responde con un número entre 1 y 4.'
            }, { quoted: m });
        }

        const preguntaData = JSON.parse(trivia.preguntaData);
        const esCorrecta = respuesta === preguntaData.respuesta;
        const recompensa = esCorrecta ? 80 : 10;

        // Actualizar saldo del usuario
        let usuario = await db.get('SELECT * FROM usuarios WHERE chatId = ?', [userId]);
        
        if (!usuario) {
            await db.run('INSERT INTO usuarios (chatId, saldo) VALUES (?, ?)', [userId, 100]);
            usuario = { saldo: 100 };
        }

        const nuevoSaldo = (usuario.saldo || 100) + recompensa;
        await db.run('UPDATE usuarios SET saldo = ? WHERE chatId = ?', [nuevoSaldo, userId]);

        // Eliminar trivia
        await db.run('DELETE FROM trivia WHERE chatId = ? AND userId = ?', [chatId, userId]);

        // Construir mensaje de respuesta
        let mensaje = '';
        
        if (esCorrecta) {
            mensaje = `✅ *¡RESPUESTA CORRECTA!* ✅\n\n`;
            mensaje += `🎯 ${preguntaData.opciones[respuesta]}\n\n`;
            mensaje += `💰 Recompensa: *+${recompensa} puntos*\n`;
            mensaje += `💳 Saldo actual: *${nuevoSaldo} puntos*\n\n`;
            mensaje += `🎮 Usa \`.trivia\` para otra pregunta`;
        } else {
            mensaje = `❌ *Respuesta incorrecta* ❌\n\n`;
            mensaje += `Tu respuesta: ${preguntaData.opciones[respuesta]}\n`;
            mensaje += `✅ Correcta: *${preguntaData.opciones[preguntaData.respuesta]}*\n\n`;
            mensaje += `💫 Consolación: *+${recompensa} puntos*\n`;
            mensaje += `💳 Saldo actual: *${nuevoSaldo} puntos*\n\n`;
            mensaje += `💪 ¡Sigue intentando! Usa \`.trivia\``;
        }

        await sock.sendMessage(chatId, { text: mensaje }, { quoted: m });

    } catch (error) {
        console.error('Error al procesar respuesta de trivia:', error);
        await sock.sendMessage(chatId, {
            text: '❌ Ocurrió un error al procesar tu respuesta.'
        }, { quoted: m });
    }
}

export async function run(sock, m, { text }) {
    const chatId = m.key.remoteJid;
    const userId = m.key.participant || m.key.remoteJid;

    try {
        // Asegurar que la tabla de trivia existe
        await db.run(`
            CREATE TABLE IF NOT EXISTS trivia (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                chatId TEXT NOT NULL,
                userId TEXT NOT NULL,
                preguntaData TEXT NOT NULL,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        if (!text || text.toLowerCase() === 'nuevo' || text.toLowerCase() === 'nueva' || text.toLowerCase() === 'empezar') {
            // Iniciar nueva trivia
            await iniciarTrivia(sock, chatId, userId);
        } else {
            // Procesar como respuesta
            await procesarRespuesta(sock, m, text);
        }

    } catch (error) {
        console.error('Error en comando trivia:', error);
        await sock.sendMessage(chatId, {
            text: '❌ Ocurrió un error. Intenta nuevamente.'
        }, { quoted: m });
    }
}

// Exportar función para que otros plugins puedan procesar respuestas
export async function procesarMensajeTrivia(sock, m) {
    const text = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
    const numero = text.trim();
    
    // Solo procesar si es un número del 1 al 4
    if (/^[1-4]$/.test(numero)) {
        await procesarRespuesta(sock, m, numero);
    }
}