import fs from 'fs';

export function obtenerConfig() {
  const raw = fs.readFileSync('./config/config.json');
  return JSON.parse(raw);
}

export function verificarLlave(llaveIngresada) {
  const { llave } = obtenerConfig();
  return llaveIngresada === llave;
}

export function agregarCanal(mensaje) {
  const canal = '\n\n📢 *Únete a nuestro canal oficial de WhatsApp:*\nhttps://whatsapp.com/channel/0029VajKFjlJJhzU8fvTPn2L';
   return mensaje + canal;
}