export const command = '.pinterest';

export const run = async (sock, m) => {
  const text = m.message.conversation?.split(' ').slice(1).join(' ') || '';
  if (!text) {
    await sock.sendMessage(m.key.remoteJid, {
      text: '❌ Tenés que escribir un término de búsqueda. Ejemplo: *.pinterest Goku*'
    }, { quoted: m });
    return;
  }

  // Enviar mensaje de espera
  await sock.sendMessage(m.key.remoteJid, {
    text: `🔄 Buscando imágenes de *${text}*...`,
  }, { quoted: m });

  try {
    // Buscar imágenes usando API no oficial
    const res = await fetch(`https://pinterest-downloader-download.onrender.com/api/pin?q=${encodeURIComponent(text)}`);
    const data = await res.json();

    if (!data || !data.result || data.result.length === 0) {
      throw new Error('No se encontraron imágenes.');
    }

    // Mostrar resultados como botones
    const images = data.result.slice(0, 5); // máximo 5 resultados
    const sections = [{
      title: 'Resultados encontrados',
      rows: images.map((img, i) => ({
        title: `Imagen ${i + 1}`,
        description: 'Tocá para ver esta imagen',
        rowId: `.verpin ${img}`
      }))
    }];

    await sock.sendMessage(m.key.remoteJid, {
      text: `🔎 Resultados para: *${text}*`,
      footer: 'Seleccioná una imagen',
      title: 'Pinterest',
      buttonText: 'Ver imágenes',
      sections
    }, { quoted: m });

  } catch (err) {
    console.error('Error en .pinterest:', err);
    await sock.sendMessage(m.key.remoteJid, {
      text: '❌ No se pudieron obtener imágenes. Intentá más tarde.'
    }, { quoted: m });
  }
};
