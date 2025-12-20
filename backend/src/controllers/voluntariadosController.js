

import { getDB, isMongoConnected } from '../config/database.js';
import { db as memoryDB } from '../data/dataStore.js';

/**
 * helper: usar mongodb o memoria segun disponibilidad
 * @returns {Boolean} true si mongodb esta conectado
 */
function usarMongoDB() {
    return isMongoConnected() && getDB() !== null;
}

/**
 * obtiene todos los voluntariados del sistema
 * @param {Object} req - request de express
 * @param {Object} res - response de express
 * @returns {Object} json con array de voluntariados
 */
export const obtenerVoluntariados = async (req, res) => {
    try {
        if (usarMongoDB()) {
            const db = getDB();
            const voluntariados = await db.collection('voluntariados').find().toArray();
            
            res.json({
                ok: true,
                total: voluntariados.length,
                voluntariados: voluntariados.map(v => ({
                    id: v.id,
                    titulo: v.titulo,
                    email: v.email,
                    fecha: v.fecha,
                    descripcion: v.descripcion,
                    tipo: v.tipo
                }))
            });
        } else {
            res.json({
                ok: true,
                total: memoryDB.voluntariados.length,
                voluntariados: memoryDB.voluntariados
            });
        }
    } catch (error) {
        res.status(500).json({
            ok: false,
            mensaje: 'error al obtener voluntariados',
            error: error.message
        });
    }
};

/**
 * crea un nuevo voluntariado
 * @param {Object} req - request con datos del voluntariado en body
 * @param {Object} res - response de express
 * @returns {Object} json con voluntariado creado
 */
export const crearVoluntariado = async (req, res) => {
    try {
        const { titulo, email, fecha, descripcion, tipo } = req.body;
        
        // validar datos obligatorios
        if (!titulo || !email || !fecha || !descripcion || !tipo) {
            return res.status(400).json({
                ok: false,
                mensaje: 'faltan datos obligatorios'
            });
        }
        
        // validar tipo
        if (tipo !== 'Oferta' && tipo !== 'Petición') {
            return res.status(400).json({
                ok: false,
                mensaje: 'el tipo debe ser oferta o peticion'
            });
        }
        
        if (usarMongoDB()) {
            const db = getDB();
            
            // obtener ultimo id
            const ultimoVoluntariado = await db.collection('voluntariados').find().sort({ id: -1 }).limit(1).toArray();
            const nuevoId = ultimoVoluntariado.length > 0 ? ultimoVoluntariado[0].id + 1 : 1;
            
            // crear voluntariado
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
            
            res.status(201).json({
                ok: true,
                mensaje: 'voluntariado creado correctamente',
                voluntariado: {
                    id: nuevoId,
                    titulo,
                    email,
                    fecha,
                    descripcion,
                    tipo
                }
            });
        } else {
            // crear voluntariado
            const nuevoVoluntariado = {
                id: memoryDB.nextVoluntariadoId(),
                titulo,
                email,
                fecha,
                descripcion,
                tipo
            };
            
            memoryDB.voluntariados.push(nuevoVoluntariado);
            
            res.status(201).json({
                ok: true,
                mensaje: 'voluntariado creado correctamente',
                voluntariado: nuevoVoluntariado
            });
        }
    } catch (error) {
        res.status(500).json({
            ok: false,
            mensaje: 'error al crear voluntariado',
            error: error.message
        });
    }
};

/**
 * elimina un voluntariado por su id
 * @param {Object} req - request con id en params
 * @param {Object} res - response de express
 * @returns {Object} json confirmando la eliminacion
 */
export const borrarVoluntariado = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        
        if (usarMongoDB()) {
            const db = getDB();
            const result = await db.collection('voluntariados').deleteOne({ id });
            
            if (result.deletedCount === 0) {
                return res.status(404).json({
                    ok: false,
                    mensaje: 'voluntariado no encontrado'
                });
            }
            
            res.json({
                ok: true,
                mensaje: 'voluntariado eliminado correctamente'
            });
        } else {
            const index = memoryDB.voluntariados.findIndex(v => v.id === id);
            
            if (index === -1) {
                return res.status(404).json({
                    ok: false,
                    mensaje: 'voluntariado no encontrado'
                });
            }
            
            const voluntariadoEliminado = memoryDB.voluntariados.splice(index, 1)[0];
            
            res.json({
                ok: true,
                mensaje: 'voluntariado eliminado correctamente',
                voluntariado: voluntariadoEliminado
            });
        }
    } catch (error) {
        res.status(500).json({
            ok: false,
            mensaje: 'error al borrar voluntariado',
            error: error.message
        });
    }
};

/**
 * obtiene voluntariados filtrados por tipo
 * @param {Object} req - request con tipo en query (oferta/peticion)
 * @param {Object} res - response de express
 * @returns {Object} json con voluntariados filtrados
 */
export const obtenerVoluntariadosPorTipo = async (req, res) => {
    try {
        const { tipo } = req.query;
        
        if (!tipo) {
            return res.status(400).json({
                ok: false,
                mensaje: 'debes especificar el tipo (oferta o peticion)'
            });
        }
        
        if (usarMongoDB()) {
            const db = getDB();
            const voluntariados = await db.collection('voluntariados').find({ tipo }).toArray();
            
            res.json({
                ok: true,
                total: voluntariados.length,
                tipo,
                voluntariados: voluntariados.map(v => ({
                    id: v.id,
                    titulo: v.titulo,
                    email: v.email,
                    fecha: v.fecha,
                    descripcion: v.descripcion,
                    tipo: v.tipo
                }))
            });
        } else {
            const voluntariados = memoryDB.voluntariados.filter(v => v.tipo === tipo);
            
            res.json({
                ok: true,
                total: voluntariados.length,
                tipo,
                voluntariados
            });
        }
    } catch (error) {
        res.status(500).json({
            ok: false,
            mensaje: 'error al filtrar voluntariados',
            error: error.message
        });
    }
};