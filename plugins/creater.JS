/**
 * @file Plugin Creater - Muestra el perfil del creador y el repositorio del bot.
 * @version 2.0.0
 */

export const command = '.creater';

export async function run(sock, m) {
    const chatId = m.key.remoteJid;

    const creatorMessage = `*¡Hola! Soy HINATA - BOT* 🤖

Fui creada por *santiyt65*. Puedes ver su perfil de GitHub aquí:
 perfil de GITHUB : https://github.com/santiyt65

Si te gusta este bot, ¡considera darle una estrella al repositorio! 🌟
 Repositorio del Bot: https://github.com/santiyt65/HINATA---BOT-

¡Gracias por tu apoyo!`;

    await sock.sendMessage(chatId, { text: creatorMessage }, { quoted: m });
}
