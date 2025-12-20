// src/graphql/typeDefs.js

/**
 * definicion de tipos y esquema de graphql
 * los types corresponden a los objetos del producto 2
 */

export const typeDefs = `#graphql

  # tipo usuario - representa un usuario del sistema
  type Usuario {
    id: Int!
    nombre: String!
    email: String!
    password: String!
    rol: String!
  }

  # tipo voluntariado - representa una oferta o peticion de voluntariado
  type Voluntariado {
    id: Int!
    titulo: String!
    email: String!
    fecha: String!
    descripcion: String!
    tipo: String!
  }

  # respuesta generica para operaciones
  type Respuesta {
    ok: Boolean!
    mensaje: String!
  }

  # respuesta de login con datos del usuario y token jwt
  type RespuestaLogin {
    ok: Boolean!
    mensaje: String!
    token: String
    usuario: Usuario
  }

  # queries - operaciones de lectura (select)
  type Query {
    # usuarios
    obtenerUsuarios: [Usuario!]!
    obtenerUsuario(email: String!): Usuario
    
    # voluntariados
    obtenerVoluntariados: [Voluntariado!]!
    obtenerVoluntariado(id: Int!): Voluntariado
    obtenerVoluntariadosPorTipo(tipo: String!): [Voluntariado!]!
  }

  # mutations - operaciones de escritura (insert, update, delete)
  type Mutation {
    # usuarios
    crearUsuario(
      nombre: String!
      email: String!
      password: String!
      rol: String
    ): Usuario!
    
    borrarUsuario(email: String!): Respuesta!
    
    loginUsuario(email: String!, password: String!): RespuestaLogin!
    
    # voluntariados
    crearVoluntariado(
      titulo: String!
      email: String!
      fecha: String!
      descripcion: String!
      tipo: String!
    ): Voluntariado!
    
    borrarVoluntariado(id: Int!): Respuesta!
    
    actualizarVoluntariado(
      id: Int!
      titulo: String
      email: String
      fecha: String
      descripcion: String
      tipo: String
    ): Voluntariado!
  }
`;