/**
 * @file Plugin para crear stickers a partir de imágenes o videos.
 * @author Gemini Code Assist
 * @version 1.0.0
 */

import { downloadContentFromMessage } from '@whiskeysockets/baileys';

export const command = '.sticker';

export async function run(sock, m) {
    const chatId = m.key.remoteJid;

    // Determina si el mensaje actual o el citado contiene la media.
    const quoted = m.message.extendedTextMessage?.contextInfo?.quotedMessage;
    const messageContent = quoted || m.message;
    const messageType = Object.keys(messageContent)[0];

    if (messageType !== 'imageMessage' && messageType !== 'videoMessage') {
        return await sock.sendMessage(chatId, { text: '🤖 Responde a una imagen o video, o envía uno con el comando `.sticker` para crear un sticker.' }, { quoted: m });
    }

    // Limita la duración del video a 10 segundos para evitar errores.
    if (messageType === 'videoMessage' && messageContent.videoMessage.seconds > 10) {
        return await sock.sendMessage(chatId, { text: '❌ El video es demasiado largo. Por favor, envía un video de 10 segundos o menos.' }, { quoted: m });
    }

    await sock.sendMessage(chatId, { text: '⚙️ Creando tu sticker, por favor espera...' }, { quoted: m });

    try {
        const stream = await downloadContentFromMessage(messageContent[messageType], messageType.replace('Message', ''));

        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }

        // Envía el buffer como sticker
        await sock.sendMessage(chatId, { sticker: buffer }, { quoted: m });

    } catch (error) {
        console.error('Error al crear el sticker:', error);
        await sock.sendMessage(chatId, { text: '❌ Ocurrió un error al crear el sticker. Asegúrate de que ffmpeg esté instalado.' }, { quoted: m });
    }
}
