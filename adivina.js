
async function iniciarJuego(sock, chatId) {
    const numeroSecreto = Math.floor(Math.random() * 100) + 1;
    try {
      await db.run('INSERT INTO adivina (chatId, numeroSecreto, intentos) VALUES (?, ?, ?)', [chatId, numeroSecreto, 0]);
      return { numeroSecreto: numeroSecreto, intentos: 0 };
    } catch (error) {
      console.error('Error al insertar en la base de datos:', error);
      await sock.sendMessage(chatId, { text: 'Hubo un error al iniciar el juego.' }, { quoted: m });
      return null;
    }
}

async function adivinarNumero(sock, chatId, intento, juego) {
    if (isNaN(intento)) {
        return await sock.sendMessage(chatId, { text: 'Por favor, ingresa un número válido.' }, { quoted: m });
    }

    if (intento === juego.numeroSecreto) {
        await sock.sendMessage(chatId, { text: `¡Felicidades! Adivinaste el número ${juego.numeroSecreto} en ${juego.intentos} intentos.` }, { quoted: m });
        await db.run('DELETE FROM adivina WHERE chatId = ?', chatId);
        delete juegoActivo[chatId];
    } else if (intento < juego.numeroSecreto) {
        juego.intentos++;
        await db.run('UPDATE adivina SET intentos = ? WHERE chatId = ?', [juego.intentos, chatId]);
        await sock.sendMessage(chatId, { text: 'El número es más alto. Intenta de nuevo.' }, { quoted: m });
    } else {
        juego.intentos++;
        await db.run('UPDATE adivina SET intentos = ? WHERE chatId = ?', [juego.intentos, chatId]);
        await sock.sendMessage(chatId, { text: 'El número es más bajo. Intenta de nuevo.' }, { quoted: m });
    }
}

export const command = '.adivina';

