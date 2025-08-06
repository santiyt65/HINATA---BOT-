/**
 * @file Plugin para buscar fondos de pantalla (wallpapers).
 * @author Gemini Code Assist
 * @version 1.0.0
 */

import axios from 'axios';
import { obtenerConfig } from '../lib/functions.js';

export const command = '.papel';

export async function run(sock, m, { text }) {
    const chatId = m.key.remoteJid;
    const config = obtenerConfig();
    const apiKey = config.pexelsApiKey;

    if (!apiKey || apiKey === 'TU_API_KEY_DE_PEXELS') {
        console.error('Error: La API Key de Pexels no está configurada en config.json');
        return await sock.sendMessage(chatId, { text: '⚙️ La función de fondos de pantalla no está configurada. El propietario debe añadir una API Key de Pexels.' }, { quoted: m });
    }

    if (!text) {
        return await sock.sendMessage(chatId, { text: 'Por favor, escribe qué fondo de pantalla quieres buscar.\n\n*Ejemplo:*\n.papel naturaleza' }, { quoted: m });
    }

    try {
        await sock.sendMessage(chatId, { text: `🖼️ Buscando fondos de pantalla de "${text}"...` }, { quoted: m });

        const response = await axios.get(`https://api.pexels.com/v1/search?query=${encodeURIComponent(text)}&per_page=15`, {
            headers: { Authorization: apiKey }
        });

        const photos = response.data.photos;
        if (!photos || photos.length === 0) {
            return await sock.sendMessage(chatId, { text: `❌ No encontré fondos de pantalla para "${text}".` }, { quoted: m });
        }

        const randomPhoto = photos[Math.floor(Math.random() * photos.length)];
        await sock.sendMessage(chatId, { image: { url: randomPhoto.src.large2x }, caption: `*🖼️ Fondo de pantalla para:* ${text}\n*📷 Fotógrafo:* ${randomPhoto.photographer}` }, { quoted: m });

    } catch (error) {
        console.error('Error al buscar fondo de pantalla:', error);
        await sock.sendMessage(chatId, { text: '❌ Ocurrió un error al buscar el fondo de pantalla.' }, { quoted: m });
    }
}
