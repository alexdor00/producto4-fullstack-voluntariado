import { MongoClient } from 'mongodb';
// configuracion
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'voluntariadosDB';

// variables globales de conexion
let db = null;
let client = null;
let isConnected = false;

/**
 * conecta a la base de datos mongodb
 * @returns {Promise<Object>} instancia de la base de datos
 */
export async function connectDB() {
    try {
        if (db) {
            console.log('[db] ya conectado a mongodb');
            isConnected = true;
            return db;
        }

        console.log('[db] intentando conectar a mongodb...');
        console.log('[db] uri:', MONGODB_URI.replace(/\/\/.*:.*@/, '//****:****@'));
        
        client = new MongoClient(MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 10000
        });
        
        await client.connect();
        db = client.db(DB_NAME);
        isConnected = true;
        
        console.log('[db] conectado exitosamente a mongodb');
        console.log('[db] base de datos:', DB_NAME);
        
        return db;
        
    } catch (error) {
        console.warn('[db warning] no se pudo conectar a mongodb:', error.message);
        console.warn('[db warning] usando almacenamiento en memoria como respaldo');
        isConnected = false;
        return null;
    }
}

/**
 * obtiene la instancia de la base de datos
 * @returns {Object} instancia de la base de datos
 * @throws {Error} si la bd no esta inicializada
 */
export function getDB() {
    if (!isConnected) {
        return null;
    }
    return db;
}

/**
 * verifica si mongodb esta conectado
 * @returns {Boolean} true si esta conectado
 */
export function isMongoConnected() {
    return isConnected;
}

/**
 * cierra la conexion a la base de datos
 */
export async function closeDB() {
    if (client) {
        await client.close();
        db = null;
        client = null;
        isConnected = false;
        console.log('[db] conexion cerrada');
    }
}