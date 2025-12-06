/**
 * @file Plugin de Ahorcado - Juego con recompensas
 * @version 2.0.0
 */

import { db } from './db.js';

export const command = '.ahorcado';

export const help = `
Juego del ahorcado con recompensas 🎮

*Cómo jugar:*
1. Usa \`.ahorcado\` para iniciar un juego
2. El bot te mostrará una palabra oculta con guiones
3. Adivina letras escribiendo \`.ahorcado <letra>\`
4. O intenta adivinar la palabra completa
5. Tienes 6 intentos antes de perder

*Comandos:*
  • \`.ahorcado\` - Iniciar nuevo juego
  • \`.ahorcado <letra>\` - Adivinar una letra
  • \`.ahorcado <palabra>\` - Adivinar la palabra completa
  • \`.ahorcado rendirse\` - Rendirse y ver la palabra

*Recompensas:*
  • 0 errores: 200 puntos 🏆
  • 1-2 errores: 150 puntos 🥈
  • 3-4 errores: 100 puntos 🥉
  • 5-6 errores: 50 puntos 💰

*Categorías:*
  • Tecnología 💻
  • Animales 🐾
  • Países 🌍
  • Objetos 📦
  • Comida 🍕
  • Naturaleza 🌿

*Nota:* Escribe letras o palabras después del comando.
`;

const palabras = [
    // Tecnología
    { palabra: 'javascript', categoria: 'Tecnología' },
    { palabra: 'python', categoria: 'Tecnología' },
    { palabra: 'programacion', categoria: 'Tecnología' },
    { palabra: 'computadora', categoria: 'Tecnología' },
    { palabra: 'telefono', categoria: 'Tecnología' },
    { palabra: 'internet', categoria: 'Tecnología' },
    { palabra: 'desarrollo', categoria: 'Tecnología' },
    { palabra: 'aplicacion', categoria: 'Tecnología' },
    { palabra: 'software', categoria: 'Tecnología' },
    { palabra: 'hardware', categoria: 'Tecnología' },
    
    // Animales
    { palabra: 'elefante', categoria: 'Animales' },
    { palabra: 'jirafa', categoria: 'Animales' },
    { palabra: 'leon', categoria: 'Animales' },
    { palabra: 'tigre', categoria: 'Animales' },
    { palabra: 'delfin', categoria: 'Animales' },
    { palabra: 'aguila', categoria: 'Animales' },
    { palabra: 'mariposa', categoria: 'Animales' },
    { palabra: 'cocodrilo', categoria: 'Animales' },
    { palabra: 'pinguino', categoria: 'Animales' },
    { palabra: 'canguro', categoria: 'Animales' },
    
    // Países
    { palabra: 'argentina', categoria: 'Países' },
    { palabra: 'brasil', categoria: 'Países' },
    { palabra: 'mexico', categoria: 'Países' },
    { palabra: 'españa', categoria: 'Países' },
    { palabra: 'francia', categoria: 'Países' },
    { palabra: 'japon', categoria: 'Países' },
    { palabra: 'alemania', categoria: 'Países' },
    { palabra: 'italia', categoria: 'Países' },
    { palabra: 'colombia', categoria: 'Países' },
    { palabra: 'portugal', categoria: 'Países' },
    
    // Objetos
    { palabra: 'guitarra', categoria: 'Objetos' },
    { palabra: 'piano', categoria: 'Objetos' },
    { palabra: 'reloj', categoria: 'Objetos' },
    { palabra: 'lapiz', categoria: 'Objetos' },
    { palabra: 'cuaderno', categoria: 'Objetos' },
    { palabra: 'lampara', categoria: 'Objetos' },
    { palabra: 'silla', categoria: 'Objetos' },
    { palabra: 'mesa', categoria: 'Objetos' },
    { palabra: 'ventana', categoria: 'Objetos' },
    { palabra: 'puerta', categoria: 'Objetos' },
    
    // Comida
    { palabra: 'pizza', categoria: 'Comida' },
    { palabra: 'hamburguesa', categoria: 'Comida' },
    { palabra: 'chocolate', categoria: 'Comida' },
    { palabra: 'manzana', categoria: 'Comida' },
    { palabra: 'naranja', categoria: 'Comida' },
    { palabra: 'platano', categoria: 'Comida' },
    { palabra: 'fresa', categoria: 'Comida' },
    { palabra: 'helado', categoria: 'Comida' },
    { palabra: 'pastel', categoria: 'Comida' },
    { palabra: 'galleta', categoria: 'Comida' },
    
    // Naturaleza
    { palabra: 'montaña', categoria: 'Naturaleza' },
    { palabra: 'rio', categoria: 'Naturaleza' },
    { palabra: 'oceano', categoria: 'Naturaleza' },
    { palabra: 'bosque', categoria: 'Naturaleza' },
    { palabra: 'desierto', categoria: 'Naturaleza' },
    { palabra: 'volcan', categoria: 'Naturaleza' },
    { palabra: 'cascada', categoria: 'Naturaleza' },
    { palabra: 'playa', categoria: 'Naturaleza' },
    { palabra: 'estrella', categoria: 'Naturaleza' },
    { palabra: 'luna', categoria: 'Naturaleza' }
];

