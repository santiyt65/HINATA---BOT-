/**
 * @file Plugin para buscar información de animes.
 * @author Gemini Code Assist
 * @version 1.0.0
 */

import axios from 'axios';

export const command = '.anime';

export async function run(sock, m, { text }) {
    const chatId = m.key.remoteJid;

    if (!text) {
        return await sock.sendMessage(chatId, {
            text: 'Por favor, escribe el nombre de un anime para buscar.\n\n*Ejemplo:*\n.anime Naruto'
        }, { quoted: m });
    }

    try {
        await sock.sendMessage(chatId, { text: `🔎 Buscando información de "${text}"...` }, { quoted: m });

        const response = await axios.get(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(text)}&limit=1`);
        const animeData = response.data.data;

        if (!animeData || animeData.length === 0) {
            return await sock.sendMessage(chatId, { text: `❌ No encontré información para el anime "${text}".` }, { quoted: m });
        }

        const anime = animeData[0];
        const imageUrl = anime.images.jpg.large_image_url;
        const synopsis = anime.synopsis ? anime.synopsis.substring(0, 400) + '...' : 'No disponible.';

        const caption = `*✨ ${anime.title} (${anime.title_japanese}) ✨*\n\n*🎬 Episodios:* ${anime.episodes || 'N/A'}\n*⭐ Puntuación:* ${anime.score || 'N/A'}\n*📊 Estado:* ${anime.status || 'N/A'}\n*🗓️ Emisión:* ${anime.aired.string || 'N/A'}\n\n*📖 Sinopsis:*\n${synopsis}\n\n*🔗 Más información:* ${anime.url}`;

        await sock.sendMessage(chatId, { image: { url: imageUrl }, caption: caption }, { quoted: m });

    } catch (error) {
        console.error('Error al buscar anime:', error);
        await sock.sendMessage(chatId, { text: '❌ Ocurrió un error al buscar la información del anime.' }, { quoted: m });
    }
}
