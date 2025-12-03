/**
 * @file Plugin Creater - Genera bocetos usando IA
 * @description Crea bocetos y dibujos usando APIs de generación de imágenes con IA
 * @version 1.0.0
 */

import axios from 'axios';
import { obtenerConfig } from '../lib/functions.js';

export const command = '.creater';

/**
 * Genera un boceto usando Hugging Face API (modelo de difusión)
 */
async function generarBocetoHuggingFace(descripcion, token) {
    try {
        const response = await axios.post(
            'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2',
            { inputs: descripcion },
            {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'arraybuffer'
            }
        );
        return Buffer.from(response.data, 'binary');
    } catch (error) {
        console.error('Error generando boceto con Hugging Face:', error.message);
        return null;
    }
}

/**
 * Genera un boceto usando OpenAI DALL-E
 */
async function generarBocetoDALLE(descripcion, apiKey) {
    try {
        const response = await axios.post(
            'https://api.openai.com/v1/images/generations',
            {
                prompt: `Sketch style drawing: ${descripcion}`,
                n: 1,
                size: '512x512',
                response_format: 'url'
            },
            {
                headers: { Authorization: `Bearer ${apiKey}` }
            }
        );
        
        if (response.data.data && response.data.data[0]) {
            const imageUrl = response.data.data[0].url;
            const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
            return Buffer.from(imageResponse.data, 'binary');
        }
        return null;
    } catch (error) {
        console.error('Error generando boceto con DALL-E:', error.message);
        return null;
    }
}

/**
 * Genera un boceto usando Replicate API
 */
async function generarBocetoReplicate(descripcion, apiKey) {
    try {
        const response = await axios.post(
            'https://api.replicate.com/v1/predictions',
            {
                version: 'cd2b1912573848a4d6652ba388dd4d30c0d5eaed987c9642221e865874b15f11', // Stable Diffusion v1.5
                input: {
                    prompt: `Sketch art, pencil drawing: ${descripcion}`,
                    num_outputs: 1
                }
            },
            {
                headers: { Authorization: `Token ${apiKey}` }
            }
        );

        if (response.data.output && response.data.output[0]) {
            const imageUrl = response.data.output[0];
            const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
            return Buffer.from(imageResponse.data, 'binary');
        }
        return null;
    } catch (error) {
        console.error('Error generando boceto con Replicate:', error.message);
        return null;
    }
}

export async function run(sock, m, { text }) {
    const chatId = m.key.remoteJid;
    const config = obtenerConfig();

    // Validar entrada
    if (!text || text.trim().length === 0) {
        return await sock.sendMessage(chatId, {
            text: `🎨 *CREATER - Generador de Bocetos con IA* 🎨\n\n` +
                  `Describe qué quieres que dibuje y te crearé un boceto\n\n` +
                  `*Ejemplos:*
` +
                  `.creater un gato sentado en una ventana\n` +
                  `.creater un paisaje de montañas con nieve\n` +
                  `.creater un robot futurista\n\n` + 
                  `⚠️ *Nota:* El bot necesita una API Key configurada para esta función.`
        }, { quoted: m });
    }

    const descripcion = text.trim();

    // Verificar si hay API keys configuradas
    if (!config.huggingFaceApiKey && !config.openaiApiKey && !config.replicateApiKey) {
        return await sock.sendMessage(chatId, {
            text: `❌ No hay APIs de IA configuradas.\n\n` +
                  `El propietario debe añadir una de estas en 
`config.json`:
` +
                  `- 
`