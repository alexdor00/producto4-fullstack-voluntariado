// backend/src/middleware/auth.js

import { verificarToken, extraerToken } from '../utils/jwt.js';

/**
 * Middleware para verificar autenticación JWT
 * Verifica el token en el header Authorization
 */
export function verificarAutenticacion(req, res, next) {
    try {
        const token = extraerToken(req.headers.authorization);
        
        if (!token) {
            return res.status(401).json({
                ok: false,
                mensaje: 'Token no proporcionado. Debes iniciar sesión.'
            });
        }
        
        const decoded = verificarToken(token);
        req.usuario = decoded;
        
        console.log('[Auth] Usuario autenticado:', decoded.email, '- Rol:', decoded.rol);
        
        next();
        
    } catch (error) {
        return res.status(401).json({
            ok: false,
            mensaje: error.message,
            error: 'No autorizado'
        });
    }
}

/**
 * Middleware para verificar rol de administrador
 * Debe usarse después de verificarAutenticacion
 */
export function verificarAdmin(req, res, next) {
    if (!req.usuario) {
        return res.status(401).json({
            ok: false,
            mensaje: 'No autenticado'
        });
    }
    
    if (req.usuario.rol !== 'admin') {
        console.log('[Auth] Acceso denegado - Usuario:', req.usuario.email, 'intentó acceder a recurso admin');
        return res.status(403).json({
            ok: false,
            mensaje: 'Acceso denegado. Se requiere rol de administrador.'
        });
    }
    
    console.log('[Auth] Acceso admin concedido:', req.usuario.email);
    next();
}

/**
 * Middleware para verificar que el usuario solo accede a sus propios recursos
 * O es admin (puede acceder a todo)
 */
export function verificarPropietarioOAdmin(req, res, next) {
    if (!req.usuario) {
        return res.status(401).json({
            ok: false,
            mensaje: 'No autenticado'
        });
    }
    
    // Si es admin, permitir acceso
    if (req.usuario.rol === 'admin') {
        console.log('[Auth] Admin accede a recurso:', req.usuario.email);
        return next();
    }
    
    // Si es usuario normal, verificar que accede a sus propios datos
    const emailRecurso = req.params.email || req.body.email || req.query.email;
    
    if (emailRecurso && emailRecurso !== req.usuario.email) {
        console.log('[Auth] Acceso denegado - Usuario:', req.usuario.email, 'intentó acceder a:', emailRecurso);
        return res.status(403).json({
            ok: false,
            mensaje: 'No puedes acceder a recursos de otros usuarios.'
        });
    }
    
    next();
}