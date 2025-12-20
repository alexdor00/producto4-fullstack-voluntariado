


// Importacioens
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createApolloServer, getGraphQLMiddleware } from './graphql/apolloServer.js';
import { connectDB } from './config/database.js';
import usuariosRoutes from './routes/usuariosRoutes.js';
import voluntariadosRoutes from './routes/voluntariadosRoutes.js';


// Configuración inicial

const app = express();
const PORT = process.env.PORT || 4000;

// MIDDLEWARES GLOBALES
app.use(cors());
app.use(express.json());

// RUTA DE BIENVENIDA
app.get('/', (req, res) => {
    res.json({ 
        mensaje: 'API de Voluntariados - Backend con GraphQL y MongoDB',
        version: '3.0.0',
        endpoints: {
            graphql: '/graphql',
            rest_usuarios: '/api/usuarios',
            rest_voluntariados: '/api/voluntariados'
        },
        database: 'MongoDB Atlas',
        info: 'Usa /graphql para consultas GraphQL (recomendado)'
    });
});

// FUNCION PRINCIPAL - INICIAR SERVIDOR
async function startServer() {
    try {
        // Paso 1: Conectar a MongoDB
        console.log('[INICIO] Conectando a MongoDB Atlas...');
        await connectDB();
        
        // Paso 2: Crear servidor Apollo GraphQL
        console.log('[INICIO] Creando servidor Apollo GraphQL...');
        const apolloServer = await createApolloServer();
        
        // Paso 3: Integrar GraphQL con Express
        app.use('/graphql', getGraphQLMiddleware(apolloServer));
        
        // Paso 4: Rutas REST (mantenemos para compatibilidad)
        app.use('/api/usuarios', usuariosRoutes);
        app.use('/api/voluntariados', voluntariadosRoutes);
        
        // Paso 5: Ruta 404 - No encontrada
        app.use((req, res) => {
            res.status(404).json({
                ok: false,
                mensaje: 'Endpoint no encontrado',
                ruta: req.url
            });
        });
        
        // Paso 6: Manejo global de errores
        app.use((err, req, res, next) => {
            console.error('[ERROR]', err);
            res.status(500).json({
                ok: false,
                mensaje: 'Error interno del servidor',
                error: err.message
            });
        });
        
        // Paso 7: Iniciar servidor Express
        app.listen(PORT, () => {
            console.log('SERVIDOR INICIADO CORRECTAMENTE');
            console.log('URL Base: http://localhost:' + PORT);
            console.log('Base de datos: MongoDB Atlas');
            console.log('ENDPOINTS DISPONIBLES:');
            console.log('GraphQL API: http://localhost:' + PORT + '/graphql');
            console.log('REST Usuarios: http://localhost:' + PORT + '/api/usuarios');
            console.log('REST Voluntariados: http://localhost:' + PORT + '/api/voluntariados');
        });
        
    } catch (error) {
        console.error('[ERROR FATAL] No se pudo iniciar el servidor:', error.message);
        console.error('Detalles:', error);
        process.exit(1);
    }
}

// Ejecucuión
startServer();