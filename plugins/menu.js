import fs from 'fs';

export const command = '.menu';

export async function run(sock, m) {
  const chatId = (m && m.key && m.key.remoteJid) ? m.key.remoteJid : (m.chat || m.from || '');

  const menu = `
╭─⬣「 *HINATA-BOT* 」⬣─╮
│
│  ¡Hola, {userName}! 👋
│  Soy Hinata, tu asistente virtual.
│  Aquí tienes mi lista de comandos:
│
├─⬣「 *BÚSQUEDAS* 🔍 」
│  │
│  ├─ *.google* <texto>
│  │  └ _Busca en Google._
│  │
│  ├─ *.anime* <nombre>
│  │  └ _Busca información de un anime._
│  │
│  ├─ *.pinterest* <texto>
│  │  └ _Busca imágenes en Pinterest._
│  │
│  └─ *.papel* <texto>
│     └ _Busca un fondo de pantalla._
│
├─⬣「 *MULTIMEDIA* 🖼️ 」
│  │
│  ├─ *.musica* <canción>
│  │  └ _Descarga una canción._
│  │
│  ├─ *.sticker*
│  │  └ _Crea un sticker de imagen/video._
│  │
│  └─ *.gif* <texto>
│     └ _Busca un GIF animado._
│
├─⬣「 *JUEGOS* 🎮 」
│  │
│  ├─ *.juegos*
│  │  └ _Muestra el menú de juegos._
│  │
│  ├─ *.adivina* | *.ahorcado*
│  │
│  └─ *.slot* | *.ppt* | *.trivia*
│
├─⬣「 *GRUPOS* 🛡️ 」
│  │
│  ├─ *.kick* <@usuario>
│  │  └ _Elimina a un miembro._
│  │
│  └─ *.inactivos* [días]
│     └ _Muestra inactivos del grupo._
│
├─⬣「 *BOT ADMIN* ⚙️ 」
│  │
│  ├─ *.reload* | *.updateplugins*
│  │  └ _Recarga los plugins del bot._
│  │
│  └─ *.cmd* <on|off> <comando>
│     └ _Activa/desactiva comandos._
│
│  💡 _Usa .help <comando> para más detalles._
│
╰─⬣「 Creado por *Nicolas_sanilo* 」⬣─╯
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
