// backend/src/graphql/resolvers.js

import Usuario from '../models/Usuario.js';
import Voluntariado from '../models/Voluntariado.js';
import { generarToken } from '../utils/jwt.js';

/**
 * Verifica que el usuario esté autenticado
 * @param {Object} context - contexto de GraphQL con usuario
 * @param {Boolean} requiereAdmin - si requiere rol de admin
 * @throws {Error} si no está autenticado o no es admin
 * @returns {Object} usuario autenticado
 */
function verificarAuth(context, requiereAdmin = false) {
    if (!context.usuario) {
        throw new Error('No autenticado. Debes iniciar sesión primero');
    }
    
    if (requiereAdmin && context.usuario.rol !== 'admin') {
        throw new Error('Acceso denegado. Se requiere rol de administrador');
    }
    
    console.log('[GraphQL Auth] Usuario verificado:', context.usuario.email, '- Rol:', context.usuario.rol);
    return context.usuario;
}

export const resolvers = {
    
    // QUERIES - Operaciones de lectura
    Query: {
        
        /**
         * Obtiene todos los usuarios del sistema
         */
        obtenerUsuarios: async () => {
            console.log('[GraphQL Query] Obtener usuarios');
            const usuarios = await Usuario.find().select('-__v');
            return usuarios;
        },
        
        /**
         * Obtiene un usuario por su email
         */
        obtenerUsuario: async (_, { email }) => {
            console.log('[GraphQL Query] Obtener usuario:', email);
            const usuario = await Usuario.findOne({ email }).select('-__v');
            return usuario;
        },
        
        /**
         * Obtiene todos los voluntariados
         */
        obtenerVoluntariados: async () => {
            console.log('[GraphQL Query] Obtener voluntariados');
            const voluntariados = await Voluntariado.find().select('-__v');
            return voluntariados;
        },
        
        /**
         * Obtiene un voluntariado por ID
         */
        obtenerVoluntariado: async (_, { id }) => {
            console.log('[GraphQL Query] Obtener voluntariado:', id);
            const voluntariado = await Voluntariado.findOne({ id: parseInt(id) }).select('-__v');
            return voluntariado;
        },
        
        /**
         * Obtiene voluntariados filtrados por tipo
         */
        obtenerVoluntariadosPorTipo: async (_, { tipo }) => {
            console.log('[GraphQL Query] Obtener por tipo:', tipo);
            const voluntariados = await Voluntariado.find({ tipo }).select('-__v');
            return voluntariados;
        }
    },
    
    // MUTATIONS - Operaciones de escritura
    Mutation: {
        
        /**
         * Crea un nuevo usuario
         */
        crearUsuario: async (_, { nombre, email, password, rol }) => {
            console.log('[GraphQL Mutation] Crear usuario:', email);
            
            // Verificar si el email ya existe
            const existe = await Usuario.findOne({ email });
            if (existe) {
                throw new Error('El email ya está registrado');
            }
            
            // Obtener siguiente ID
            const nuevoId = await Usuario.obtenerSiguienteId();
            
            // Crear usuario
            const nuevoUsuario = new Usuario({
                id: nuevoId,
                nombre,
                email,
                password,
                rol: rol || 'usuario'
            });
            
            await nuevoUsuario.save();
            
            return {
                id: nuevoUsuario.id,
                nombre: nuevoUsuario.nombre,
                email: nuevoUsuario.email,
                password: nuevoUsuario.password,
                rol: nuevoUsuario.rol
            };
        },
        
        /**
         * Elimina un usuario por email (requiere rol admin)
         */
        borrarUsuario: async (_, { email }, context) => {
            console.log('[GraphQL Mutation] Borrar usuario:', email);
            
            // Verificar autenticación y rol admin
            verificarAuth(context, true);
            
            const result = await Usuario.deleteOne({ email });
            
            if (result.deletedCount === 0) {
                throw new Error('Usuario no encontrado');
            }
            
            return {
                ok: true,
                mensaje: 'Usuario eliminado correctamente'
            };
        },
        
        /**
         * Autentica un usuario (login) y devuelve token JWT
         */
        loginUsuario: async (_, { email, password }) => {
            console.log('[GraphQL Mutation] Login usuario:', email);
            
            const usuario = await Usuario.findOne({ email });
            
            if (!usuario) {
                return {
                    ok: false,
                    mensaje: 'Usuario no encontrado',
                    token: null,
                    usuario: null
                };
            }
            
            if (usuario.password !== password) {
                return {
                    ok: false,
                    mensaje: 'Contraseña incorrecta',
                    token: null,
                    usuario: null
                };
            }
            
            // Generar token JWT
            const token = generarToken({
                id: usuario.id,
                email: usuario.email,
                rol: usuario.rol
            });
            
            return {
                ok: true,
                mensaje: 'Login exitoso',
                token: token,
                usuario: {
                    id: usuario.id,
                    nombre: usuario.nombre,
                    email: usuario.email,
                    rol: usuario.rol
                }
            };
        },
        
        /**
         * Crea un nuevo voluntariado (requiere autenticación)
         */
        crearVoluntariado: async (_, { titulo, email, fecha, descripcion, tipo }, context) => {
            console.log('[GraphQL Mutation] Crear voluntariado:', titulo);
            
            // Verificar autenticación
            verificarAuth(context);
            
            // Obtener siguiente ID
            const nuevoId = await Voluntariado.obtenerSiguienteId();
            
            // Crear voluntariado
            const nuevoVoluntariado = new Voluntariado({
                id: nuevoId,
                titulo,
                email,
                fecha,
                descripcion,
                tipo
            });
            
            await nuevoVoluntariado.save();
            
            return {
                id: nuevoVoluntariado.id,
                titulo: nuevoVoluntariado.titulo,
                email: nuevoVoluntariado.email,
                fecha: nuevoVoluntariado.fecha,
                descripcion: nuevoVoluntariado.descripcion,
                tipo: nuevoVoluntariado.tipo
            };
        },
        
        /**
         * Elimina un voluntariado por ID (requiere autenticación)
         */
        borrarVoluntariado: async (_, { id }, context) => {
            console.log('[GraphQL Mutation] Borrar voluntariado:', id);
            
            // Verificar autenticación
            verificarAuth(context);
            
            const result = await Voluntariado.deleteOne({ id: parseInt(id) });
            
            if (result.deletedCount === 0) {
                throw new Error('Voluntariado no encontrado');
            }
            
            return {
                ok: true,
                mensaje: 'Voluntariado eliminado correctamente'
            };
        },
        
        /**
         * Actualiza un voluntariado existente (requiere autenticación)
         */
        actualizarVoluntariado: async (_, { id, titulo, email, fecha, descripcion, tipo }, context) => {
            console.log('[GraphQL Mutation] Actualizar voluntariado:', id);
            
            // Verificar autenticación
            verificarAuth(context);
            
            // Preparar actualización
            const actualizacion = {};
            if (titulo) actualizacion.titulo = titulo;
            if (email) actualizacion.email = email;
            if (fecha) actualizacion.fecha = fecha;
            if (descripcion) actualizacion.descripcion = descripcion;
            if (tipo) actualizacion.tipo = tipo;
            
            const voluntarioActualizado = await Voluntariado.findOneAndUpdate(
                { id: parseInt(id) },
                actualizacion,
                { new: true, runValidators: true }
            );
            
            if (!voluntarioActualizado) {
                throw new Error('Voluntariado no encontrado');
            }
            
            return {
                id: voluntarioActualizado.id,
                titulo: voluntarioActualizado.titulo,
                email: voluntarioActualizado.email,
                fecha: voluntarioActualizado.fecha,
                descripcion: voluntarioActualizado.descripcion,
                tipo: voluntarioActualizado.tipo
            };
        }
    }
};