// src/routes/voluntariadosRoutes.js

import express from 'express';
import { 
    obtenerVoluntariados, 
    crearVoluntariado, 
    borrarVoluntariado,
    obtenerVoluntariadosPorTipo
} from '../controllers/voluntariadosController.js';
import { verificarAutenticacion } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route GET /api/voluntariados
 * @description obtener todos los voluntariados
 * @access public
 */
router.get('/', obtenerVoluntariados);

/**
 * @route GET /api/voluntariados/tipo
 * @description obtener voluntariados filtrados por tipo (oferta/peticion)
 * @query tipo - oferta o peticion
 * @access public
 */
router.get('/tipo', obtenerVoluntariadosPorTipo);

/**
 * @route POST /api/voluntariados
 * @description crear un nuevo voluntariado
 * @access private (requiere token jwt)
 */
router.post('/', verificarAutenticacion, crearVoluntariado);

/**
 * @route DELETE /api/voluntariados/:id
 * @description eliminar un voluntariado por id
 * @access private (requiere token jwt)
 */
router.delete('/:id', verificarAutenticacion, borrarVoluntariado);

export default router;