function normalizeText(s) {
    return String(s || '')
        .normalize('NFD')
        .replace(/\p{M}/gu, '')
        .toLowerCase();
}

function isLetter(ch) {
    return /\p{L}/u.test(ch);
}

function calcularRecompensa(errores) {
    if (errores === 0) return 200;
    if (errores <= 2) return 150;
    if (errores <= 4) return 100;
    return 50;
}

function obtenerEmoji(errores) {
    if (errores === 0) return '🏆';
    if (errores <= 2) return '🥈';
    if (errores <= 4) return '🥉';
    return '💰';
}

function dibujarAhorcado(intentos) {
    const dibujos = [
        `
  ┌─────┐
  │     │
  │     😵
  │    \\│/
  │     │
  │    / \\
  └─────────`,
        `
  ┌─────┐
  │     │
  │     😨
  │    \\│/
  │     │
  │    /
  └─────────`,
        `
  ┌─────┐
  │     │
  │     😰
  │    \\│/
  │     │
  │
  └─────────`,
        `
  ┌─────┐
  │     │
  │     😥
  │    \\│
  │     │
  │
  └─────────`,
        `
  ┌─────┐
  │     │
  │     😟
  │     │
  │     │
  │
  └─────────`,
        `
  ┌─────┐
  │     │
  │     😊
  │
  │
  │
  └─────────`,
        `
  ┌─────┐
  │     │
  │
  │
  │
  │
  └─────────`
    ];
    return dibujos[intentos] || dibujos[0];
}

async function iniciarAhorcado(sock, chatId, userId) {
    try {
        // Verificar si ya hay un juego activo
        const juegoExistente = await db.get(
            'SELECT * FROM ahorcado WHERE chatId = ? AND userId = ?',
            [chatId, userId]
        );

        if (juegoExistente) {
            const palabraOriginal = juegoExistente.palabra;
            const adivinadas = juegoExistente.letrasAdivinadas;
            const letrasUsadas = juegoExistente.letrasUsadas ? juegoExistente.letrasUsadas.split(',') : [];
            
            let mensaje = `⚠️ Ya tienes un juego en curso:\n\n`;
            mensaje += dibujarAhorcado(juegoExistente.intentos);
            mensaje += `\n\n📝 Palabra: ${adivinadas}\n`;
            mensaje += `❤️ Intentos restantes: ${juegoExistente.intentos}\n`;
            mensaje += `🔤 Letras usadas: ${letrasUsadas.map(l => l.toUpperCase()).join(', ') || 'Ninguna'}\n\n`;
            mensaje += `💡 Escribe \`.ahorcado <letra>\` para continuar`;
            
            return await sock.sendMessage(chatId, { text: mensaje });
        }

        // Seleccionar palabra aleatoria
        const palabraData = palabras[Math.floor(Math.random() * palabras.length)];
        const palabraOriginal = palabraData.palabra;
        const categoria = palabraData.categoria;
        const palabraNorm = normalizeText(palabraOriginal);

        // Crear guiones
        const guiones = palabraOriginal.split('').map(ch => isLetter(ch) ? '_' : ch).join('');

        // Guardar en base de datos
        await db.run(
            'INSERT INTO ahorcado (chatId, userId, palabra, palabraNorm, letrasAdivinadas, letrasUsadas, intentos, categoria, createdAt) VALUES (?, ?, ?, ?, ?, ?, 6, ?, ?)',
            [chatId, userId, palabraOriginal, palabraNorm, guiones, '', categoria, new Date().toISOString()]
        );

        let mensaje = `🎮 *AHORCADO - ${categoria.toUpperCase()}* 🎮\n\n`;
        mensaje += dibujarAhorcado(6);
        mensaje += `\n\n📝 Palabra: ${guiones}\n`;
        mensaje += `❤️ Intentos restantes: 6\n`;
        mensaje += `🔤 Letras usadas: Ninguna\n\n`;
        mensaje += `💡 Escribe \`.ahorcado <letra>\` para adivinar\n`;
        mensaje += `💰 Gana hasta 200 puntos sin errores`;

        await sock.sendMessage(chatId, { text: mensaje });

    } catch (error) {
        console.error('Error al iniciar ahorcado:', error);
        await sock.sendMessage(chatId, {
            text: '❌ Ocurrió un error al iniciar el juego. Intenta nuevamente.'
        });
    }
}

