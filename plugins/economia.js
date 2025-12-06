import { db } from './db.js';

export const command = ['.saldo', '.apostar', '.depositar'];

export async function run(sock, m, { text, command }) {
    const chatId = m.key.remoteJid;

    if (command === '.saldo') {
        try {
            let usuario = await db.get('SELECT saldo, banco FROM usuarios WHERE chatId = ?', [chatId]);
            if (!usuario) {
                await db.run('INSERT INTO usuarios (chatId) VALUES (?)', [chatId]);
                usuario = { saldo: 100, banco: 0 }; // Saldo inicial
            }
            await sock.sendMessage(chatId, { text: `💰 Tu saldo es de: ${usuario.saldo} puntos.\n🏦 Tu banco tiene: ${usuario.banco} puntos.` }, { quoted: m });
        } catch (error) {
            console.error('Error al consultar saldo:', error);
            await sock.sendMessage(chatId, { text: '❌ Ocurrió un error al consultar tu saldo.' }, { quoted: m });
        }
    } else if (command === '.apostar') {
        const cantidad = parseInt(text);
        if (isNaN(cantidad) || cantidad <= 0) {
            return await sock.sendMessage(chatId, { text: '❌ Por favor, ingresa una cantidad válida para apostar.' }, { quoted: m });
        }

        let usuario = await db.get('SELECT saldo FROM usuarios WHERE chatId = ?', [chatId]);
        if (!usuario) {
            await db.run('INSERT INTO usuarios (chatId) VALUES (?)', [chatId]);
            usuario = { saldo: 100 };
        }

        if (cantidad > usuario.saldo) {
            return await sock.sendMessage(chatId, { text: '❌ No tienes suficiente saldo para realizar esa apuesta.' }, { quoted: m });
        }

        return cantidad;

    } else if (command === '.depositar') {
        const cantidad = parseInt(text);
        if (isNaN(cantidad) || cantidad <= 0) {
            return await sock.sendMessage(chatId, { text: '❌ Por favor, ingresa una cantidad válida para depositar.' }, { quoted: m });
        }

        let usuario = await db.get('SELECT saldo, banco FROM usuarios WHERE chatId = ?', [chatId]);
        if (!usuario) {
            await db.run('INSERT INTO usuarios (chatId) VALUES (?)', [chatId]);
            usuario = { saldo: 100, banco: 0 };
        }

        if (cantidad > usuario.saldo) {
            return await sock.sendMessage(chatId, { text: '❌ No tienes suficiente saldo para depositar esa cantidad.' }, { quoted: m });
        }

        const nuevoSaldo = usuario.saldo - cantidad;
        const nuevoBanco = usuario.banco + cantidad;

        await db.run('UPDATE usuarios SET saldo = ?, banco = ? WHERE chatId = ?', [nuevoSaldo, nuevoBanco, chatId]);

        await sock.sendMessage(chatId, { text: `✅ Depositaste ${cantidad} puntos en tu banco.\n💰 Tu nuevo saldo es de: ${nuevoSaldo} puntos.\n🏦 Tu banco ahora tiene: ${nuevoBanco} puntos.` }, { quoted: m });
    }
}