// backend/src/config/database.js

import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/voluntariadosDB';

let isConnected = false;

/**
 * Conecta a MongoDB usando Mongoose
 * @returns {Promise<boolean>} true si conecta exitosamente
 */
export async function connectDB() {
    try {
        if (isConnected) {
            console.log('[mongoose] Ya conectado a MongoDB');
            return true;
        }

        console.log('[mongoose] Conectando a MongoDB...');
        console.log('[mongoose] URI:', MONGODB_URI.replace(/\/\/.*:.*@/, '//****:****@'));
        
        await mongoose.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        
        isConnected = true;
        
        console.log('[mongoose] ✅ Conectado exitosamente a MongoDB');
        console.log('[mongoose] Base de datos:', mongoose.connection.name);
        
        // Eventos de mongoose
        mongoose.connection.on('error', (err) => {
            console.error('[mongoose] Error de conexión:', err);
        });
        
        mongoose.connection.on('disconnected', () => {
            console.warn('[mongoose] Desconectado de MongoDB');
            isConnected = false;
        });
        
        return true;
        
    } catch (error) {
        console.error('[mongoose] ❌ Error al conectar:', error.message);
        isConnected = false;
        return false;
    }
}

/**
 * Verifica si Mongoose está conectado
 * @returns {boolean}
 */
export function isMongoConnected() {
    return isConnected && mongoose.connection.readyState === 1;
}

/**
 * Cierra la conexión de Mongoose
 */
export async function closeDB() {
    if (isConnected) {
        await mongoose.connection.close();
        isConnected = false;
        console.log('[mongoose] Conexión cerrada');
    }
}

// Exportación para compatibilidad (ya no se usa pero por si acaso)
export function getDB() {
    if (!isConnected) {
        return null;
    }
    return mongoose.connection.db;
}