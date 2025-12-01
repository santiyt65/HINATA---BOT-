import fs from 'fs';

export const command = '.menu';

export async function run(sock, m) {
  const chatId = (m && m.key && m.key.remoteJid) ? m.key.remoteJid : (m.chat || m.from || '');

  const menu = `🌸 *HINATA - BOT* 🌸

📜 *Menú de Comandos:*
🔹 .ping — Verifica si el bot está activo
🔹 .info — Muestra información del bot
🔹 .juegos — Muestra el menú de juegos
🔹 .anime <búsqueda> — Busca información de un anime
🔹 .gif <búsqueda> — Busca y envía un GIF
🔹 .pinterest <búsqueda> — Busca y envía imágenes de Pinterest
🔹 .papel <búsqueda> — Busca un fondo de pantalla
🔹 .top - Muestra el top de usuarios con más puntos
🔹 .saldo - Muestra tu saldo actual
🔹 .apostar <cantidad> - Apuesta una cantidad en los juegos
🔹 .sticker — Crea stickers de imágenes/videos
🔹 .menu — Muestra este menú con imagen

👑 *Comandos de Administrador:*
🔹 .ban @usuario — Impide que un usuario use el bot
🔹 .unban @usuario — Permite que un usuario vuelva a usar el bot
🔹 .kick @usuario — Expulsa a un usuario de un grupo

✨ Más funciones próximamente...`;

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
