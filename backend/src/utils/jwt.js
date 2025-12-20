

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secreto_por_defecto_cambiar';
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '24h';

/**
 * genera un token jwt para un usuario
 * @param {Object} usuario - datos del usuario
 * @returns {String} token jwt
 */
export function generarToken(usuario) {
    const payload = {
        id: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre,
        rol: usuario.rol
    };
    
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRATION
    });
}

/**
 * verifica y decodifica un token jwt
 * @param {String} token - token a verificar
 * @returns {Object} datos decodificados del token
 * @throws {Error} si el token es invalido o ha expirado
 */
export function verificarToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new Error('token expirado');
        }
        throw new Error('token invalido');
    }
}

/**
 * extrae el token del header authorization
 * @param {String} authHeader - header de autorizacion
 * @returns {String|null} token extraido o null
 */
export function extraerToken(authHeader) {
    if (!authHeader) return null;
    
    // formato: "Bearer <token>"
    const partes = authHeader.split(' ');
    
    if (partes.length === 2 && partes[0] === 'Bearer') {
        return partes[1];
    }
    
    return null;
}