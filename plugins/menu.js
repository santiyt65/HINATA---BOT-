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
│  │  └ _Descarga música en múltiples formatos._
│  │  └ _Formatos: MP3, WAV, OGG, OPUS, M4A_
│  │  └ _Plataformas: YouTube, SoundCloud, TikTok_
│  │
│  ├─ *.sticker*
│  │  └ _Crea un sticker de imagen/video._
│  │  └ _Responde a una imagen o video._
│  │
│  └─ *.gif* <texto>
│     └ _Busca y envía un GIF animado._
│
├─⬣「 *ACCIONES ANIME* 🎭 」
│  │
│  ├─ *Agresivas:* 👊
│  │  • *.pegar* / *.slap* @usuario
│  │  • *.patada* / *.kick* @usuario
│  │  • *.morder* / *.bite* @usuario
│  │
│  ├─ *Cariñosas:* 💕
│  │  • *.abrazar* / *.hug* @usuario
│  │  • *.besar* / *.kiss* @usuario
│  │  • *.acariciar* / *.pat* @usuario
│  │  • *.alimentar* / *.feed* @usuario
│  │
│  ├─ *Interactivas:* 🎪
│  │  • *.picar* / *.poke* @usuario
│  │  • *.cosquillas* / *.tickle* @usuario
│  │  • *.saludar* / *.wave* @usuario
│  │  • *.bailar* / *.dance* @usuario
│  │
│  └─ *Emocionales:* 😊
│     • *.llorar* / *.cry*
│     • *.reir* / *.laugh*
│     • *.sonrojar* / *.blush*
│     • *.dormir* / *.sleep*
│
├─⬣「 *JUEGOS* 🎮 」
│  │
│  ├─ *.juegos*
│  │  └ _Menú completo de juegos._
│  │
│  ├─ *.adivina*
│  │  └ _Adivina el número._
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
│  ├─ *.payasos* [cantidad]
│  │  └ _Lista de payasos del grupo 🤡_
│  │
│  ├─ *.femboys* [cantidad]
│  │  └ _Lista de femboys del grupo 💅_
│  │
│  └─ *.tomboys* [cantidad]
│     └ _Lista de tomboys del grupo 🏀_
│
├─⬣「 *ECONOMÍA* 💰 」
│  │
│  ├─ *.saldo*
│  │  └ _Consulta tu saldo de puntos._
│  │
│  ├─ *.depositar* <cantidad>
│  │  └ _Deposita puntos en tu banco._
│  │
│  ├─ *.retirar* <cantidad>
│  │  └ _Retira puntos de tu banco._
│  │
│  ├─ *.apostar* <cantidad>
│  │  └ _Apuesta tus puntos._
│  │
│  ├─ *.mision* | *.misiondiaria*
│  │  └ _Obtén tu misión diaria._
│  │  └ _Gana entre 50-300 puntos._
│  │
│  ├─ *.completarmision*
│  │  └ _Completa tu misión y cobra._
│  │
│  ├─ *.robar* @usuario
│  │  └ _Intenta robar saldo a otro usuario._
│  │  └ _50% éxito, 50% fallo con multa._
│  │  └ _Cooldown: 2 horas._
│  │
│  └─ *.ranking* | *.top* [número]
│     └ _Ranking de saldos del grupo._
│     └ _Ver quién tiene más puntos._
│
├─⬣「 *GRUPOS* 🛡️ 」
│  │
│  ├─ *.kick* @usuario
│  │  └ _Expulsa a un miembro._
│  │  └ _(Solo admins)_
│  │
│  ├─ *.inactivos* [días]
│  │  └ _Lista de miembros inactivos._
│  │  └ _Predeterminado: 7 días._
│  │
│  ├─ *.ban* @usuario
│  │  └ _Banea del bot._
│  │  └ _(Solo propietario)_
│  │
│  └─ *.unban* @usuario
│     └ _Desbanea del bot._
│     └ _(Solo propietario)_
│
├─⬣「 *INFORMACIÓN* ℹ️ 」
│  │
│  ├─ *.menu*
│  │  └ _Muestra este menú._
│  │
│  ├─ *.info*
│  │  └ _Información del bot._
│  │
│  ├─ *.ping*
│  │  └ _Verifica la latencia._
│  │
│  ├─ *.help* [comando]
│  │  └ _Ayuda detallada._
│  │
│  └─ *.creater*
│     └ _Info del creador._
│
├─⬣「 *BOT ADMIN* ⚙️ 」
│  │
│  ├─ *.reload*
│  │  └ _Recarga los plugins._
│  │  └ _(Solo propietario)_
│  │
│  ├─ *.cmd* <on|off> <comando>
│  │  └ _Activa/desactiva comandos._
│  │  └ _(Solo propietario)_
│  │
│  └─ *.setcooldown* <clave> <valor>
│     └ _Configura cooldowns._
│     └ _(Solo propietario)_
│
│  💡 _Usa .help <comando> para más info._
│  🎮 _Total: 50+ comandos disponibles_
│  🌟 _Actualizado con nuevas funciones_
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
