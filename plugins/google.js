/**
 * @file Plugin Google Search - Realiza búsquedas en Google usando la API
 * @version 1.0.0
 */

import axios from 'axios';
import { promises as fs } from 'fs';
import path from 'path';

// Helper para obtener la ruta absoluta del config.json
const configPath = path.join(process.cwd(), 'config', 'config.json');

export const command = ['.google', '.search'];

export async function run(sock, msg, { text }) {
    const chatId = msg.key.remoteJid;

    // 1. Validar que el usuario ha proporcionado un término de búsqueda
    if (!text || text.trim().length === 0) {
        return await sock.sendMessage(chatId, {
            text: '🔎 *Buscador de Google*\n\n' +
                  'Por favor, proporciona un término para buscar.\n\n' +
                  '*Ejemplo:* `.google qué es un bot de WhatsApp`'
        }, { quoted: msg });
    }

    const query = text.trim();
    let config;

    // 2. Cargar la configuración
    try {
        const configData = await fs.readFile(configPath, 'utf8');
        config = JSON.parse(configData);
    } catch (error) {
        console.error('❌ Error al leer o parsear config/config.json:', error);
        return await sock.sendMessage(chatId, { text: '❌ Error interno: no se pudo leer la configuración.' }, { quoted: msg });
    }

    const apiKey = config.googleSearchApiKey;
    const cseId = config.googleCseId;

    // 3. Verificar que las credenciales estén en config.json
    if (!apiKey || !cseId) {
        return await sock.sendMessage(chatId, {
            text: '❌ *Configuración Incompleta*\n\n' +
                  'Este comando requiere una `googleSearchApiKey` y un `googleCseId` en el archivo `config/config.json`.\n\n' +
                  'Pídele al propietario del bot que las configure.'
        }, { quoted: msg });
    }

    await sock.sendMessage(chatId, { text: `🔎 Buscando en Google: "${query}"...` }, { quoted: msg });

    // 4. Realizar la petición a la API de Google Custom Search
    try {
        const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
            params: {
                key: apiKey,
                cx: cseId,
                q: query
            }
        });

        const items = response.data.items;

        // 5. Procesar y formatear la respuesta
        if (!items || items.length === 0) {
            return await sock.sendMessage(chatId, { text: `❌ No se encontraron resultados para "${query}".` }, { quoted: msg });
        }

        let resultsText = `*Resultados de la búsqueda para "${query}":*\n\n`;
        // Limitar a los primeros 4 resultados para no saturar el chat
        for (let i = 0; i < Math.min(items.length, 4); i++) {
            const item = items[i];
            resultsText += `📝 *Título:* ${item.title}\n`;
            resultsText += `🔗 *Enlace:* ${item.link}\n`;
            resultsText += `📄 *Descripción:* ${item.snippet}\n\n`;
        }

        await sock.sendMessage(chatId, { text: resultsText.trim() }, { quoted: msg });

    } catch (error) {
        console.error('❌ Error al realizar la búsqueda en Google:', error.response ? error.response.data : error.message);
        
        // Manejar errores comunes de la API
        if (error.response && error.response.data && error.response.data.error) {
            const apiError = error.response.data.error;
            if (apiError.code === 429) {
                 await sock.sendMessage(chatId, { text: '❌ Se ha excedido el límite de búsquedas diarias. Inténtalo de nuevo mañana.' }, { quoted: msg });
            } else {
                 await sock.sendMessage(chatId, { text: `❌ Error de la API de Google: ${apiError.message}` }, { quoted: msg });
            }
        } else {
            await sock.sendMessage(chatId, { text: '❌ Ocurrió un error inesperado al contactar con Google.' }, { quoted: msg });
        }
    }
}
