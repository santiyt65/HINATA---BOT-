import fetch from 'node-fetch'

let handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) {
    return m.reply(`📌 Uso correcto: *${usedPrefix + command} <texto>*\nEjemplo: *.duck goku*`)
  }

  try {
    // Mostrar mensaje de carga
    await m.reply('🔎 Buscando imágenes...')

    // Consultar a la API de Popcat
    let res = await fetch(`https://api.popcat.xyz/imagesearch?query=${encodeURIComponent(text)}`)
    let json = await res.json()

    if (!json || json.length === 0) {
      return m.reply('❌ No encontré resultados.')
    }

    // Armar los botones con las miniaturas
    const sections = [{
      title: `🌆 Resultados para: ${text}`,
      rows: json.slice(0, 10).map((img, index) => ({
        title: `🔹 Imagen ${index + 1}`,
        description: img,
        rowId: `.ver ${img}`
      }))
    }]

    // Enviar como lista con botones
    await conn.sendList(m.chat, `✨ Resultados encontrados`, `Haz clic para ver la imagen`, `Imágenes`, sections, m)

  } catch (e) {
    console.error(e)
    m.reply('⚠️ Ocurrió un error al buscar la imagen.')
  }
}

handler.help = ['duck <texto>']
handler.tags = ['buscar', 'imagen']
handler.command = /^duck$/i

export default handler
