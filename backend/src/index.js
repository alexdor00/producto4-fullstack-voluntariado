// src/index.js

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { createApolloServer, getGraphQLMiddleware } from './graphql/apolloServer.js';
import { connectDB } from './config/database.js';
import { initializeSocket } from './sockets/socketHandler.js';
import usuariosRoutes from './routes/usuariosRoutes.js';
import voluntariadosRoutes from './routes/voluntariadosRoutes.js';

const app = express();
const PORT = process.env.PORT || 4000;

// crear servidor http (necesario para socket.io)
const httpServer = createServer(app);

// middlewares
app.use(cors());
app.use(express.json());

// ruta principal
app.get('/', (req, res) => {
    res.json({ 
        mensaje: 'api de voluntariados - backend con graphql, mongodb y websockets',
        version: '4.0.0',
        endpoints: {
            graphql: '/graphql',
            rest_usuarios: '/api/usuarios',
            rest_voluntariados: '/api/voluntariados',
            websocket: 'socket.io habilitado'
        },
        database: 'mongodb atlas',
        features: ['graphql', 'rest api', 'websockets', 'mongoose', 'roles'],
        info: 'usa /graphql para consultas graphql'
    });
});

// iniciar servidor
async function startServer() {
    try {
        // conectar a mongodb
        console.log('[inicio] conectando a mongodb atlas...');
        await connectDB();
        
        // inicializar websockets
        console.log('[inicio] inicializando websockets...');
        initializeSocket(httpServer);
        
        // crear servidor apollo graphql
        console.log('[inicio] creando servidor apollo graphql...');
        const apolloServer = await createApolloServer();
        
        // integrar graphql con express
        app.use('/graphql', getGraphQLMiddleware(apolloServer));
        
        // rutas rest
        app.use('/api/usuarios', usuariosRoutes);
        app.use('/api/voluntariados', voluntariadosRoutes);
        
        // ruta 404
        app.use((req, res) => {
            res.status(404).json({
                ok: false,
                mensaje: 'endpoint no encontrado',
                ruta: req.url
            });
        });
        
        // manejo de errores
        app.use((err, req, res, next) => {
            console.error('[error]', err);
            res.status(500).json({
                ok: false,
                mensaje: 'error interno del servidor',
                error: err.message
            });
        });
        
        // iniciar servidor
        httpServer.listen(PORT, () => {
            console.log('');
            console.log('════════════════════════════════════════════════');
            console.log('  SERVIDOR INICIADO CORRECTAMENTE');
            console.log('════════════════════════════════════════════════');
            console.log('');
            console.log('url base: http://localhost:' + PORT);
            console.log('base de datos: mongodb atlas');
            console.log('');
            console.log('endpoints:');
            console.log('  - graphql: http://localhost:' + PORT + '/graphql');
            console.log('  - rest usuarios: http://localhost:' + PORT + '/api/usuarios');
            console.log('  - rest voluntariados: http://localhost:' + PORT + '/api/voluntariados');
            console.log('  - websocket: socket.io habilitado');
            console.log('');
            console.log('features: mongoose, graphql, websockets, roles');
            console.log('');
        });
        
    } catch (error) {
        console.error('[error fatal] no se pudo iniciar el servidor:', error.message);
        console.error('detalles:', error);
        process.exit(1);
    }
}

startServer();