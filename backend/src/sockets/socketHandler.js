// backend/src/sockets/socketHandler.js

import { Server } from 'socket.io';

/**
 * Manejador de eventos WebSocket con Socket.io
 * Gestiona eventos en tiempo real para voluntariados
 */

let io; 

/**
 * Inicializa Socket.io con el servidor HTTP
 * @param {Object} server - Servidor HTTP de Express
 */
export function initializeSocket(server) {
    io = new Server(server, {
        cors: {
            origin: '*', // En producción, especificar dominio exacto
            methods: ['GET', 'POST']
        }
    });
    
    io.on('connection', (socket) => {
        console.log('[Socket.io] Cliente conectado:', socket.id);
        
        // Evento: Cliente se une a una sala
        socket.on('join', (data) => {
            console.log('[Socket.io] Cliente se unió:', data);
            socket.emit('welcome', { 
                mensaje: 'Conectado al servidor de voluntariados',
                socketId: socket.id
            });
        });
        
        // Evento: Desconexión
        socket.on('disconnect', () => {
            console.log('[Socket.io] Cliente desconectado:', socket.id);
        });
    });
    
    console.log('[Socket.io] ✅ Servidor WebSocket iniciado');
    return io;
}

/**
 * Emite evento cuando se crea un nuevo voluntariado
 * @param {Object} voluntariado - Datos del voluntariado creado
 */
export function emitirVoluntariadoCreado(voluntariado) {
    if (io) {
        console.log('[Socket.io] Emitiendo: voluntariado_creado ->', voluntariado.titulo);
        io.emit('voluntariado_creado', voluntariado);
    }
}

/**
 * Emite evento cuando se actualiza un voluntariado
 * @param {Object} voluntariado - Datos del voluntariado actualizado
 */
export function emitirVoluntariadoActualizado(voluntariado) {
    if (io) {
        console.log('[Socket.io] Emitiendo: voluntariado_actualizado ->', voluntariado.titulo);
        io.emit('voluntariado_actualizado', voluntariado);
    }
}

/**
 * Emite evento cuando se elimina un voluntariado
 * @param {Number} id - ID del voluntariado eliminado
 */
export function emitirVoluntariadoEliminado(id) {
    if (io) {
        console.log('[Socket.io] Emitiendo: voluntariado_eliminado ->', id);
        io.emit('voluntariado_eliminado', { id });
    }
}

/**
 * Obtiene la instancia de Socket.io
 * @returns {Object} Instancia de io
 */
export function getIO() {
    if (!io) {
        throw new Error('Socket.io no ha sido inicializado');
    }
    return io;
}