/**
 * @file Plugin para mostrar una lista de miembros inactivos en un grupo.
 * @author Tu Nombre
 * @version 1.0.0
 */

import { db } from '../db.js';

export const command = '.inactivos';

export const help = `
Muestra una lista de miembros del grupo que han estado inactivos por un período de tiempo.

*Uso:*
  - \`.inactivos [días]\`: Muestra los miembros inactivos por más de los días especificados.

*Ejemplos:*
  - \`.inactivos\`: Muestra inactivos por más de 7 días (por defecto).
  - \`.inactivos 30\`: Muestra inactivos por más de 30 días.

*Nota:* Solo los administradores del grupo pueden usar este comando.
`;

export async function run(sock, m, { text }) {
    const chatId = m.key.remoteJid;
    const senderId = m.key.participant || m.key.remoteJid;

    if (!chatId.endsWith('@g.us')) {
        return await sock.sendMessage(chatId, { text: 'Este comando solo se puede usar en grupos.' }, { quoted: m });
    }

    // Obtener metadatos del grupo para verificar si el remitente es admin
    let groupMetadata;
    try {
        groupMetadata = await sock.groupMetadata(chatId);
    } catch (e) {
        return await sock.sendMessage(chatId, { text: '❌ No pude obtener la información de este grupo.' }, { quoted: m });
    }

    const senderIsAdmin = groupMetadata.participants.find(p => p.id === senderId)?.admin;

    if (!senderIsAdmin) {
        return await sock.sendMessage(chatId, { text: '❌ No tienes permiso para usar este comando. Solo para administradores.' }, { quoted: m });
    }

    const days = parseInt(text) || 7;
    if (days <= 0) {
        return await sock.sendMessage(chatId, { text: 'Por favor, introduce un número de días válido.' }, { quoted: m });
    }

    await sock.sendMessage(chatId, { text: `🔎 Buscando miembros inactivos por más de ${days} días...` }, { quoted: m });

    try {
        // Obtener todos los miembros del grupo según la API de Baileys
        const groupMembers = new Set(groupMetadata.participants.map(p => p.id));

        // Obtener la actividad registrada en la DB para este grupo
        const activity = await db.all('SELECT userId, lastSeen FROM group_activity WHERE chatId = ?', [chatId]);

        const now = new Date();
        const inactiveMembers = [];

        for (const memberId of groupMembers) {
            const userActivity = activity.find(a => a.userId === memberId);
            const lastSeen = userActivity ? new Date(userActivity.lastSeen) : new Date(0); // Si no hay registro, se asume muy inactivo
            const diffDays = (now - lastSeen) / (1000 * 60 * 60 * 24);

            if (diffDays > days) {
                inactiveMembers.push({ id: memberId, days: Math.floor(diffDays) });
            }
        }

        if (inactiveMembers.length === 0) {
            return await sock.sendMessage(chatId, { text: `✅ ¡Excelente! No hay miembros inactivos por más de ${days} días.` }, { quoted: m });
        }

        let response = `*Miembros Inactivos (más de ${days} días):*\n\n`;
        inactiveMembers.forEach(member => {
            response += `👤 @${member.id.split('@')[0]} - *${member.days} días* inactivo\n`;
        });

        await sock.sendMessage(chatId, { text: response, mentions: inactiveMembers.map(m => m.id) }, { quoted: m });

    } catch (error) {
        console.error('Error al buscar inactivos:', error);
        await sock.sendMessage(chatId, { text: '❌ Ocurrió un error al procesar la lista de inactivos.' }, { quoted: m });
    }
}