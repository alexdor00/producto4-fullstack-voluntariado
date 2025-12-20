// src/graphql/resolvers.js

import { getDB, isMongoConnected } from '../config/database.js';
import { ObjectId } from 'mongodb';
import { db as memoryDB } from '../data/dataStore.js';
import { generarToken } from '../utils/jwt.js';

/**
 * resolvers de graphql - implementan la logica de negocio
 * conectan las operaciones definidas en typedefs con mongodb
 */

// helper: usar mongodb o memoria segun disponibilidad
function usarMongoDB() {
    return isMongoConnected() && getDB() !== null;
}

/**
 * verifica que el usuario este autenticado
 * @param {Object} context - contexto de graphql con usuario
 * @param {Boolean} requiereAdmin - si requiere rol de admin
 * @throws {Error} si no esta autenticado o no es admin
 * @returns {Object} usuario autenticado
 */
function verificarAuth(context, requiereAdmin = false) {
    if (!context.usuario) {
        throw new Error('no autenticado. debes iniciar sesion primero');
    }
    
    if (requiereAdmin && context.usuario.rol !== 'admin') {
        throw new Error('acceso denegado. se requiere rol de administrador');
    }
    
    console.log('[graphql auth] usuario verificado:', context.usuario.email, '- rol:', context.usuario.rol);
    return context.usuario;
}

