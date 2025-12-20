// src/graphql/apolloServer.js

import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { typeDefs } from './typeDefs.js';
import { resolvers } from './resolvers.js';
import { verificarToken, extraerToken } from '../utils/jwt.js';

/**
 * configuracion y creacion del servidor apollo graphql
 * @returns {Object} servidor apollo configurado
 */
export async function createApolloServer() {
    const server = new ApolloServer({
        typeDefs,
        resolvers,
        introspection: true,
        formatError: (error) => {
            console.error('[graphql error]:', error.message);
            return {
                message: error.message,
                locations: error.locations,
                path: error.path,
            };
        }
    });
    
    await server.start();
    console.log('servidor apollo graphql iniciado');
    
    return server;
}

/**
 * obtiene el middleware de graphql para express
 * incluye context con usuario autenticado desde jwt
 * @param {Object} server - servidor apollo
 * @returns {Function} middleware de express
 */
export function getGraphQLMiddleware(server) {
    return expressMiddleware(server, {
        context: async ({ req }) => {
            const token = extraerToken(req.headers.authorization);
            
            if (!token) {
                return { usuario: null };
            }
            
            try {
                const usuario = verificarToken(token);
                console.log('[auth jwt] usuario:', usuario.email, 'rol:', usuario.rol);
                return { usuario };
            } catch (error) {
                console.log('[auth jwt] token invalido');
                return { usuario: null };
            }
        }
    });
}