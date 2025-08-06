import fs from 'fs';

export const command = '.menu';

export async function run(sock, m) {
    let menu = `🌸 *HINATA - BOT* 🌸

📜 *Menú de Comandos:*
🔹 .ping — Verifica si el bot está activo
🔹 .info — Muestra información del bot
🔹 .juegos — Muestra el menú de juegos
🔹 .anime <búsqueda> — Busca información de un anime
🔹 .gif <búsqueda> — Busca y envía un GIF
🔹 .top - Muestra el top de usuarios con más puntos
🔹 .saldo - Muestra tu saldo actual
🔹 .apostar <cantidad> - Apuesta una cantidad en los juegos
🔹 .papel <búsqueda> — Busca un fondo de pantalla
🔹 .sticker — Crea stickers de imágenes/videos
🔹 .menu — Muestra este menú con imagen

👑 *Comandos de Administrador:*
🔹 .ban @usuario — Impide que un usuario use el bot
🔹 .unban @usuario — Permite que un usuario vuelva a usar el bot
🔹 .kick @usuario — Expulsa a un usuario de un grupo

✨ Más funciones próximamente...`;

  const buffer = fs.readFileSync('./media/menu.jpg');

  await sock.sendMessage(m.key.remoteJid, {
    image: buffer,
    caption: menu
  });
}