export const resolvers = {
    
    // queries - operaciones de lectura
    Query: {
        
        /**
         * obtiene todos los usuarios del sistema
         * @returns {Array} lista de usuarios
         */
        obtenerUsuarios: async () => {
            console.log('[graphql query] obtener usuarios');
            
            if (usarMongoDB()) {
                const db = getDB();
                const usuarios = await db.collection('usuarios').find().toArray();
                return usuarios.map(u => ({
                    id: u.id,
                    nombre: u.nombre,
                    email: u.email,
                    password: u.password,
                    rol: u.rol
                }));
            } else {
                return memoryDB.usuarios;
            }
        },
        
        /**
         * obtiene un usuario por su email
         * @param {Object} _ - parent (no usado)
         * @param {Object} args - argumentos { email }
         * @returns {Object|null} usuario encontrado o null
         */
        obtenerUsuario: async (_, { email }) => {
            console.log('[graphql query] obtener usuario:', email);
            
            if (usarMongoDB()) {
                const db = getDB();
                const usuario = await db.collection('usuarios').findOne({ email });
                if (usuario) {
                    return {
                        id: usuario.id,
                        nombre: usuario.nombre,
                        email: usuario.email,
                        password: usuario.password,
                        rol: usuario.rol
                    };
                }
                return null;
            } else {
                return memoryDB.usuarios.find(u => u.email === email) || null;
            }
        },
        
        /**
         * obtiene todos los voluntariados
         * @returns {Array} lista de voluntariados
         */
        obtenerVoluntariados: async () => {
            console.log('[graphql query] obtener voluntariados');
            
            if (usarMongoDB()) {
                const db = getDB();
                const voluntariados = await db.collection('voluntariados').find().toArray();
                return voluntariados.map(v => ({
                    id: v.id,
                    titulo: v.titulo,
                    email: v.email,
                    fecha: v.fecha,
                    descripcion: v.descripcion,
                    tipo: v.tipo
                }));
            } else {
                return memoryDB.voluntariados;
            }
        },
        
        /**
         * obtiene un voluntariado por id
         * @param {Object} _ - parent (no usado)
         * @param {Object} args - argumentos { id }
         * @returns {Object|null} voluntariado encontrado o null
         */
        obtenerVoluntariado: async (_, { id }) => {
            console.log('[graphql query] obtener voluntariado:', id);
            
            if (usarMongoDB()) {
                const db = getDB();
                const voluntariado = await db.collection('voluntariados').findOne({ id: parseInt(id) });
                if (voluntariado) {
                    return {
                        id: voluntariado.id,
                        titulo: voluntariado.titulo,
                        email: voluntariado.email,
                        fecha: voluntariado.fecha,
                        descripcion: voluntariado.descripcion,
                        tipo: voluntariado.tipo
                    };
                }
                return null;
            } else {
                return memoryDB.voluntariados.find(v => v.id === id) || null;
            }
        },
        
        /**
         * obtiene voluntariados filtrados por tipo
         * @param {Object} _ - parent (no usado)
         * @param {Object} args - argumentos { tipo }
         * @returns {Array} lista filtrada de voluntariados
         */
        obtenerVoluntariadosPorTipo: async (_, { tipo }) => {
            console.log('[graphql query] obtener por tipo:', tipo);
            
            if (usarMongoDB()) {
                const db = getDB();
                const voluntariados = await db.collection('voluntariados').find({ tipo }).toArray();
                return voluntariados.map(v => ({
                    id: v.id,
                    titulo: v.titulo,
                    email: v.email,
                    fecha: v.fecha,
                    descripcion: v.descripcion,
                    tipo: v.tipo
                }));
            } else {
                return memoryDB.voluntariados.filter(v => v.tipo === tipo);
            }
        }
    },
    
    // mutations - operaciones de escritura
    Mutation: {
        
        /**
         * crea un nuevo usuario
         * @param {Object} _ - parent (no usado)
         * @param {Object} args - datos del usuario { nombre, email, password, rol }
         * @returns {Object} usuario creado
         * @throws {Error} si el email ya existe
         */
        crearUsuario: async (_, { nombre, email, password, rol }) => {
            console.log('[graphql mutation] crear usuario:', email);
            
            if (usarMongoDB()) {
                const db = getDB();
                
                const existe = await db.collection('usuarios').findOne({ email });
                if (existe) {
                    throw new Error('el email ya esta registrado');
                }
                
                const ultimoUsuario = await db.collection('usuarios').find().sort({ id: -1 }).limit(1).toArray();
                const nuevoId = ultimoUsuario.length > 0 ? ultimoUsuario[0].id + 1 : 1;
                
                const nuevoUsuario = {
                    id: nuevoId,
                    nombre,
                    email,
                    password,
                    rol: rol || 'usuario',
                    fechaCreacion: new Date()
                };
                
                await db.collection('usuarios').insertOne(nuevoUsuario);
                
                return {
                    id: nuevoId,
                    nombre,
                    email,
                    password,
                    rol: rol || 'usuario'
                };
            } else {
                const existe = memoryDB.usuarios.find(u => u.email === email);
                if (existe) {
                    throw new Error('el email ya esta registrado');
                }
                
                const nuevoUsuario = {
                    id: memoryDB.nextUsuarioId(),
                    nombre,
                    email,
                    password,
                    rol: rol || 'usuario'
                };
                
                memoryDB.usuarios.push(nuevoUsuario);
                return nuevoUsuario;
            }
        },
        
        /**
         * elimina un usuario por email (requiere rol admin)
         * @param {Object} _ - parent (no usado)
         * @param {Object} args - argumentos { email }
         * @param {Object} context - contexto con usuario autenticado
         * @returns {Object} respuesta con ok y mensaje
         * @throws {Error} si el usuario no existe o no tiene permisos
         */
        borrarUsuario: async (_, { email }, context) => {
            console.log('[graphql mutation] borrar usuario:', email);
            
            // verificar autenticacion y rol admin
            verificarAuth(context, true);
            
            if (usarMongoDB()) {
                const db = getDB();
                const result = await db.collection('usuarios').deleteOne({ email });
                
                if (result.deletedCount === 0) {
                    throw new Error('usuario no encontrado');
                }
                
                return {
                    ok: true,
                    mensaje: 'usuario eliminado correctamente'
                };
            } else {
                const index = memoryDB.usuarios.findIndex(u => u.email === email);
                
                if (index === -1) {
                    throw new Error('usuario no encontrado');
                }
                
                memoryDB.usuarios.splice(index, 1);
                
                return {
                    ok: true,
                    mensaje: 'usuario eliminado correctamente'
                };
            }
        },
        
        /**
         * autentica un usuario (login) y devuelve token jwt
         * @param {Object} _ - parent (no usado)
         * @param {Object} args - credenciales { email, password }
         * @returns {Object} respuesta con ok, mensaje, token y usuario
         */
        loginUsuario: async (_, { email, password }) => {
            console.log('[graphql mutation] login usuario:', email);
            
            if (usarMongoDB()) {
                const db = getDB();
                const usuario = await db.collection('usuarios').findOne({ 
                    email: email
                });
                
                if (!usuario) {
                    return {
                        ok: false,
                        mensaje: 'usuario no encontrado',
                        token: null,
                        usuario: null
                    };
                }
                
                if (usuario.password !== password) {
                    return {
                        ok: false,
                        mensaje: 'contrasena incorrecta',
                        token: null,
                        usuario: null
                    };
                }
                
                // generar token jwt
                const token = generarToken(usuario);
                
                return {
                    ok: true,
                    mensaje: 'login exitoso',
                    token: token,
                    usuario: {
                        id: usuario.id,
                        nombre: usuario.nombre,
                        email: usuario.email,
                        rol: usuario.rol
                    }
                };
            } else {
                const usuario = memoryDB.usuarios.find(u => 
                    u.email === email
                );
                
                if (!usuario) {
                    return {
                        ok: false,
                        mensaje: 'usuario no encontrado',
                        token: null,
                        usuario: null
                    };
                }
                
                if (usuario.password !== password) {
                    return {
                        ok: false,
                        mensaje: 'contrasena incorrecta',
                        token: null,
                        usuario: null
                    };
                }
                
                // generar token jwt
                const token = generarToken(usuario);
                
                return {
                    ok: true,
                    mensaje: 'login exitoso',
                    token: token,
                    usuario: usuario
                };
            }
        },
        
        /**
         * crea un nuevo voluntariado (requiere autenticacion)
         * @param {Object} _ - parent (no usado)
         * @param {Object} args - datos del voluntariado
         * @param {Object} context - contexto con usuario autenticado
         * @returns {Object} voluntariado creado
         * @throws {Error} si faltan datos o el tipo es invalido
         */
        crearVoluntariado: async (_, { titulo, email, fecha, descripcion, tipo }, context) => {
            console.log('[graphql mutation] crear voluntariado:', titulo);
            
            // verificar autenticacion
            verificarAuth(context);
            
            if (tipo !== 'Oferta' && tipo !== 'Petición') {
                throw new Error('el tipo debe ser oferta o peticion');
            }
            
            if (usarMongoDB()) {
                const db = getDB();
                
                const ultimoVoluntariado = await db.collection('voluntariados').find().sort({ id: -1 }).limit(1).toArray();
                const nuevoId = ultimoVoluntariado.length > 0 ? ultimoVoluntariado[0].id + 1 : 1;
                
                const nuevoVoluntariado = {
                    id: nuevoId,
                    titulo,
                    email,
                    fecha,
                    descripcion,
                    tipo,
                    fechaCreacion: new Date()
                };
                
                await db.collection('voluntariados').insertOne(nuevoVoluntariado);
                
                return {
                    id: nuevoId,
                    titulo,
                    email,
                    fecha,
                    descripcion,
                    tipo
                };
            } else {
                const nuevoVoluntariado = {
                    id: memoryDB.nextVoluntariadoId(),
                    titulo,
                    email,
                    fecha,
                    descripcion,
                    tipo
                };
                
                memoryDB.voluntariados.push(nuevoVoluntariado);
                return nuevoVoluntariado;
            }
        },
        
        /**
         * elimina un voluntariado por id (requiere autenticacion)
         * @param {Object} _ - parent (no usado)
         * @param {Object} args - argumentos { id }
         * @param {Object} context - contexto con usuario autenticado
         * @returns {Object} respuesta con ok y mensaje
         * @throws {Error} si el voluntariado no existe
         */
        borrarVoluntariado: async (_, { id }, context) => {
            console.log('[graphql mutation] borrar voluntariado:', id);
            
            // verificar autenticacion
            verificarAuth(context);
            
            if (usarMongoDB()) {
                const db = getDB();
                const result = await db.collection('voluntariados').deleteOne({ id: parseInt(id) });
                
                if (result.deletedCount === 0) {
                    throw new Error('voluntariado no encontrado');
                }
                
                return {
                    ok: true,
                    mensaje: 'voluntariado eliminado correctamente'
                };
            } else {
                const index = memoryDB.voluntariados.findIndex(v => v.id === id);
                
                if (index === -1) {
                    throw new Error('voluntariado no encontrado');
                }
                
                memoryDB.voluntariados.splice(index, 1);
                
                return {
                    ok: true,
                    mensaje: 'voluntariado eliminado correctamente'
                };
            }
        },
        
        /**
         * actualiza un voluntariado existente (requiere autenticacion)
         * @param {Object} _ - parent (no usado)
         * @param {Object} args - id y datos a actualizar
         * @param {Object} context - contexto con usuario autenticado
         * @returns {Object} voluntariado actualizado
         * @throws {Error} si el voluntariado no existe o el tipo es invalido
         */
        actualizarVoluntariado: async (_, { id, titulo, email, fecha, descripcion, tipo }, context) => {
            console.log('[graphql mutation] actualizar voluntariado:', id);
            
            // verificar autenticacion
            verificarAuth(context);
            
            if (tipo && tipo !== 'Oferta' && tipo !== 'Petición') {
                throw new Error('el tipo debe ser oferta o peticion');
            }
            
            if (usarMongoDB()) {
                const db = getDB();
                
                const actualizacion = {};
                if (titulo) actualizacion.titulo = titulo;
                if (email) actualizacion.email = email;
                if (fecha) actualizacion.fecha = fecha;
                if (descripcion) actualizacion.descripcion = descripcion;
                if (tipo) actualizacion.tipo = tipo;
                actualizacion.fechaModificacion = new Date();
                
                const result = await db.collection('voluntariados').findOneAndUpdate(
                    { id: parseInt(id) },
                    { $set: actualizacion },
                    { returnDocument: 'after' }
                );
                
                if (!result.value) {
                    throw new Error('voluntariado no encontrado');
                }
                
                return {
                    id: result.value.id,
                    titulo: result.value.titulo,
                    email: result.value.email,
                    fecha: result.value.fecha,
                    descripcion: result.value.descripcion,
                    tipo: result.value.tipo
                };
            } else {
                const index = memoryDB.voluntariados.findIndex(v => v.id === id);
                
                if (index === -1) {
                    throw new Error('voluntariado no encontrado');
                }
                
                const voluntarioActualizado = {
                    ...memoryDB.voluntariados[index],
                    ...(titulo && { titulo }),
                    ...(email && { email }),
                    ...(fecha && { fecha }),
                    ...(descripcion && { descripcion }),
                    ...(tipo && { tipo })
                };
                
                memoryDB.voluntariados[index] = voluntarioActualizado;
                return voluntarioActualizado;
            }
        }
    }
};