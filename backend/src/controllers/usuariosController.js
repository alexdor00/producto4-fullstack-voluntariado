

import { db } from '../data/dataStore.js';
import { generarToken } from '../utils/jwt.js';

/**
 * obtiene todos los usuarios del sistema
 * @param {Object} req - request de express
 * @param {Object} res - response de express
 * @returns {Object} json con array de usuarios
 */
export const obtenerUsuarios = (req, res) => {
    try {
        res.json({
            ok: true,
            total: db.usuarios.length,
            usuarios: db.usuarios
        });
    } catch (error) {
        res.status(500).json({
            ok: false,
            mensaje: 'error al obtener usuarios',
            error: error.message
        });
    }
};

/**
 * crea un nuevo usuario en el sistema
 * @param {Object} req - request con datos del usuario en body
 * @param {Object} res - response de express
 * @returns {Object} json con usuario creado
 */
export const crearUsuario = (req, res) => {
    try {
        const { nombre, email, password, rol } = req.body;
        
        // validar datos
        if (!nombre || !email || !password) {
            return res.status(400).json({
                ok: false,
                mensaje: 'faltan datos obligatorios: nombre, email, password'
            });
        }
        
        // verificar si el email ya existe
        const existe = db.usuarios.find(u => u.email === email);
        if (existe) {
            return res.status(400).json({
                ok: false,
                mensaje: 'el email ya esta registrado'
            });
        }
        
        // crear usuario
        const nuevoUsuario = {
            id: db.nextUsuarioId(),
            nombre,
            email,
            password,
            rol: rol || 'usuario'
        };
        
        db.usuarios.push(nuevoUsuario);
        
        res.status(201).json({
            ok: true,
            mensaje: 'usuario creado correctamente',
            usuario: nuevoUsuario
        });
        
    } catch (error) {
        res.status(500).json({
            ok: false,
            mensaje: 'error al crear usuario',
            error: error.message
        });
    }
};

/**
 * elimina un usuario por su email
 * @param {Object} req - request con email en params
 * @param {Object} res - response de express
 * @returns {Object} json confirmando la eliminacion
 */
export const borrarUsuario = (req, res) => {
    try {
        const { email } = req.params;
        
        const index = db.usuarios.findIndex(u => u.email === email);
        
        if (index === -1) {
            return res.status(404).json({
                ok: false,
                mensaje: 'usuario no encontrado'
            });
        }
        
        const usuarioEliminado = db.usuarios.splice(index, 1)[0];
        
        res.json({
            ok: true,
            mensaje: 'usuario eliminado correctamente',
            usuario: usuarioEliminado
        });
        
    } catch (error) {
        res.status(500).json({
            ok: false,
            mensaje: 'error al borrar usuario',
            error: error.message
        });
    }
};

/**
 * autentica un usuario (login) y devuelve token jwt
 * @param {Object} req - request con email y password en body
 * @param {Object} res - response de express
 * @returns {Object} json con datos del usuario autenticado y token
 */
export const loginUsuario = (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({
                ok: false,
                mensaje: 'email y contrasena son obligatorios'
            });
        }
        
        const usuario = db.usuarios.find(u => 
            u.email.toLowerCase() === email.toLowerCase()
        );
        
        if (!usuario) {
            return res.status(404).json({
                ok: false,
                mensaje: 'usuario no encontrado'
            });
        }
        
        if (usuario.password !== password) {
            return res.status(401).json({
                ok: false,
                mensaje: 'contrasena incorrecta'
            });
        }
        
        // generar token jwt
        const token = generarToken(usuario);
        
        res.json({
            ok: true,
            mensaje: 'login exitoso',
            token: token,
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre,
                email: usuario.email,
                rol: usuario.rol
            }
        });
        
    } catch (error) {
        res.status(500).json({
            ok: false,
            mensaje: 'error en el login',
            error: error.message
        });
    }
};