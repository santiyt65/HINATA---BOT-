import fs from 'fs/promises';
import { obtenerConfig } from '../lib/functions.js';

export const command = '.setcooldown';

function isAuthorized(userId, cfg) {
  const ownerId = (cfg && cfg.ownerJid) ? String(cfg.ownerJid).trim() : (cfg && cfg.propietario ? String(cfg.propietario).trim() : '');
  if (!ownerId) return false;
  if (ownerId.includes('@')) return userId === ownerId;
  return userId === ownerId || userId.includes(ownerId) || userId.startsWith(ownerId);
}

export async function run(sock, m, { text, args }) {
  const chatId = m.key.remoteJid;
  const userId = m.key.participant || m.key.remoteJid;

  let cfg;
  try {
    cfg = obtenerConfig();
  } catch (e) {
    return await sock.sendMessage(chatId, { text: '⚠️ No se pudo leer la configuración.' }, { quoted: m });
  }

  if (!isAuthorized(userId, cfg)) {
    return await sock.sendMessage(chatId, { text: '❌ No tienes permisos para usar este comando. Solo el propietario puede cambiar los cooldowns.' }, { quoted: m });
  }

  if (!text || !text.trim()) {
    const current = (cfg.cooldowns) ? cfg.cooldowns : {};
    return await sock.sendMessage(chatId, { text: `⚙️ Current cooldowns:\nperUser: ${current.perUser || '-'}s\ngroupBurstLimit: ${current.groupBurstLimit || '-'}\ngroupBurstSeconds: ${current.groupBurstSeconds || '-'}\n\nUso: .setcooldown <clave> <valor>\nClaves: perUser, groupBurstLimit, groupBurstSeconds` }, { quoted: m });
  }

  const parts = text.trim().split(/ +/);
  const key = parts[0];
  const value = parts[1];

  if (!['perUser','groupBurstLimit','groupBurstSeconds'].includes(key)) {
    return await sock.sendMessage(chatId, { text: '❌ Clave inválida. Usa una de: perUser, groupBurstLimit, groupBurstSeconds' }, { quoted: m });
  }
  if (!value || isNaN(Number(value))) {
    return await sock.sendMessage(chatId, { text: '❌ Valor inválido. Debe ser un número.' }, { quoted: m });
  }

  // Update config
  try {
    const filePath = './config/config.json';
    const diskCfg = await fs.readFile(filePath, 'utf8');
    const json = JSON.parse(diskCfg);
    if (!json.cooldowns) json.cooldowns = {};
    json.cooldowns[key] = Number(value);
    await fs.writeFile(filePath, JSON.stringify(json, null, 2), 'utf8');

    await sock.sendMessage(chatId, { text: `✅ Config actualizada: ${key} = ${value}` }, { quoted: m });
    // Note: index.js reloads config per message so change applies inmediatamente
  } catch (err) {
    console.error('Error al actualizar config:', err);
    await sock.sendMessage(chatId, { text: '❌ Error al guardar la configuración.' }, { quoted: m });
  }
}
