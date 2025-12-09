/**
 * @file Comando para reclamar waifus
 * @version 1.0.0
 */

import { db } from './db.js';
import fs from 'fs/promises';

// Cargar personajes desde el archivo JSON
let characters = [];
async function loadCharacters() {
  try {
    const data = await fs.readFile('./characters.json', 'utf8');
    characters = JSON.parse(data);
  } catch (error) {
    console.error('Error al cargar characters.json:', error);
  }
}
loadCharacters();


export const command = ['.claim', '.waifus', '.mywaifus'];
export const description = 'Reclama, lista o mira tus personajes de anime.';

/**
 * @param {import('@whiskeysockets/baileys').WASocket}
 * @param {import('@whiskeysockets/baileys').WAMessage}
 * @param {object}
 * @param {string} context.text - El texto del mensaje
 * @param {string} context.command - El comando invocado
 */
export async function run(sock, m, { text, command }) {
  const userId = m.key.participant || m.key.remoteJid;
  const args = text.split(' ');

  try {
    switch (command) {
      case '.waifus':
        await listWaifus(sock, m);
        break;
      case '.claim':
        await claimWaifu(sock, m, userId, text);
        break;
      case '.mywaifus':
        await showMyWaifus(sock, m, userId);
        break;
    }
  } catch (error) {
    console.error(`Error en el comando ${command}:`, error);
    await sock.sendMessage(m.key.remoteJid, { text: 'Ocurrió un error al procesar tu solicitud.' }, { quoted: m });
  }
}

async function listWaifus(sock, m) {
  // Lógica para listar todos los personajes
  const claimed = await db.all('SELECT character_id, user_id FROM claimed_characters');
  const claimedIds = claimed.map(c => c.character_id);
  const claimedMap = Object.fromEntries(claimed.map(c => [c.character_id, c.user_id]));

  let list = '🌟 *LISTA DE PERSONAJES DISPONIBLES* 🌟\n\n';
  for (const char of characters) {
    const isClaimed = claimedIds.includes(char.id);
    const status = isClaimed ? `❌ (Reclamado por @${claimedMap[char.id].split('@')[0]})` : '✅';
    list += `*${char.name}* (${char.anime})\n`;
    list += `*Valor:* ${char.price.toLocaleString()} 💎\n`;
    list += `*Estado:* ${status}\n\n`;
  }
  
  list += 'Usa `.claim <nombre>` para reclamar un personaje.';
  
  await sock.sendMessage(m.key.remoteJid, { text: list, mentions: Object.values(claimedMap) }, { quoted: m });
}

async function claimWaifu(sock, m, userId, characterName) {
  if (!characterName) {
    return await sock.sendMessage(m.key.remoteJid, { text: 'Debes especificar el nombre del personaje que quieres reclamar. Ejemplo: `.claim Hinata Hyuga`' }, { quoted: m });
  }

  const character = characters.find(c => c.name.toLowerCase() === characterName.toLowerCase());

  if (!character) {
    return await sock.sendMessage(m.key.remoteJid, { text: `El personaje "${characterName}" no existe en la lista.` }, { quoted: m });
  }

  const isClaimed = await db.get('SELECT * FROM claimed_characters WHERE character_id = ?', [character.id]);
  if (isClaimed) {
    const ownerId = isClaimed.user_id;
    return await sock.sendMessage(m.key.remoteJid, { text: `❌ Lo siento, *${character.name}* ya ha sido reclamada por @${ownerId.split('@')[0]}.`, mentions: [ownerId] }, { quoted: m });
  }

  let user = await db.get('SELECT saldo FROM usuarios WHERE chatId = ?', [userId]);
  if (!user) {
    await db.run('INSERT INTO usuarios (chatId, saldo) VALUES (?, ?)', [userId, 100]);
    user = { saldo: 100 };
  }

  if (user.saldo < character.price) {
    return await sock.sendMessage(m.key.remoteJid, { text: `No tienes suficientes 💎 para reclamar a *${character.name}*. Necesitas ${character.price.toLocaleString()} 💎 y solo tienes ${user.saldo.toLocaleString()} 💎.` }, { quoted: m });
  }

  const newBalance = user.saldo - character.price;
  await db.run('UPDATE usuarios SET saldo = ? WHERE chatId = ?', [newBalance, userId]);
  await db.run('INSERT INTO claimed_characters (character_id, user_id) VALUES (?, ?)', [character.id, userId]);

  const caption = `¡Felicidades, @${userId.split('@')[0]}! 🎉\n\nHas reclamado a *${character.name}* de *${character.anime}* por ${character.price.toLocaleString()} 💎.\n\nTu nuevo saldo es ${newBalance.toLocaleString()} 💎.`;
  
  await sock.sendMessage(m.key.remoteJid, { 
    image: { url: character.image_url },
    caption: caption,
    mentions: [userId]
  }, { quoted: m });
}

async function showMyWaifus(sock, m, userId) {
  const claimed = await db.all('SELECT character_id FROM claimed_characters WHERE user_id = ?', [userId]);
  
  if (claimed.length === 0) {
    return await sock.sendMessage(m.key.remoteJid, { text: 'Aún no has reclamado ningún personaje. Usa `.waifus` para ver la lista y `.claim <nombre>` para obtener uno.' }, { quoted: m });
  }
  
  const claimedIds = claimed.map(c => c.character_id);
  const myCharacters = characters.filter(c => claimedIds.includes(c.id));

  let totalValue = 0;
  let list = `💖 *TU COLECCIÓN DE PERSONAJES* (@${userId.split('@')[0]}) 💖\n\n`;
  for (const char of myCharacters) {
    list += `*${char.name}* (${char.anime})\n*Valor:* ${char.price.toLocaleString()} 💎\n\n`;
    totalValue += char.price;
  }

  list += `*Valor total de tu colección:* ${totalValue.toLocaleString()} 💎`;
  
  await sock.sendMessage(m.key.remoteJid, { text: list, mentions: [userId] }, { quoted: m });
}
