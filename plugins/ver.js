let handler = async (m, { conn, args }) => {
  let url = args[0]
  if (!url) return m.reply('❌ URL no válida.')

  try {
    await conn.sendFile(m.chat, url, 'imagen.jpg', '', m)
  } catch (e) {
    m.reply('⚠️ No se pudo enviar la imagen.')
  }
}

handler.command = /^ver$/i
handler.tags = ['imagen']
handler.help = ['ver <url>']

export default handler
