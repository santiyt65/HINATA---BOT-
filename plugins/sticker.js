/**
 * @file Plugin para crear stickers a partir de imágenes o videos.
 * @author Gemini Code Assist
 * @version 1.0.0
 */

import fs from 'fs';
import os from 'os';
import path from 'path';
import ffmpegPath from '@ffmpeg-installer/ffmpeg';
import ffmpeg from 'fluent-ffmpeg';
import { downloadContentFromMessage } from '@whiskeysockets/baileys';

ffmpeg.setFfmpegPath(ffmpegPath.path);

export const command = '.sticker';

async function bufferToWebp(inputBuffer, isVideo = false) {
    const tmpDir = os.tmpdir();
    const inName = path.join(tmpDir, `hinata_in_${Date.now()}_${Math.random().toString(36).slice(2)}`);
    const outName = `${inName}.webp`;

    // Determine input extension to help ffmpeg guess format (jpg/png/mp4)
    const inFile = isVideo ? `${inName}.mp4` : `${inName}.jpg`;

    try {
        await fs.promises.writeFile(inFile, inputBuffer);

        return await new Promise((resolve, reject) => {
            const command = ffmpeg(inFile)
                .outputOptions([
                    '-vcodec', 'libwebp',
                    '-vf', "scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:-1:-1:color=#000000,setsar=1",
                    '-loop', '0',
                    '-ss', '0',
                    '-t', isVideo ? '10' : '1',
                    '-preset', 'default',
                    '-an',
                    '-vsync', '0',
                    '-sws_flags', 'bilinear'
                ])
                .toFormat('webp')
                .save(outName);

            command.on('end', async () => {
                try {
                    const webpBuffer = await fs.promises.readFile(outName);
                    resolve(webpBuffer);
                } catch (err) {
                    reject(err);
                } finally {
                    // cleanup
                    fs.promises.unlink(inFile).catch(() => {});
                    fs.promises.unlink(outName).catch(() => {});
                }
            });

            command.on('error', (err) => {
                // cleanup
                fs.promises.unlink(inFile).catch(() => {});
                fs.promises.unlink(outName).catch(() => {});
                reject(err);
            });
        });
    } catch (err) {
        // try to cleanup
        try { await fs.promises.unlink(inFile); } catch {};
        try { await fs.promises.unlink(outName); } catch {};
        throw err;
    }
}

export async function run(sock, m) {
    const chatId = m.key.remoteJid;

    // Determina si el mensaje actual o el citado contiene la media.
    const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const messageContent = quoted || m.message;
    const messageType = Object.keys(messageContent)[0];

    if (messageType !== 'imageMessage' && messageType !== 'videoMessage') {
        return await sock.sendMessage(chatId, { text: '🤖 Responde a una imagen o video, o envía uno con el comando `.sticker` para crear un sticker.' }, { quoted: m });
    }

    // Limita la duración del video a 10 segundos para evitar errores.
    if (messageType === 'videoMessage' && messageContent.videoMessage?.seconds > 10) {
        return await sock.sendMessage(chatId, { text: '❌ El video es demasiado largo. Por favor, envía un video de 10 segundos o menos.' }, { quoted: m });
    }

    await sock.sendMessage(chatId, { text: '⚙️ Creando tu sticker, por favor espera...' }, { quoted: m });

    try {
        const stream = await downloadContentFromMessage(messageContent[messageType], messageType.replace('Message', ''));

        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }

        const isVideo = messageType === 'videoMessage';
        const webpBuffer = await bufferToWebp(buffer, isVideo);

        // Envía el buffer convertido como sticker (webp)
        await sock.sendMessage(chatId, { sticker: webpBuffer }, { quoted: m });

    } catch (error) {
        console.error('Error al crear el sticker:', error);
        await sock.sendMessage(chatId, { text: '❌ Ocurrió un error al crear el sticker. Asegúrate de que ffmpeg esté instalado y accesible.' }, { quoted: m });
    }
}
