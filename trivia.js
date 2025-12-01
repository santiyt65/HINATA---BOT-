// Shim de compatibilidad para la ubicación antigua de trivia.js
// Re-exporta el módulo desde `./plugins/trivia.js` para evitar errores de importación
export { command, run } from './plugins/trivia.js';
