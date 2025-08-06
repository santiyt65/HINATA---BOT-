import fs from 'fs';

export const command = '.menu';

export async function run(sock, m) {
  const menu = `🌸 *HINATA - BOT* 🌸

📜 *Menú de Comandos:*
🔹 .ping — Verifica si el bot está activo
🔹 .info — Muestra información del bot
🔹 .gif <búsqueda> — Busca y envía un GIF
🔹 .sticker — Crea stickers de imágenes/videos
🔹 .menu — Muestra este menú con imagen

✨ Más funciones próximamente...`;

  const buffer = fs.readFileSync('./media/menu.jpg');

  await sock.sendMessage(m.key.remoteJid, {
    image: buffer,
    caption: menu
  });
}
