/**
 * @file Plugin para comandos de administración (ban, unban, kick).
 * @author Gemini Code Assist
 * @version 1.0.0
 */

import { db } from '../db.js';
import { obtenerConfig } from '../lib/functions.js';

export const command = ['.ban', '.unban', '.kick'];

export async function run(sock, m, { command }) {
    const config = obtenerConfig();
    const chatId = m.key.remoteJid;
    const senderId = m.key.participant || m.sender;

    // Verificar si el que ejecuta es el propietario
    if (senderId !== config.propietario) {
        return await sock.sendMessage(chatId, { text: '❌ No tienes permiso para usar este comando.' }, { quoted: m });
    }

    const mentionedJid = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
    if (!mentionedJid) {
        return await sock.sendMessage(chatId, { text: `Debes mencionar a un usuario para ${command.slice(1)}.\n\n*Ejemplo:*\n${command} @usuario` }, { quoted: m });
    }

    // --- Comandos de Baneo Interno ---
    if (command === '.ban') {
        try {
            await db.run('INSERT OR IGNORE INTO usuarios (chatId) VALUES (?)', [mentionedJid]);
            await db.run('UPDATE usuarios SET banned = 1 WHERE chatId = ?', [mentionedJid]);
            await sock.sendMessage(chatId, { text: `✅ El usuario @${mentionedJid.split('@')[0]} ha sido baneado y no podrá usar el bot.` }, { quoted: m, mentions: [mentionedJid] });
        } catch (error) {
            console.error('Error al banear:', error);
            await sock.sendMessage(chatId, { text: '❌ Ocurrió un error al banear al usuario.' }, { quoted: m });
        }
        return;
    }

    if (command === '.unban') {
        try {
            await db.run('UPDATE usuarios SET banned = 0 WHERE chatId = ?', [mentionedJid]);
            await sock.sendMessage(chatId, { text: `✅ El usuario @${mentionedJid.split('@')[0]} ha sido desbaneado y ya puede usar el bot.` }, { quoted: m, mentions: [mentionedJid] });
        } catch (error) {
            console.error('Error al desbanear:', error);
            await sock.sendMessage(chatId, { text: '❌ Ocurrió un error al desbanear al usuario.' }, { quoted: m });
        }
        return;
    }

    // --- Comando de Expulsión ---
    if (command === '.kick') {
        if (!chatId.endsWith('@g.us')) {
            return await sock.sendMessage(chatId, { text: 'Este comando solo se puede usar en grupos.' }, { quoted: m });
        }

        try {
            const groupMetadata = await sock.groupMetadata(chatId);
            const botIsAdmin = groupMetadata.participants.find(p => p.id === sock.user.id)?.admin;

            if (!botIsAdmin) {
                return await sock.sendMessage(chatId, { text: '❌ Necesito ser administrador del grupo para poder expulsar usuarios.' }, { quoted: m });
            }

            // Evitar que el bot se expulse a sí mismo o al propietario
            if (mentionedJid === sock.user.id || mentionedJid === config.propietario) {
                 return await sock.sendMessage(chatId, { text: '🤨 No puedo hacer eso.' }, { quoted: m });
            }

            await sock.sendMessage(chatId, { text: `✅ Expulsando a @${mentionedJid.split('@')[0]}...` }, { mentions: [mentionedJid] });
            await sock.groupParticipantsUpdate(chatId, [mentionedJid], 'remove');

        } catch (error) {
            console.error('Error al expulsar:', error);
            await sock.sendMessage(chatId, { text: '❌ Ocurrió un error al intentar expulsar al usuario.' }, { quoted: m });
        }
        return;
    }
}