async function procesarIntento(sock, m, intento) {
    const chatId = m.key.remoteJid;
    const userId = m.key.participant || m.key.remoteJid;

    try {
        // Buscar juego activo
        const juego = await db.get(
            'SELECT * FROM ahorcado WHERE chatId = ? AND userId = ?',
            [chatId, userId]
        );

        if (!juego) {
            return; // No hay juego activo
        }

        const guessRaw = intento.trim();

        // Intentar adivinar palabra completa
        if (guessRaw.length > 1) {
            const guessNorm = normalizeText(guessRaw);
            
            if (guessNorm === juego.palabraNorm) {
                // ¡Ganó!
                const errores = 6 - juego.intentos;
                const recompensa = calcularRecompensa(errores);
                const emoji = obtenerEmoji(errores);

                // Actualizar saldo
                let usuario = await db.get('SELECT * FROM usuarios WHERE chatId = ?', [userId]);
                if (!usuario) {
                    await db.run('INSERT INTO usuarios (chatId, saldo) VALUES (?, ?)', [userId, 100]);
                    usuario = { saldo: 100 };
                }

                const nuevoSaldo = (usuario.saldo || 100) + recompensa;
                await db.run('UPDATE usuarios SET saldo = ? WHERE chatId = ?', [nuevoSaldo, userId]);

                // Eliminar juego
                await db.run('DELETE FROM ahorcado WHERE chatId = ? AND userId = ?', [chatId, userId]);

                let mensaje = `🎉 *¡FELICIDADES!* 🎉\n\n`;
                mensaje += `✅ Adivinaste la palabra: *${juego.palabra.toUpperCase()}*\n\n`;
                mensaje += `${emoji} Errores: ${errores}\n`;
                mensaje += `💰 Recompensa: *+${recompensa} puntos*\n`;
                mensaje += `💳 Saldo actual: *${nuevoSaldo} puntos*\n\n`;
                mensaje += `🎮 Usa \`.ahorcado\` para jugar de nuevo`;

                return await sock.sendMessage(chatId, { text: mensaje }, { quoted: m });
            } else {
                // Palabra incorrecta
                const nuevosIntentos = juego.intentos - 1;
                
                if (nuevosIntentos <= 0) {
                    await db.run('DELETE FROM ahorcado WHERE chatId = ? AND userId = ?', [chatId, userId]);
                    
                    let mensaje = `💀 *¡PERDISTE!* 💀\n\n`;
                    mensaje += dibujarAhorcado(0);
                    mensaje += `\n\n❌ La palabra era: *${juego.palabra.toUpperCase()}*\n\n`;
                    mensaje += `🎮 Usa \`.ahorcado\` para intentar de nuevo`;
                    
                    return await sock.sendMessage(chatId, { text: mensaje }, { quoted: m });
                }

                await db.run(
                    'UPDATE ahorcado SET intentos = ? WHERE chatId = ? AND userId = ?',
                    [nuevosIntentos, chatId, userId]
                );

                const letrasUsadas = juego.letrasUsadas ? juego.letrasUsadas.split(',').filter(l => l) : [];
                
                let mensaje = `❌ La palabra "${guessRaw}" no es correcta.\n\n`;
                mensaje += dibujarAhorcado(nuevosIntentos);
                mensaje += `\n\n📝 Palabra: ${juego.letrasAdivinadas}\n`;
                mensaje += `❤️ Intentos restantes: ${nuevosIntentos}\n`;
                mensaje += `🔤 Letras usadas: ${letrasUsadas.map(l => l.toUpperCase()).join(', ') || 'Ninguna'}`;
                
                return await sock.sendMessage(chatId, { text: mensaje }, { quoted: m });
            }
        }

        // Procesar letra individual
        const letraRaw = guessRaw[0];
        if (!letraRaw || !isLetter(letraRaw)) {
            return await sock.sendMessage(chatId, {
                text: '❌ Por favor, escribe una letra válida o una palabra completa.'
            }, { quoted: m });
        }

        const letra = normalizeText(letraRaw)[0];
        const letrasUsadas = juego.letrasUsadas ? juego.letrasUsadas.split(',').filter(l => l) : [];

        if (letrasUsadas.includes(letra)) {
            return await sock.sendMessage(chatId, {
                text: `⚠️ Ya usaste la letra "${letra.toUpperCase()}". Intenta con otra.`
            }, { quoted: m });
        }

        letrasUsadas.push(letra);

        if (juego.palabraNorm.includes(letra)) {
            // Letra correcta
            let nuevaAdivinada = '';
            for (let i = 0; i < juego.palabraNorm.length; i++) {
                if (juego.palabraNorm[i] === letra || juego.letrasAdivinadas[i] !== '_') {
                    nuevaAdivinada += juego.palabra[i];
                } else {
                    nuevaAdivinada += isLetter(juego.palabra[i]) ? '_' : juego.palabra[i];
                }
            }

            await db.run(
                'UPDATE ahorcado SET letrasAdivinadas = ?, letrasUsadas = ? WHERE chatId = ? AND userId = ?',
                [nuevaAdivinada, letrasUsadas.join(','), chatId, userId]
            );

            if (!nuevaAdivinada.includes('_')) {
                // ¡Ganó!
                const errores = 6 - juego.intentos;
                const recompensa = calcularRecompensa(errores);
                const emoji = obtenerEmoji(errores);

                // Actualizar saldo
                let usuario = await db.get('SELECT * FROM usuarios WHERE chatId = ?', [userId]);
                if (!usuario) {
                    await db.run('INSERT INTO usuarios (chatId, saldo) VALUES (?, ?)', [userId, 100]);
                    usuario = { saldo: 100 };
                }

                const nuevoSaldo = (usuario.saldo || 100) + recompensa;
                await db.run('UPDATE usuarios SET saldo = ? WHERE chatId = ?', [nuevoSaldo, userId]);

                await db.run('DELETE FROM ahorcado WHERE chatId = ? AND userId = ?', [chatId, userId]);

                let mensaje = `🎉 *¡FELICIDADES!* 🎉\n\n`;
                mensaje += `✅ Completaste la palabra: *${juego.palabra.toUpperCase()}*\n\n`;
                mensaje += `${emoji} Errores: ${errores}\n`;
                mensaje += `💰 Recompensa: *+${recompensa} puntos*\n`;
                mensaje += `💳 Saldo actual: *${nuevoSaldo} puntos*\n\n`;
                mensaje += `🎮 Usa \`.ahorcado\` para jugar de nuevo`;

                return await sock.sendMessage(chatId, { text: mensaje }, { quoted: m });
            }

            let mensaje = `✅ ¡Correcto! La letra "${letra.toUpperCase()}" está en la palabra.\n\n`;
            mensaje += dibujarAhorcado(juego.intentos);
            mensaje += `\n\n📝 Palabra: ${nuevaAdivinada}\n`;
            mensaje += `❤️ Intentos restantes: ${juego.intentos}\n`;
            mensaje += `🔤 Letras usadas: ${letrasUsadas.map(l => l.toUpperCase()).join(', ')}`;

            return await sock.sendMessage(chatId, { text: mensaje }, { quoted: m });

        } else {
            // Letra incorrecta
            const nuevosIntentos = juego.intentos - 1;

            if (nuevosIntentos <= 0) {
                await db.run('DELETE FROM ahorcado WHERE chatId = ? AND userId = ?', [chatId, userId]);
                
                let mensaje = `💀 *¡PERDISTE!* 💀\n\n`;
                mensaje += dibujarAhorcado(0);
                mensaje += `\n\n❌ La palabra era: *${juego.palabra.toUpperCase()}*\n\n`;
                mensaje += `🎮 Usa \`.ahorcado\` para intentar de nuevo`;
                
                return await sock.sendMessage(chatId, { text: mensaje }, { quoted: m });
            }

            await db.run(
                'UPDATE ahorcado SET intentos = ?, letrasUsadas = ? WHERE chatId = ? AND userId = ?',
                [nuevosIntentos, letrasUsadas.join(','), chatId, userId]
            );

            let mensaje = `❌ La letra "${letra.toUpperCase()}" no está en la palabra.\n\n`;
            mensaje += dibujarAhorcado(nuevosIntentos);
            mensaje += `\n\n📝 Palabra: ${juego.letrasAdivinadas}\n`;
            mensaje += `❤️ Intentos restantes: ${nuevosIntentos}\n`;
            mensaje += `🔤 Letras usadas: ${letrasUsadas.map(l => l.toUpperCase()).join(', ')}`;

            return await sock.sendMessage(chatId, { text: mensaje }, { quoted: m });
        }

    } catch (error) {
        console.error('Error al procesar intento de ahorcado:', error);
        await sock.sendMessage(chatId, {
            text: '❌ Ocurrió un error al procesar tu intento.'
        }, { quoted: m });
    }
}

