let handler = async (m, { conn, args }) => {
  let url = args[0]
  // Verifica si se proporciona una URL
  if (!url) return m.reply('❌ URL no válida.')

  try {
    // Intenta enviar la imagen desde la URL proporcionada
    await conn.sendFile(m.chat, url, 'imagen.jpg', '', m)
  // Captura cualquier error que pueda ocurrir al enviar la imagen
  } catch (e) {
    m.reply('⚠️ No se pudo enviar la imagen.')
  }
}

handler.command = /^ver$/i
handler.tags = ['imagen']
handler.help = ['ver <url>']

export default handler
