/**
 * @file Plugin para mostrar un menú de juegos disponibles.
 * @author Gemini Code Assist
 * @version 1.0.0
 */

export const command = '.juegos';

export async function run(sock, m) {
    const chatId = m.key.remoteJid;

    const menuJuegos = `🎮 *MENÚ DE JUEGOS* 🎮

Aquí tienes la lista de juegos que puedes disfrutar:

🎲 *.adivina nuevo*
   Adivina el número que estoy pensando.

🪢 *.ahorcado*
   Juega al clásico ahorcado y adivina la palabra.

🎰 *.slot*
   Prueba tu suerte en la máquina tragamonedas.

❓ *.trivia*
   Demuestra tus conocimientos con preguntas de trivia.

✊ *.ppt <opción>*
   Juega Piedra, Papel o Tijera contra mí. (Ej: .ppt piedra)

¡Escribe el comando del juego que quieras empezar!`;

    await sock.sendMessage(chatId, { text: menuJuegos }, { quoted: m });
}
