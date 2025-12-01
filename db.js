// Shim de compatibilidad para la ubicación antigua de db.js
// Re-exporta el módulo desde `./plugins/db.js` para evitar errores de importación
export { initDB, getDB, db } from './plugins/db.js';
