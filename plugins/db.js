/**
 * @file Configuración de la base de datos SQLite
 * @version 1.0.0
 */

import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

let dbInstance = null;

/**
 * Inicializa la conexión a la base de datos SQLite
 */
export async function initDB() {
    if (dbInstance) {
        return dbInstance;
    }

    try {
        dbInstance = await open({
            filename: './hinata_bot.db',
            driver: sqlite3.Database
        });

        // Crear tablas si no existen
        await dbInstance.exec(`
            CREATE TABLE IF NOT EXISTS usuarios (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                chatId TEXT UNIQUE NOT NULL,
                saldo INTEGER DEFAULT 100,
                banco INTEGER DEFAULT 0,
                banned INTEGER DEFAULT 0,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS adivina (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                chatId TEXT NOT NULL,
                numeroSecreto INTEGER NOT NULL,
                intentos INTEGER DEFAULT 0,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS ahorcado (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                chatId TEXT NOT NULL,
                palabra TEXT NOT NULL,
                letrasAdivinadas TEXT DEFAULT '',
                intentos INTEGER DEFAULT 0,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS command_blacklist (
                chatId TEXT NOT NULL,
                command TEXT NOT NULL,
                PRIMARY KEY (chatId, command)
            );

            CREATE TABLE IF NOT EXISTS group_activity (
                chatId TEXT NOT NULL,
                userId TEXT NOT NULL,
                lastSeen DATETIME DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (chatId, userId)
            );
        `);

        console.log('✅ Base de datos inicializada correctamente.');
        return dbInstance;
    } catch (error) {
        console.error('❌ Error al inicializar la base de datos:', error);
        process.exit(1);
    }
}

/**
 * Obtiene la instancia de la base de datos
 */
export async function getDB() {
    if (!dbInstance) {
        return await initDB();
    }
    return dbInstance;
}

// Exportar instancia para compatibilidad con el código existente
export const db = {
    async run(sql, params = []) {
        const database = await getDB();
        return database.run(sql, params);
    },
    async get(sql, params = []) {
        const database = await getDB();
        return database.get(sql, params);
    },
    async all(sql, params = []) {
        const database = await getDB();
        return database.all(sql, params);
    }
};