export async function run(sock, m, { text }) {
    const chatId = m.key.remoteJid;
    const userId = m.key.participant || m.key.remoteJid;

    try {
        // Asegurar que la tabla existe
        await db.run(`
            CREATE TABLE IF NOT EXISTS ahorcado (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                chatId TEXT NOT NULL,
                userId TEXT NOT NULL,
                palabra TEXT NOT NULL,
                palabraNorm TEXT NOT NULL,
                letrasAdivinadas TEXT NOT NULL,
                letrasUsadas TEXT,
                intentos INTEGER DEFAULT 6,
                categoria TEXT,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        const comando = String(text || '').trim();

        if (!comando || ['nuevo', 'empezar'].includes(comando.toLowerCase())) {
            await iniciarAhorcado(sock, chatId, userId);
        } else if (['salir', 'rendirse'].includes(comando.toLowerCase())) {
            const juego = await db.get(
                'SELECT * FROM ahorcado WHERE chatId = ? AND userId = ?',
                [chatId, userId]
            );

            if (juego) {
                await db.run('DELETE FROM ahorcado WHERE chatId = ? AND userId = ?', [chatId, userId]);
                
                let mensaje = `😢 *Te rendiste*\n\n`;
                mensaje += `❌ La palabra era: *${juego.palabra.toUpperCase()}*\n\n`;
                mensaje += `🎮 Usa \`.ahorcado\` para jugar de nuevo`;
                
                await sock.sendMessage(chatId, { text: mensaje }, { quoted: m });
            } else {
                await sock.sendMessage(chatId, {
                    text: '❌ No tienes un juego activo.\n\nUsa `.ahorcado` para empezar.'
                }, { quoted: m });
            }
        } else {
            await procesarIntento(sock, m, comando);
        }

    } catch (error) {
        console.error('Error en comando ahorcado:', error);
        await sock.sendMessage(chatId, {
            text: '❌ Ocurrió un error. Intenta nuevamente.'
        }, { quoted: m });
    }
}

// Exportar función para procesar letras
export async function procesarMensajeAhorcado(sock, m) {
    const text = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
    const letra = text.trim();
    
    // Solo procesar si es una sola letra
    if (letra.length === 1 && isLetter(letra)) {
        await procesarIntento(sock, m, letra);
    }
}