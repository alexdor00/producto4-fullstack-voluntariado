// backend/src/graphql/resolvers.js

import Usuario from '../models/Usuario.js';
import Voluntariado from '../models/Voluntariado.js';
import { generarToken } from '../utils/jwt.js';

/**
 * Verifica autenticación y opcionalmente rol admin
 */
function verificarAuth(context, requiereAdmin = false) {
    if (!context.usuario) {
        throw new Error('No autenticado. Debes iniciar sesión primero');
    }
    
    if (requiereAdmin && context.usuario.rol !== 'admin') {
        throw new Error('Acceso denegado. Se requiere rol de administrador');
    }
    
    console.log('[GraphQL Auth] Usuario:', context.usuario.email, '- Rol:', context.usuario.rol);
    return context.usuario;
}

export const resolvers = {
    
    // QUERIES - Operaciones de lectura
    Query: {
        
        /**
         * Obtiene usuarios según rol:
         * - Admin: TODOS los usuarios
         * - Usuario normal: Solo información pública limitada
         */
        obtenerUsuarios: async (_, __, context) => {
            console.log('[GraphQL Query] Obtener usuarios');
            
            // Verificar autenticación
            const usuario = verificarAuth(context);
            
            // Si es admin, devolver todos
            if (usuario.rol === 'admin') {
                const usuarios = await Usuario.find().select('-password -__v');
                return usuarios;
            }
            
            // Usuario normal: solo devolver información limitada
            const usuarios = await Usuario.find().select('id nombre email rol -_id');
            return usuarios;
        },
        
        /**
         * Obtiene un usuario por email
         * - Admin: Puede ver cualquier usuario
         * - Usuario normal: Solo puede ver su propio perfil
         */
        obtenerUsuario: async (_, { email }, context) => {
            console.log('[GraphQL Query] Obtener usuario:', email);
            
            // Verificar autenticación
            const usuario = verificarAuth(context);
            
            // Si no es admin y intenta ver otro usuario
            if (usuario.rol !== 'admin' && usuario.email !== email) {
                throw new Error('No puedes ver información de otros usuarios');
            }
            
            const usuarioEncontrado = await Usuario.findOne({ email }).select('-password -__v');
            return usuarioEncontrado;
        },
        
        /**
         * Obtiene voluntariados según rol:
         * - Admin: TODOS los voluntariados
         * - Usuario normal: Solo SUS voluntariados
         */
        obtenerVoluntariados: async (_, __, context) => {
            console.log('[GraphQL Query] Obtener voluntariados');
            
            // Verificar autenticación
            const usuario = verificarAuth(context);
            
            // Si es admin, devolver todos
            if (usuario.rol === 'admin') {
                const voluntariados = await Voluntariado.find().select('-__v');
                return voluntariados;
            }
            
            // Usuario normal: solo sus voluntariados
            const voluntariados = await Voluntariado.find({ email: usuario.email }).select('-__v');
            console.log('[GraphQL] Usuario normal - Devolviendo', voluntariados.length, 'voluntariados propios');
            return voluntariados;
        },
        
        /**
         * Obtiene un voluntariado por ID
         * - Admin: Cualquier voluntariado
         * - Usuario normal: Solo si es suyo
         */
        obtenerVoluntariado: async (_, { id }, context) => {
            console.log('[GraphQL Query] Obtener voluntariado:', id);
            
            // Verificar autenticación
            const usuario = verificarAuth(context);
            
            const voluntariado = await Voluntariado.findOne({ id: parseInt(id) }).select('-__v');
            
            if (!voluntariado) {
                throw new Error('Voluntariado no encontrado');
            }
            
            // Si no es admin y no es el propietario
            if (usuario.rol !== 'admin' && voluntariado.email !== usuario.email) {
                throw new Error('No puedes ver voluntariados de otros usuarios');
            }
            
            return voluntariado;
        },
        
        /**
         * Obtiene voluntariados por tipo
         * - Admin: Todos del tipo especificado
         * - Usuario normal: Solo sus voluntariados del tipo especificado
         */
        obtenerVoluntariadosPorTipo: async (_, { tipo }, context) => {
            console.log('[GraphQL Query] Obtener por tipo:', tipo);
            
            // Verificar autenticación
            const usuario = verificarAuth(context);
            
            // Si es admin, devolver todos del tipo
            if (usuario.rol === 'admin') {
                const voluntariados = await Voluntariado.find({ tipo }).select('-__v');
                return voluntariados;
            }
            
            // Usuario normal: solo sus voluntariados del tipo
            const voluntariados = await Voluntariado.find({ 
                tipo, 
                email: usuario.email 
            }).select('-__v');
            return voluntariados;
        }
    },
    
    Mutation: {
        
        crearUsuario: async (_, { nombre, email, password, rol }) => {
            console.log('[GraphQL Mutation] Crear usuario:', email);
            
            const existe = await Usuario.findOne({ email });
            if (existe) {
                throw new Error('El email ya está registrado');
            }
            
            const nuevoId = await Usuario.obtenerSiguienteId();
            
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
        
        borrarUsuario: async (_, { email }, context) => {
            console.log('[GraphQL Mutation] Borrar usuario:', email);
            verificarAuth(context, true); // Solo admin
            
            const result = await Usuario.deleteOne({ email });
            
            if (result.deletedCount === 0) {
                throw new Error('Usuario no encontrado');
            }
            
            return {
                ok: true,
                mensaje: 'Usuario eliminado correctamente'
            };
        },
        
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
        
        crearVoluntariado: async (_, { titulo, email, fecha, descripcion, tipo }, context) => {
            console.log('[GraphQL Mutation] Crear voluntariado:', titulo);
            verificarAuth(context);
            
            const nuevoId = await Voluntariado.obtenerSiguienteId();
            
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
        
        borrarVoluntariado: async (_, { id }, context) => {
            console.log('[GraphQL Mutation] Borrar voluntariado:', id);
            
            const usuario = verificarAuth(context);
            
            // Buscar voluntariado
            const voluntariado = await Voluntariado.findOne({ id: parseInt(id) });
            
            if (!voluntariado) {
                throw new Error('Voluntariado no encontrado');
            }
            
            // Verificar permisos: admin o propietario
            if (usuario.rol !== 'admin' && voluntariado.email !== usuario.email) {
                throw new Error('No puedes eliminar voluntariados de otros usuarios');
            }
            
            await Voluntariado.deleteOne({ id: parseInt(id) });
            
            return {
                ok: true,
                mensaje: 'Voluntariado eliminado correctamente'
            };
        },
        
        actualizarVoluntariado: async (_, { id, titulo, email, fecha, descripcion, tipo }, context) => {
            console.log('[GraphQL Mutation] Actualizar voluntariado:', id);
            
            const usuario = verificarAuth(context);
            
            // Buscar voluntariado
            const voluntariado = await Voluntariado.findOne({ id: parseInt(id) });
            
            if (!voluntariado) {
                throw new Error('Voluntariado no encontrado');
            }
            
            // Verificar permisos: admin o propietario
            if (usuario.rol !== 'admin' && voluntariado.email !== usuario.email) {
                throw new Error('No puedes actualizar voluntariados de otros usuarios');
            }
            
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