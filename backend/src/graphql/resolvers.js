
import Usuario from '../models/Usuario.js';
import Voluntariado from '../models/Voluntariado.js';
import { generarToken } from '../utils/jwt.js';
import { 
    emitirVoluntariadoCreado, 
    emitirVoluntariadoActualizado, 
    emitirVoluntariadoEliminado 
} from '../sockets/socketHandler.js';

// verificar autenticacion del usuario
function verificarAuth(context, requiereAdmin = false) {
    if (!context.usuario) {
        throw new Error('no autenticado. debes iniciar sesion primero');
    }
    
    if (requiereAdmin && context.usuario.rol !== 'admin') {
        throw new Error('acceso denegado. se requiere rol de administrador');
    }
    
    console.log('[auth] usuario:', context.usuario.email, 'rol:', context.usuario.rol);
    return context.usuario;
}

export const resolvers = {
    
    Query: {
        
        // obtener todos los usuarios
        obtenerUsuarios: async (_, __, context) => {
            console.log('[query] obtener usuarios');
            
            const usuario = verificarAuth(context);
            
            // admin ve todos sin password, usuario normal ve lista basica
            if (usuario.rol === 'admin') {
                return await Usuario.find().select('-password -__v');
            }
            
            return await Usuario.find().select('id nombre email rol -_id');
        },
        
        // obtener usuario por email
        obtenerUsuario: async (_, { email }, context) => {
            console.log('[query] obtener usuario:', email);
            
            const usuario = verificarAuth(context);
            
            // solo admin o el mismo usuario pueden ver el perfil
            if (usuario.rol !== 'admin' && usuario.email !== email) {
                throw new Error('no puedes ver informacion de otros usuarios');
            }
            
            return await Usuario.findOne({ email }).select('-password -__v');
        },
        
        // obtener voluntariados
        obtenerVoluntariados: async (_, __, context) => {
            console.log('[query] obtener voluntariados');
            
            const usuario = verificarAuth(context);
            
            // admin ve todos, usuario normal solo los suyos
            if (usuario.rol === 'admin') {
                return await Voluntariado.find().select('-__v');
            }
            
            const voluntariados = await Voluntariado.find({ email: usuario.email }).select('-__v');
            console.log('usuario normal - encontrados', voluntariados.length, 'voluntariados');
            return voluntariados;
        },
        
        // obtener voluntariado especifico
        obtenerVoluntariado: async (_, { id }, context) => {
            console.log('[query] obtener voluntariado id:', id);
            
            const usuario = verificarAuth(context);
            const voluntariado = await Voluntariado.findOne({ id: parseInt(id) }).select('-__v');
            
            if (!voluntariado) {
                throw new Error('voluntariado no encontrado');
            }
            
            // verificar que sea admin o propietario
            if (usuario.rol !== 'admin' && voluntariado.email !== usuario.email) {
                throw new Error('no puedes ver voluntariados de otros usuarios');
            }
            
            return voluntariado;
        },
        
        // buscar voluntariados por tipo
        obtenerVoluntariadosPorTipo: async (_, { tipo }, context) => {
            console.log('[query] buscar tipo:', tipo);
            
            const usuario = verificarAuth(context);
            
            if (usuario.rol === 'admin') {
                return await Voluntariado.find({ tipo }).select('-__v');
            }
            
            return await Voluntariado.find({ tipo, email: usuario.email }).select('-__v');
        }
    },
    
    Mutation: {
        
        // registrar nuevo usuario
        crearUsuario: async (_, { nombre, email, password, rol }) => {
            console.log('[mutation] crear usuario:', email);
            
            // verificar que no exista
            const existe = await Usuario.findOne({ email });
            if (existe) {
                throw new Error('el email ya esta registrado');
            }
            
            // crear con id autoincrementado
            const nuevoId = await Usuario.obtenerSiguienteId();
            
            const nuevoUsuario = new Usuario({
                id: nuevoId,
                nombre,
                email,
                password,
                rol: rol || 'usuario'
            });
            
            await nuevoUsuario.save();
            
            return nuevoUsuario;
        },
        
        // eliminar usuario (solo admin)
        borrarUsuario: async (_, { email }, context) => {
            console.log('[mutation] borrar usuario:', email);
            verificarAuth(context, true);
            
            const result = await Usuario.deleteOne({ email });
            
            if (result.deletedCount === 0) {
                throw new Error('usuario no encontrado');
            }
            
            return {
                ok: true,
                mensaje: 'usuario eliminado correctamente'
            };
        },
        
        // iniciar sesion
        loginUsuario: async (_, { email, password }) => {
            console.log('[mutation] login:', email);
            
            const usuario = await Usuario.findOne({ email });
            
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
            const token = generarToken({
                id: usuario.id,
                email: usuario.email,
                rol: usuario.rol
            });
            
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
        },
        
        // crear voluntariado
        crearVoluntariado: async (_, { titulo, email, fecha, descripcion, tipo }, context) => {
            console.log('[mutation] crear voluntariado:', titulo);
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
            
            // preparar datos para respuesta y websocket
            const voluntariadoCreado = {
                id: nuevoVoluntariado.id,
                titulo: nuevoVoluntariado.titulo,
                email: nuevoVoluntariado.email,
                fecha: nuevoVoluntariado.fecha,
                descripcion: nuevoVoluntariado.descripcion,
                tipo: nuevoVoluntariado.tipo
            };
            
            // notificar a todos los clientes conectados
            emitirVoluntariadoCreado(voluntariadoCreado);
            
            return voluntariadoCreado;
        },
        
        // eliminar voluntariado
        borrarVoluntariado: async (_, { id }, context) => {
            console.log('[mutation] borrar voluntariado id:', id);
            
            const usuario = verificarAuth(context);
            const voluntariado = await Voluntariado.findOne({ id: parseInt(id) });
            
            if (!voluntariado) {
                throw new Error('voluntariado no encontrado');
            }
            
            // solo admin o propietario pueden borrar
            if (usuario.rol !== 'admin' && voluntariado.email !== usuario.email) {
                throw new Error('no puedes eliminar voluntariados de otros usuarios');
            }
            
            await Voluntariado.deleteOne({ id: parseInt(id) });
            
            // notificar eliminacion via websocket
            emitirVoluntariadoEliminado(parseInt(id));
            
            return {
                ok: true,
                mensaje: 'voluntariado eliminado correctamente'
            };
        },
        
        // actualizar voluntariado
        actualizarVoluntariado: async (_, { id, titulo, email, fecha, descripcion, tipo }, context) => {
            console.log('[mutation] actualizar voluntariado id:', id);
            
            const usuario = verificarAuth(context);
            const voluntariado = await Voluntariado.findOne({ id: parseInt(id) });
            
            if (!voluntariado) {
                throw new Error('voluntariado no encontrado');
            }
            
            // verificar permisos
            if (usuario.rol !== 'admin' && voluntariado.email !== usuario.email) {
                throw new Error('no puedes actualizar voluntariados de otros usuarios');
            }
            
            // construir objeto de actualizacion
            const cambios = {};
            if (titulo) cambios.titulo = titulo;
            if (email) cambios.email = email;
            if (fecha) cambios.fecha = fecha;
            if (descripcion) cambios.descripcion = descripcion;
            if (tipo) cambios.tipo = tipo;
            
            const actualizado = await Voluntariado.findOneAndUpdate(
                { id: parseInt(id) },
                cambios,
                { new: true, runValidators: true }
            );
            
            const voluntariadoActualizado = {
                id: actualizado.id,
                titulo: actualizado.titulo,
                email: actualizado.email,
                fecha: actualizado.fecha,
                descripcion: actualizado.descripcion,
                tipo: actualizado.tipo
            };
            
            // notificar actualizacion via websocket
            emitirVoluntariadoActualizado(voluntariadoActualizado);
            
            return voluntariadoActualizado;
        }
    }
};