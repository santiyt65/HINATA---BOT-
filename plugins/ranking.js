/**
 * @file Plugin Ranking - Muestra el ranking de saldos del grupo
 * @version 1.0.0
 */

import { db } from './db.js';

export const command = ['.ranking', '.top', '.leaderboard'];

export const help = `
Muestra el ranking de saldos de los miembros del grupo 💰

*Uso:*
  \`.ranking\` - Muestra el top 10 del grupo
  \`.ranking [número]\` - Muestra el top N (máx. 50)
  \`.top\` - Alias de .ranking
  \`.leaderboard\` - Alias de .ranking

*Ejemplos:*
  - \`.ranking\` - Top 10
  - \`.ranking 20\` - Top 20
  - \`.top 5\` - Top 5

*Nota:* Solo muestra miembros del grupo actual con saldo registrado.
`;

export async function run(sock, m, { text }) {
  const chatId = m.key.remoteJid;

  // Verificar que sea un grupo
  if (!chatId.endsWith('@g.us')) {
    return await sock.sendMessage(chatId, { 
      text: '❌ Este comando solo funciona en grupos.' 
    }, { quoted: m });
  }

  try {
    // Determinar cuántos usuarios mostrar
    let limite = 10;
    if (text && text.trim()) {
      const num = parseInt(text.trim());
      if (!isNaN(num) && num > 0) {
        limite = Math.min(num, 50); // Máximo 50
      }
    }

    // Obtener metadata del grupo
    const groupMetadata = await sock.groupMetadata(chatId);
    const participants = groupMetadata.participants;
    const participantIds = participants.map(p => p.id);

    // Obtener todos los usuarios con saldo
    const usuarios = await db.all(
      'SELECT chatId, saldo FROM usuarios WHERE saldo > 0 ORDER BY saldo DESC'
    );

    if (!usuarios || usuarios.length === 0) {
      return await sock.sendMessage(chatId, { 
        text: '📊 *RANKING DE SALDOS*\n\n❌ Aún no hay usuarios con saldo registrado en este grupo.\n\n💡 Usa `.mision` para empezar a ganar puntos.' 
      }, { quoted: m });
    }

    // Filtrar solo usuarios del grupo actual
    const usuariosDelGrupo = usuarios.filter(u => participantIds.includes(u.chatId));

    if (usuariosDelGrupo.length === 0) {
      return await sock.sendMessage(chatId, { 
        text: '📊 *RANKING DE SALDOS*\n\n❌ Ningún miembro de este grupo tiene saldo registrado aún.\n\n💡 Usa `.mision` para empezar a ganar puntos.' 
      }, { quoted: m });
    }

    // Limitar al número solicitado
    const topUsuarios = usuariosDelGrupo.slice(0, limite);

    // Construir mensaje del ranking
    let mensaje = `📊 *RANKING DE SALDOS DEL GRUPO* 📊\n\n`;
    mensaje += `💰 *Top ${Math.min(limite, usuariosDelGrupo.length)} Miembros más ricos:*\n\n`;

    const medallas = ['🥇', '🥈', '🥉'];
    const emojis = ['💎', '💰', '🪙', '💵', '💴', '💶', '💷', '🤑', '💸', '🏆'];

    topUsuarios.forEach((usuario, index) => {
      const posicion = index + 1;
      const nombre = usuario.chatId.split('@')[0];
      const saldo = usuario.saldo;
      
      // Medalla para top 3
      let icono = '';
      if (posicion <= 3) {
        icono = medallas[posicion - 1];
      } else {
        icono = emojis[index % emojis.length];
      }
      
      // Formato especial para top 3
      if (posicion <= 3) {
        mensaje += `${icono} *${posicion}.* @${nombre}\n`;
        mensaje += `   └ 💰 *${saldo.toLocaleString()} puntos*\n\n`;
      } else {
        mensaje += `${icono} *${posicion}.* @${nombre} - ${saldo.toLocaleString()} pts\n`;
      }
    });

    // Estadísticas adicionales
    const totalSaldo = usuariosDelGrupo.reduce((sum, u) => sum + u.saldo, 0);
    const promedioSaldo = Math.round(totalSaldo / usuariosDelGrupo.length);

    mensaje += `\n📈 *Estadísticas del grupo:*\n`;
    mensaje += `👥 Total de usuarios: ${usuariosDelGrupo.length}\n`;
    mensaje += `💰 Saldo total: ${totalSaldo.toLocaleString()} puntos\n`;
    mensaje += `📊 Promedio: ${promedioSaldo.toLocaleString()} puntos\n\n`;
    mensaje += `💡 _Usa .mision para ganar más puntos_`;

    // Enviar mensaje mencionando a los usuarios del top
    const mentions = topUsuarios.map(u => u.chatId);

    await sock.sendMessage(chatId, { 
      text: mensaje,
      mentions: mentions
    }, { quoted: m });

  } catch (err) {
    console.error('Error en comando ranking:', err);
    await sock.sendMessage(chatId, { 
      text: '❌ Ocurrió un error al obtener el ranking. Intenta nuevamente.' 
    }, { quoted: m });
  }
}