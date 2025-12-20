// src/data/dataStore.js

/**
 * Almacenamiento temporal en memoria para usuarios y voluntariados
 * Simula una base de datos pero los datos se pierden al reiniciar el servidor
 */

// Base de datos en memoria - Usuarios iniciales
let usuarios = [
    {
        id: 1,
        nombre: 'LAURA',
        email: 'L@A.U',
        password: '123',
        rol: 'admin'
    },
    {
        id: 2,
        nombre: 'MARCOS',
        email: 'M@R.C',
        password: '123',
        rol: 'usuario'
    },
    {
        id: 3,
        nombre: 'SONIA',
        email: 'S@O.N',
        password: '123',
        rol: 'usuario'
    }
];

// Base de datos en memoria - Voluntariados iniciales
let voluntariados = [
    {
        id: 1,
        titulo: 'OFREZCO MEDICINA',
        email: 'L@A.U',
        fecha: '2025-10-24',
        descripcion: 'SUPLEMENTOS VITAMINICOS PARA ANIMALES ENFERMOS',
        tipo: 'Oferta'
    },
    {
        id: 2,
        titulo: 'NECESITO REFUGIO',
        email: 'M@R.C',
        fecha: '2025-10-27',
        descripcion: 'SE DAN EN ADOPCION 4 GATITOS',
        tipo: 'Petición'
    },
    {
        id: 3,
        titulo: 'NECESITO VEHICULO',
        email: 'S@O.N',
        fecha: '2025-10-28',
        descripcion: 'NECESITO UN VEHICULO PARA TRASLADAR UN CABALLO',
        tipo: 'Petición'
    }
];

// Contadores para IDs autoincrementales
let nextUsuarioId = 4;
let nextVoluntariadoId = 4;

/**
 * Objeto exportado con acceso a las estructuras de datos
 */
export const db = {
    usuarios,
    voluntariados,
    nextUsuarioId: () => nextUsuarioId++,
    nextVoluntariadoId: () => nextVoluntariadoId++
};