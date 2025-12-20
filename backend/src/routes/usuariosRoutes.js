
import express from 'express';
import { 
    obtenerUsuarios, 
    crearUsuario, 
    borrarUsuario, 
    loginUsuario 
} from '../controllers/usuariosController.js';
import { verificarAutenticacion, verificarAdmin } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route POST /api/usuarios/login
 * @description autenticar usuario (login) y obtener token jwt
 * @access public
 */
router.post('/login', loginUsuario);

/**
 * @route POST /api/usuarios
 * @description crear un nuevo usuario
 * @access public
 */
router.post('/', crearUsuario);

/**
 * @route GET /api/usuarios
 * @description obtener todos los usuarios
 * @access public (sin token)
 */
router.get('/', obtenerUsuarios);

/**
 * @route DELETE /api/usuarios/:email
 * @description eliminar un usuario por email
 * @access private (requiere token jwt y rol admin)
 */
router.delete('/:email', verificarAutenticacion, verificarAdmin, borrarUsuario);

export default router;