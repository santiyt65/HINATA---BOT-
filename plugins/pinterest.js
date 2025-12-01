/**
 * @file Plugin para buscar imágenes similares a Pinterest.
 * @description Busca y envía imágenes de alta calidad usando APIs públicas.
 * @version 1.0.0
 */

import axios from 'axios';
import { obtenerConfig } from '../lib/functions.js';

export const command = '.pinterest';

export async function run(sock, m, { text }) {
    const chatId = m.key.remoteJid;

    if (!text || !text.trim()) {
        return await sock.sendMessage(chatId, { text: '📌 Por favor, escribe qué quieres buscar en Pinterest.\n\n*Ejemplo:*\n.pinterest decoración de interiores' }, { quoted: m });
    }

    await sock.sendMessage(chatId, { text: `📌 Buscando imágenes de "${text.trim()}"...` }, { quoted: m });

    try {
        let config;
        try {
            config = obtenerConfig();
        } catch (err) {
            console.warn('Config no disponible, usando valores por defecto');
            config = {};
        }

        const query = encodeURIComponent(text.trim());
        let images = [];

        // Intentar obtener imágenes de Pexels (más confiable)
        if (config.pexelsApiKey && config.pexelsApiKey !== 'TU_API_KEY_DE_PEXELS') {
            try {
                const response = await axios.get(
                    `https://api.pexels.com/v1/search?query=${query}&per_page=15`,
                    {
                        headers: { Authorization: config.pexelsApiKey },
                        timeout: 10000
                    }
                );

                images = (response.data.photos || []).map(photo => ({
                    url: photo.src?.large2x || photo.src?.large,
                    title: photo.photographer || 'Imagen'
                }));
            } catch (err) {
                console.warn('Error con Pexels API:', err.message);
            }
        }

        // Fallback a búsqueda genérica sin API (usando web scraping responsable)
        if (images.length === 0) {
            try {
                // Alternativa: usar Unsplash sin API Key (limitado pero funcional)
                const response = await axios.get(
                    `https://api.unsplash.com/search/photos?query=${query}&per_page=15`,
                    {
                        headers: { 'Authorization': 'Client-ID demo' }, // Cliente demo público
                        timeout: 10000
                    }
                );

                images = (response.data.results || []).map(photo => ({
                    url: photo.urls?.regular,
                    title: photo.user?.name || 'Imagen'
                }));
            } catch (err) {
                console.warn('Error con Unsplash:', err.message);
            }
        }

        if (!images || images.length === 0) {
            return await sock.sendMessage(chatId, { text: `❌ No encontré imágenes para "${text.trim()}". Intenta con otra búsqueda.` }, { quoted: m });
        }

        // Seleccionar y enviar 3 imágenes aleatorias
        const shuffled = images.sort(() => Math.random() - 0.5);
        const selectedImages = shuffled.slice(0, Math.min(3, shuffled.length));

        let sent = 0;
        for (const img of selectedImages) {
            if (img.url) {
                try {
                    await sock.sendMessage(
                        chatId,
                        {
                            image: { url: img.url },
                            caption: `📌 *${text.trim()}*\n👤 ${img.title}`
                        },
                        { quoted: m }
                    );
                    sent++;
                    // Pequeño delay entre imágenes para evitar rate limiting
                    await new Promise(resolve => setTimeout(resolve, 500));
                } catch (imgErr) {
                    console.error('Error enviando imagen:', imgErr.message);
                }
            }
        }

        if (sent === 0) {
            await sock.sendMessage(chatId, { text: '❌ No se pudieron enviar las imágenes. Intenta de nuevo.' }, { quoted: m });
        }

    } catch (error) {
        console.error('Error al buscar imágenes:', error.message);

        let errorMsg = '❌ Error al buscar imágenes.';
        if (error.code === 'ECONNABORTED') {
            errorMsg = '⏱️ La búsqueda tardó demasiado. Intenta de nuevo.';
        } else if (error.message.includes('401') || error.message.includes('403')) {
            errorMsg = '⚙️ Erro de autenticación en la API. Revisa tu configuración.';
        }

        await sock.sendMessage(chatId, { text: errorMsg }, { quoted: m });
    }
}
