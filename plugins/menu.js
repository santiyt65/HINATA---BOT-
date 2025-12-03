import fs from 'fs';

export const command = '.menu';

export async function run(sock, m) {
  const chatId = (m && m.key && m.key.remoteJid) ? m.key.remoteJid : (m.chat || m.from || '');

  const menu = `🌸 *HINATA - BOT* 🌸

📜 *Menú de Comandos:*

*GENERAL*
🔹 .ping — Verifica si el bot está activo.
🔹 .info — Muestra información del bot.
🔹 .menu — Muestra este menú.
🔹 .creater — Muestra el creador del bot.

*BÚSQUEDA*
🔹 .google <búsqueda> — Busca en Google.
🔹 .anime <nombre> — Busca información de un anime.
🔹 .gif <búsqueda> — Busca y envía un GIF.
🔹 .pinterest <búsqueda> — Busca imágenes en Pinterest.
🔹 .papel <búsqueda> — Busca un fondo de pantalla.

*HERRAMIENTAS*
🔹 .sticker — Crea stickers de imágenes/videos.
🔹 .musica <búsqueda> — Descarga música de YouTube.

*JUEGOS*
🔹 .juegos — Muestra el menú de juegos.
🔹 .adivina <número> — Adivina el número secreto.
🔹 .ahorcado <letra> — Juega al ahorcado.
🔹 .ppt <piedra|papel|tijera> — Juega piedra, papel o tijera.
🔹 .slot — Juega a la máquina tragamonedas.
🔹 .trivia — Responde preguntas de trivia.

*ECONOMÍA*
🔹 .saldo — Muestra tu saldo actual.
🔹 .apostar <cantidad> — Apuesta en los juegos.

👑 *ADMINISTRADOR*
🔹 .ban @usuario — Impide que un usuario use el bot.
🔹 .unban @usuario — Permite que un usuario vuelva a usar el bot.
🔹 .kick @usuario — Expulsa a un usuario de un grupo.

🔒 *PROPIETARIO*
🔹 .reload — Recarga los plugins del bot.
🔹 .setcooldown <tiempo> — Configura el tiempo de espera de los comandos.`;

  const imgPath = './media/menu.jpg';

  try {
    if (fs.existsSync(imgPath)) {
      const buffer = fs.readFileSync(imgPath);
      await sock.sendMessage(chatId, { image: buffer, caption: menu }, { quoted: m });
      return;
    }
  } catch (err) {
    console.error('Error leyendo imagen de menu:', err && err.message ? err.message : err);
  }

  // Fallback a mensaje de texto si la imagen no está disponible
  try {
    await sock.sendMessage(chatId, { text: menu }, { quoted: m });
  } catch (err) {
    console.error('Error enviando menu como texto:', err && err.message ? err.message : err);
  }
}
