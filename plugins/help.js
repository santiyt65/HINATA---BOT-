/**
 * @file Plugin de Ayuda - Muestra información detallada de los comandos.
 * @author Tu Nombre
 * @version 1.0.0
 */

export const command = '.help';

/**
 * @typedef {Object} PluginModule
 * @property {string|string[]} command - El comando o comandos que activa el plugin.
 * @property {function} run - La función principal del plugin.
 * @property {string} [help] - El texto de ayuda detallado para el comando.
 */

/**
 * @param {import('@whiskeysockets/baileys').WASocket} sock
 * @param {import('@whiskeysockets/baileys').WAMessage} m
 * @param {object} context
 * @param {string} context.text - El texto del mensaje.
 * @param {Map<string, PluginModule>} context.plugins - El mapa de todos los plugins cargados.
 */
export async function run(sock, m, { text, plugins }) {
    const chatId = m.key.remoteJid;
    const commandToHelp = text.trim();

    if (!commandToHelp) {
        // Muestra una lista de todos los comandos si no se especifica uno.
        let helpMessage = '📖 *Centro de Ayuda de Hinata-Bot*\n\n';
        helpMessage += 'Aquí tienes la lista de todos mis comandos. Usa `.help <comando>` para más detalles.\n\n';
        
        const commandList = [...new Set([...plugins.values()].flatMap(p => p.command))];
        helpMessage += '```' + commandList.sort().join('\n') + '```';

        return await sock.sendMessage(chatId, { text: helpMessage }, { quoted: m });
    }

    const plugin = plugins.get(commandToHelp);

    if (!plugin) {
        return await sock.sendMessage(chatId, { text: `❌ No encontré el comando "${commandToHelp}".` }, { quoted: m });
    }

    if (!plugin.help) {
        return await sock.sendMessage(chatId, { text: `😅 El comando "${commandToHelp}" existe, pero no tiene una descripción de ayuda detallada.` }, { quoted: m });
    }

    // Formatea y envía la ayuda del comando específico.
    const helpText = `*Ayuda para el comando: ${commandToHelp}*\n\n${plugin.help}`;
    await sock.sendMessage(chatId, { text: helpText }, { quoted: m });
}

export const help = `
Muestra la lista de comandos o la ayuda detallada para un comando específico.

*Uso:*
  - \`.help\`: Muestra todos los comandos disponibles.
  - \`.help <comando>\`: Muestra la ayuda para un comando en particular.

*Ejemplo:*
  \`.help .sticker\`
`;