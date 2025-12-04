/**
 * @file Plugin para gestionar comandos (habilitar/deshabilitar) en chats.
 * @author Tu Nombre
 * @version 1.0.0
 */

import { db } from './db.js';
import { obtenerConfig } from '../lib/functions.js';

export const command = '.cmd';

export const help = `
Gestiona los comandos habilitados en este chat. (Solo para el propietario del bot)

*Uso:*
  - \`.cmd off <comando>\`: Deshabilita un comando en este chat.
  - \`.cmd on <comando>\`: Habilita un comando en este chat.
  - \`.cmd list\`: Muestra los comandos deshabilitados en este chat.

*Ejemplos:*
  - \`.cmd off .sticker\`
  - \`.cmd on .sticker\`
`;

function isOwner(userId, config) {
    const ownerId = (config.ownerJid || config.propietario || '').trim();
    if (!ownerId) return false;
    if (ownerId.includes('@')) {
        return userId === ownerId;
    }
    return userId.includes(ownerId);
}

export async function run(sock, m, { text, plugins }) {
    const chatId = m.key.remoteJid;
    const senderId = m.key.participant || m.key.remoteJid;

    let config;
    try {
        config = obtenerConfig();
    } catch (e) {
        return await sock.sendMessage(chatId, { text: '⚠️ No se pudo leer la configuración.' }, { quoted: m });
    }

    if (!isOwner(senderId, config)) {
        return await sock.sendMessage(chatId, { text: '❌ No tienes permiso para usar este comando.' }, { quoted: m });
    }

    const [action, cmdToManage] = text.trim().split(' ');

    if (action === 'off') {
        if (!cmdToManage || !plugins.has(cmdToManage)) {
            return await sock.sendMessage(chatId, { text: `❌ El comando "${cmdToManage}" no existe.` }, { quoted: m });
        }
        if (cmdToManage === '.cmd') {
            return await sock.sendMessage(chatId, { text: '🤨 No puedes deshabilitar este mismo comando.' }, { quoted: m });
        }
        try {
            await db.run('INSERT OR IGNORE INTO command_blacklist (chatId, command) VALUES (?, ?)', [chatId, cmdToManage]);
            await sock.sendMessage(chatId, { text: `✅ El comando *${cmdToManage}* ha sido deshabilitado en este chat.` }, { quoted: m });
        } catch (e) {
            await sock.sendMessage(chatId, { text: '❌ Error al actualizar la base de datos.' }, { quoted: m });
        }
    } else if (action === 'on') {
        if (!cmdToManage) {
            return await sock.sendMessage(chatId, { text: '❓ ¿Qué comando quieres habilitar?' }, { quoted: m });
        }
        try {
            await db.run('DELETE FROM command_blacklist WHERE chatId = ? AND command = ?', [chatId, cmdToManage]);
            await sock.sendMessage(chatId, { text: `✅ El comando *${cmdToManage}* ha sido habilitado en este chat.` }, { quoted: m });
        } catch (e) {
            await sock.sendMessage(chatId, { text: '❌ Error al actualizar la base de datos.' }, { quoted: m });
        }
    } else if (action === 'list') {
        const blacklisted = await db.all('SELECT command FROM command_blacklist WHERE chatId = ?', [chatId]);
        if (blacklisted.length === 0) {
            return await sock.sendMessage(chatId, { text: '✅ Todos los comandos están habilitados en este chat.' }, { quoted: m });
        }
        const list = blacklisted.map(item => item.command).join('\n');
        await sock.sendMessage(chatId, { text: `*Comandos deshabilitados en este chat:*\n\`\`\`\n${list}\n\`\`\`` }, { quoted: m });
    } else {
        await sock.sendMessage(chatId, { text: help }, { quoted: m });
    }
}