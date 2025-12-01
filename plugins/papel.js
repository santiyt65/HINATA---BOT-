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

    if (!text || !text.trim()) {
        return await sock.sendMessage(chatId, { text: '📸 Por favor, escribe qué fondo de pantalla quieres buscar.\n\n*Ejemplo:*\n.papel naturaleza' }, { quoted: m });
    }

    let config, apiKey;
    try {
        config = obtenerConfig();
        apiKey = config && config.pexelsApiKey;
    } catch (error) {
        console.error('Error al leer configuración:', error);
        return await sock.sendMessage(chatId, { text: '⚙️ Error al cargar la configuración. Revisa que `config/config.json` exista.' }, { quoted: m });
    }

    if (!apiKey || apiKey === 'TU_API_KEY_DE_PEXELS') {
        console.error('Error: La API Key de Pexels no está configurada en config.json');
        return await sock.sendMessage(chatId, { text: '⚙️ La función de fondos de pantalla no está configurada. El propietario debe añadir una API Key válida de Pexels en `config/config.json`.' }, { quoted: m });
    }

    await sock.sendMessage(chatId, { text: `🖼️ Buscando fondos de pantalla de "${text.trim()}"...` }, { quoted: m });

    try {
        const response = await axios.get(`https://api.pexels.com/v1/search?query=${encodeURIComponent(text.trim())}&per_page=15`, {
            headers: { Authorization: apiKey },
            timeout: 10000
        });

        const photos = (response.data && response.data.photos) || [];
        if (photos.length === 0) {
            return await sock.sendMessage(chatId, { text: `❌ No encontré fondos de pantalla para "${text.trim()}".` }, { quoted: m });
        }

        const randomPhoto = photos[Math.floor(Math.random() * photos.length)];
        
        if (!randomPhoto.src || !randomPhoto.src.large2x) {
            return await sock.sendMessage(chatId, { text: '❌ No se pudo obtener la URL de la imagen. Intenta de nuevo.' }, { quoted: m });
        }

        const caption = `🖼️ *Fondo de pantalla:* ${text.trim()}\n📷 *Fotógrafo:* ${randomPhoto.photographer || 'Desconocido'}`;
        await sock.sendMessage(chatId, { image: { url: randomPhoto.src.large2x }, caption }, { quoted: m });

    } catch (error) {
        const errorMsg = error.response?.status === 401 ? 'API Key inválida o expirada.' : (error.message || 'Error desconocido');
        console.error('Error al buscar fondos de pantalla:', errorMsg);
        await sock.sendMessage(chatId, { text: `❌ Error al buscar fondos de pantalla: ${errorMsg}` }, { quoted: m });
    }
}
