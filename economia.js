import { db } from '../db.js';

export const command = ['.saldo', '.apostar'];

export async function run(sock, m, { text, command }) {
    const chatId = m.key.remoteJid;

    if (command === '.saldo') {
        try {
            let usuario = await db.get('SELECT saldo FROM usuarios WHERE chatId = ?', chatId);
            if (!usuario) {
                await db.run('INSERT INTO usuarios (chatId) VALUES (?)', chatId);
                usuario = { saldo: 100 }; // Saldo inicial
            }
            await sock.sendMessage(chatId, { text: `💰 Tu saldo es de: ${usuario.saldo} puntos.` }, { quoted: m });
        } catch (error) {
            console.error('Error al consultar saldo:', error);
            await sock.sendMessage(chatId, { text: '❌ Ocurrió un error al consultar tu saldo.' }, { quoted: m });
        }
    } else if (command === '.apostar') {
        const cantidad = parseInt(text);
        if (isNaN(cantidad) || cantidad <= 0) {
            return await sock.sendMessage(chatId, { text: '❌ Por favor, ingresa una cantidad válida para apostar.' }, { quoted: m });
        }

        let usuario = await db.get('SELECT saldo FROM usuarios WHERE chatId = ?', chatId);
        if (!usuario) {
            await sock.run('INSERT INTO usuarios (chatId) VALUES (?)', chatId);
            usuario = { saldo: 100 };
        }

        if (cantidad > usuario.saldo) {
            return await sock.sendMessage(chatId, { text: '❌ No tienes suficiente saldo para realizar esa apuesta.' }, { quoted: m });
        }

        return cantidad;

    }
}
