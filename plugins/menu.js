import fs from 'fs';

export const command = '.menu';

export async function run(sock, m) {
  const chatId = (m && m.key && m.key.remoteJid) ? m.key.remoteJid : (m.chat || m.from || '');

  const menu =  `
╭─⬣「 *HINATA-BOT* 」⬣─╮
│
│  ¡Hola, {userName}! 👋
│  Soy Hinata, tu asistente virtual.
│  Aquí tienes mi lista de comandos:
│
├─⬣「 *MÚSICA Y VIDEO* 🎵 」
│  │
│  ├─ *.play* <canción>
│  │  └ _Reproduce una canción de YouTube._
│  │
│  └─ *.yt* <video>
│     └ _Busca y descarga un video._
│
├─⬣「 *BÚSQUEDAS* 🔍 」
│  │
│  ├─ *.google* <texto>
│  │  └ _Busca información en Google._
│  │
│  └─ *.letra* <canción>
│     └ _Encuentra la letra de una canción._
│
├─⬣「 *DIVERSIÓN* ✨ 」
│  │
│  ├─ *.sticker*
│  │  └ _Convierte una imagen en sticker._
│  │
│  └─ *.meme*
│     └ _Genera un meme al azar._
│
├─⬣「 *GRUPOS* 🛡️ 」
│  │
│  ├─ *.add* <número>
│  │  └ _Añade un miembro al grupo._
│  │
│  └─ *.kick* <@usuario>
│     └ _Elimina a un miembro del grupo._
│
│
│  💡 _Usa .help <comando> para más detalles._
│
╰─⬣「 Creado por *Tu Nombre* 」⬣─╯
`;

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
