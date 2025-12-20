import { verificarToken, extraerToken } from '../utils/jwt.js';

/**
 * middleware para verificar autenticacion jwt
 * verifica el token en el header authorization
 * @param {Object} req - request de express
 * @param {Object} res - response de express
 * @param {Function} next - siguiente middleware
 */
export function verificarAutenticacion(req, res, next) {
    try {
        const token = extraerToken(req.headers.authorization);
        
        if (!token) {
            return res.status(401).json({
                ok: false,
                mensaje: 'token no proporcionado. debes iniciar sesion.'
            });
        }
        
        const decoded = verificarToken(token);
        req.usuario = decoded;
        
        console.log('[auth] usuario autenticado:', decoded.email);
        
        next();
        
    } catch (error) {
        return res.status(401).json({
            ok: false,
            mensaje: error.message,
            error: 'no autorizado'
        });
    }
}

/**
 * middleware para verificar rol de administrador
 * debe usarse despues de verificarAutenticacion
 */
export function verificarAdmin(req, res, next) {
    if (!req.usuario) {
        return res.status(401).json({
            ok: false,
            mensaje: 'no autenticado'
        });
    }
    
    if (req.usuario.rol !== 'admin') {
        return res.status(403).json({
            ok: false,
            mensaje: 'acceso denegado. se requiere rol de administrador.'
        });
    }
    
    next();
}