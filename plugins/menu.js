import fs from 'fs';

export const command = '.menu';

export async function run(sock, m) {
  const chatId = (m && m.key && m.key.remoteJid) ? m.key.remoteJid : (m.chat || m.from || '');

  const menu = `
╭─⬣「 *HINATA-BOT* 」⬣─╮
│
│  ¡Hola! 👋
│  Soy Hinata, tu asistente virtual.
│  Aquí tienes mi lista de comandos:
│
├─⬣「 *BÚSQUEDAS* 🔍 」
│  │
│  ├─ *.google* <texto>
│  │  └ _Busca información en Google._
│  │
│  ├─ *.anime* <nombre>
│  │  └ _Busca información de un anime._
│  │
│  ├─ *.pinterest* <texto>
│  │  └ _Busca imágenes en Pinterest._
│  │
│  └─ *.papel* <texto>
│     └ _Busca fondos de pantalla._
│
├─⬣「 *MULTIMEDIA* 🎵🖼️ 」
│  │
│  ├─ *.musica* <canción/URL> [formato]
│  │  └ _Descarga música en MP3, WAV, OGG, etc._
│  │  └ _Soporta YouTube, SoundCloud, TikTok, etc._
│  │
│  ├─ *.sticker*
│  │  └ _Crea un sticker de imagen/video._
│  │  └ _Responde a una imagen o video._
│  │
│  └─ *.gif* <texto>
│     └ _Busca y envía un GIF animado._
│
├─⬣「 *JUEGOS* 🎮 」
│  │
│  ├─ *.juegos*
│  │  └ _Muestra el menú completo de juegos._
│  │
│  ├─ *.adivina*
│  │  └ _Juego de adivinar el número._
│  │
│  ├─ *.ahorcado*
│  │  └ _Juego del ahorcado._
│  │
│  ├─ *.trivia*
│  │  └ _Preguntas de trivia._
│  │
│  ├─ *.slot*
│  │  └ _Máquina tragamonedas._
│  │
│  ├─ *.ppt* <piedra|papel|tijera>
│  │  └ _Piedra, papel o tijera._
│  │
│  ├─ *.piedra* | *.papel* | *.tijera*
│  │  └ _Atajos para PPT._
│  │
│  ├─ *.payasos* [cantidad]
│  │  └ _Lista aleatoria de payasos del grupo 🤡_
│  │
│  ├─ *.femboys* [cantidad]
│  │  └ _Lista aleatoria de femboys del grupo 💅_
│  │
│  └─ *.tomboys* [cantidad]
│     └ _Lista aleatoria de tomboys del grupo 🏀_
│
├─⬣「 *ECONOMÍA* 💰 」
│  │
│  ├─ *.saldo*
│  │  └ _Consulta tu saldo de puntos._
│  │
│  ├─ *.apostar* <cantidad>
│  │  └ _Apuesta tus puntos._
│  │
│  ├─ *.mision* | *.misiondiaria*
│  │  └ _Obtén tu misión diaria._
│  │
│  ├─ *.completarmision*
│  │  └ _Completa tu misión y gana saldo._
│  │
│  └─ *.ranking* | *.top* | *.leaderboard* [número]
│     └ _Ranking de saldos del grupo._
│
├─⬣「 *GRUPOS* 🛡️ 」
│  │
│  ├─ *.kick* <@usuario>
│  │  └ _Elimina a un miembro del grupo._
│  │  └ _(Solo admins)_
│  │
│  └─ *.inactivos* [días]
│     └ _Muestra miembros inactivos._
│     └ _Por defecto: 7 días._
│
├─⬣「 *INFORMACIÓN* ℹ️ 」
│  │
│  ├─ *.info*
│  │  └ _Información del bot._
│  │
│  ├─ *.ping*
│  │  └ _Verifica la latencia del bot._
│  │
│  ├─ *.help* [comando]
│  │  └ _Ayuda detallada de comandos._
│  │
│  └─ *.creater*
│     └ _Información del creador._
│
├─⬣「 *BOT ADMIN* ⚙️ 」
│  │
│  ├─ *.reload* | *.updateplugins*
│  │  └ _Recarga los plugins del bot._
│  │  └ _(Solo propietario)_
│  │
│  ├─ *.cmd* <on|off> <comando>
│  │  └ _Activa/desactiva comandos._
│  │  └ _(Solo propietario)_
│  │
│  └─ *.setcooldown* <clave> <valor>
│     └ _Configura tiempos de espera._
│     └ _(Solo propietario)_
│
│  💡 _Usa .help <comando> para más detalles._
│  📊 _Total de comandos disponibles: 30+_
│
╰─⬣「 Creado por *santiyt65* 」⬣─╯
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
