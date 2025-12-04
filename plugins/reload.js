import { promises as fs } from 'fs';
import path from 'path';
import { cargarPlugins } from '../index.js';

// Helper para obtener la ruta absoluta del config.json
const configPath = path.join(process.cwd(), 'config', 'config.json');

export const command = ['.reload', '.updateplugins'];

export async function run(sock, msg) {
    const senderId = msg.key.participant || msg.key.remoteJid;
    const chatId = msg.key.remoteJid;

    try {
        // 1. Cargar la configuración para obtener el JID del propietario
        const configData = await fs.readFile(configPath, 'utf8');
        const config = JSON.parse(configData);

        const ownerJid = (config.ownerJid || '').trim();
        const propietario = (config.propietario || '').trim();

        // 2. Verificar si el remitente es el propietario
        let isOwner = false;
        if (ownerJid && senderId.includes(ownerJid)) {
            isOwner = true;
        } else if (propietario && senderId.includes(propietario)) {
            isOwner = true;
        }
        
        if (!isOwner) {
            await sock.sendMessage(chatId, { text: '❌ No tienes permiso para usar este comando. Solo el propietario puede recargar los plugins.' }, { quoted: msg });
            return;
        }

        // 3. Si es el propietario, ejecutar la recarga
        await sock.sendMessage(chatId, { text: '🔄 Recargando plugins... Por favor espera.' }, { quoted: msg });

        const { plugins: loadedPlugins, errors } = await cargarPlugins();

        let responseText = `✅ Recarga completada. Se cargaron ${loadedPlugins.size} comandos.`;

        if (errors.length > 0) {
            responseText += '\n\n*Se encontraron errores en los siguientes plugins:*\n';
            errors.forEach(err => {
                responseText += `\n📄 *Archivo:* ${err.file}\n   └─ 🐛 *Error:* ${err.error}`;
            });
            responseText += '\n\nEstos plugins no estarán disponibles hasta que se corrijan los errores.';
        }

        await sock.sendMessage(chatId, { text: responseText }, { quoted: msg });
        console.log(`🔄 Plugins recargados por el propietario (${senderId}). Errores: ${errors.length}`);

    } catch (error) {
        console.error('❌ Error en el comando .reload:', error);
        await sock.sendMessage(chatId, { text: '❌ Ocurrió un error al intentar recargar los plugins.' }, { quoted: msg });
    }
}
