Producto 4 - Aplicación Fullstack para Gestión de Voluntariados
Descripción General
Este proyecto es una aplicación web completa desarrollada para la gestión de voluntariados de cuidado animal. Combina un frontend desarrollado en JavaScript vanilla con un backend robusto basado en Node.js, Express, GraphQL y MongoDB Atlas. La aplicación implementa un sistema de autenticación con roles, comunicaciones en tiempo real mediante WebSockets y una arquitectura moderna cliente-servidor.
El sistema permite a los usuarios registrar, consultar, modificar y eliminar voluntariados de dos tipos: ofertas (servicios que ofrecen) y peticiones (servicios que necesitan). Los administradores tienen acceso completo al sistema, mientras que los usuarios normales solo pueden gestionar sus propios voluntariados.
Tecnologías Utilizadas
Frontend

JavaScript Vanilla (ES6+)
HTML5 y CSS3
Bootstrap 5.3.0
Socket.io Client 4.5.4
Fetch API para comunicación con el backend

Backend

Node.js 20+
Express.js 4.18.2
Apollo Server 4.10.0 (GraphQL)
Mongoose 8.0.0 (ODM para MongoDB)
Socket.io 4.7.0
JSON Web Tokens 9.0.3
Bcrypt 5.1.1
CORS 2.8.5

Base de Datos

MongoDB Atlas (Cloud)

Arquitectura del Sistema
La aplicación sigue una arquitectura cliente-servidor con las siguientes capas:

Capa de Presentación (Frontend): Interfaz de usuario desarrollada en JavaScript vanilla que consume la API GraphQL y establece conexiones WebSocket.
Capa de Aplicación (Backend): Servidor Express que integra Apollo Server para GraphQL y Socket.io para comunicaciones en tiempo real.
Capa de Acceso a Datos: Mongoose ODM que proporciona una capa de abstracción sobre MongoDB Atlas.
Capa de Persistencia: MongoDB Atlas como base de datos en la nube.

Estructura del Proyecto
producto4-fullstack-voluntariado/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js           # Configuración conexión MongoDB
│   │   ├── models/
│   │   │   ├── Usuario.js             # Schema Mongoose usuarios
│   │   │   └── Voluntariado.js        # Schema Mongoose voluntariados
│   │   ├── graphql/
│   │   │   ├── typeDefs.js            # Definición schemas GraphQL
│   │   │   ├── resolvers.js           # Lógica queries y mutations
│   │   │   └── apolloServer.js        # Configuración Apollo Server
│   │   ├── middleware/
│   │   │   └── auth.js                # Middleware autenticación JWT
│   │   ├── sockets/
│   │   │   └── socketHandler.js       # Configuración Socket.io
│   │   ├── utils/
│   │   │   └── jwt.js                 # Funciones generación/verificación tokens
│   │   ├── routes/
│   │   │   ├── usuariosRoutes.js      # Rutas REST usuarios
│   │   │   └── voluntariadosRoutes.js # Rutas REST voluntariados
│   │   └── index.js                   # Punto entrada aplicación
│   ├── package.json
│   └── .env
├── frontend/
│   ├── css/
│   │   ├── common.css
│   │   ├── dashboard.css
│   │   ├── login.css
│   │   ├── usuarios.css
│   │   └── voluntariados.css
│   ├── js/
│   │   ├── almacenaje.js              # Gestión peticiones API y WebSocket
│   │   ├── dashboard.js               # Lógica dashboard principal
│   │   ├── login.js                   # Lógica autenticación
│   │   ├── usuarios.js                # Gestión usuarios (admin)
│   │   └── voluntariados.js           # CRUD voluntariados
│   ├── pages/
│   │   ├── login.html                 # Página de autenticación
│   │   ├── usuarios.html              # Gestión de usuarios
│   │   └── voluntariados.html         # Gestión de voluntariados
│   └── index.html                     # Dashboard principal
└── docs/
    ├── PROMPTS_IA.md                  # Documentación prompts IA
    └── mapa-conceptual.jpg            # Mapa conceptual del proyecto
Características Principales
Sistema de Autenticación
La aplicación implementa autenticación basada en JSON Web Tokens con las siguientes características:

Encriptación de contraseñas mediante bcrypt con 10 rounds de salt
Generación de tokens JWT con expiración de 24 horas
Almacenamiento del token en localStorage del navegador
Middleware de verificación en todas las rutas protegidas
Validación de credenciales contra base de datos MongoDB

El flujo de autenticación es el siguiente:

El usuario introduce sus credenciales en el formulario de login
El frontend envía una mutation GraphQL al backend
El backend verifica las credenciales usando bcrypt.compare
Si son válidas, genera un JWT firmado con el secreto del servidor
El frontend almacena el token en localStorage
Todas las peticiones subsiguientes incluyen el token en el header Authorization

Control de Acceso Basado en Roles
El sistema implementa dos roles con diferentes niveles de permisos:
Rol Usuario:

Visualiza únicamente sus propios voluntariados en el dashboard
Puede crear voluntariados solo asociados a su email
No tiene acceso a la gestión de usuarios
El campo email en formularios está bloqueado para prevenir modificaciones
Puede editar y eliminar únicamente sus propios voluntariados

Rol Administrador:

Acceso completo a todos los voluntariados del sistema
Puede crear voluntariados asociados a cualquier usuario
Acceso total a la gestión de usuarios (crear, editar, eliminar)
Campo email editable en formularios
Puede modificar o eliminar cualquier voluntariado

La verificación de roles se implementa en dos niveles:

Frontend: Oculta elementos de UI y bloquea campos según el rol (mejora UX)
Backend: Valida permisos en cada resolver GraphQL (garantiza seguridad)

El middleware verificarAuth puede recibir un parámetro booleano requiereAdmin que determina si la operación está restringida a administradores.
Comunicaciones en Tiempo Real
Socket.io permite actualizaciones instantáneas sin recargar la página mediante:
Eventos del servidor:

voluntariado:nuevo - Emitido cuando se crea un voluntariado
voluntariado:actualizado - Emitido cuando se modifica un voluntariado
voluntariado:eliminado - Emitido cuando se elimina un voluntariado

Comportamiento del cliente:

Establece conexión WebSocket al cargar el dashboard
Escucha eventos del servidor en segundo plano
Actualiza automáticamente la interfaz cuando recibe eventos
Mantiene sincronizados múltiples navegadores/pestañas del mismo usuario

El flujo de actualización en tiempo real:

Usuario A crea un voluntariado desde el formulario
Frontend envía mutation GraphQL al backend
Backend guarda el voluntariado en MongoDB
Backend emite evento voluntariado:nuevo vía Socket.io
Todos los clientes conectados (incluyendo otros usuarios) reciben el evento
Los clientes actualizan su UI automáticamente sin intervención manual

Seguridad Implementada
Encriptación de Contraseñas:
Las contraseñas nunca se almacenan en texto plano. El modelo Usuario de Mongoose incluye un hook pre-save que hashea automáticamente la contraseña antes de guardarla en la base de datos:
usuarioSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});
Validación de Entrada:

Mongoose proporciona validación de esquemas (tipos, required, unique)
GraphQL valida tipos y estructura de queries/mutations
Los resolvers implementan validación de lógica de negocio
Sanitización de entrada para prevenir inyección

Protección de Rutas:

Todas las operaciones CRUD requieren token JWT válido
El middleware verifica la firma y expiración del token
Queries/mutations protegidas verifican rol del usuario
Frontend oculta rutas no autorizadas (control adicional de UX)

CORS Configurado:

Express tiene CORS habilitado para permitir peticiones cross-origin
Configurado para aceptar solicitudes del frontend
Headers permitidos: Content-Type, Authorization

HTTPS Opcional:

El servidor puede ejecutarse con protocolo HTTPS
Soporte para certificados SSL/TLS
Encriptación de comunicaciones cliente-servidor

Instalación y Configuración
Requisitos Previos
Antes de comenzar, asegurarse de tener instalado:

Node.js versión 14 o superior
npm (incluido con Node.js)
Git para clonar el repositorio
Navegador web moderno (Chrome, Firefox, Edge)
Editor de código (recomendado Visual Studio Code)

Instalación del Backend

Clonar el repositorio:

 clone https://github.com/alexdor00/producto4-fullstack-voluntariado.git
cd producto4-fullstack-voluntariado

Navegar a la carpeta del backend:


Instalar dependencias:

Este comando instalará todas las dependencias especificadas en package.json, incluyendo Express, Apollo Server, Mongoose, Socket.io, bcrypt, jsonwebtoken y otras bibliotecas necesarias.

Configurar variables de entorno:

Crear un archivo .env en la carpeta backend con el siguiente contenido:
MONGODB_URI=mongodb+srv://admin:adminadmin123@cluster0.gg8lavx.mongodb.net/voluntariadosDB
JWT_SECRET=mi_secreto_super_seguro_2024
PORT=4000
USE_HTTPS=false
Nota: La cadena de conexión proporcionada es funcional para propósitos de evaluación y pruebas del proyecto.

Iniciar el servidor:

```

El servidor se iniciará en http://localhost:4000 y mostrará en la consola:
```
[inicio] conectando a mongodb atlas...
[mongodb] conexión exitosa a mongodb atlas
[inicio] inicializando websockets...
[socket.io] servidor de websockets inicializado
[inicio] creando servidor apollo graphql...
════════════════════════════════════════════════
  SERVIDOR INICIADO CORRECTAMENTE
════════════════════════════════════════════════

url base: http://localhost:4000
base de datos: mongodb atlas

endpoints:
  - graphql: http://localhost:4000/graphql
  - rest usuarios: http://localhost:4000/api/usuarios
  - rest voluntariados: http://localhost:4000/api/voluntariados
  - websocket: socket.io habilitado

features: mongoose, graphql, websockets, roles
Configuración del Frontend
El frontend no requiere instalación de dependencias ya que utiliza JavaScript vanilla. Sin embargo, debe servirse desde un servidor web para evitar problemas de CORS.
Opción 1 - Live Server en Visual Studio Code:

Instalar la extensión "Live Server" desde el marketplace de VS Code
Abrir la carpeta frontend en VS Code
Clic derecho sobre index.html
Seleccionar "Open with Live Server"
El navegador abrirá automáticamente en http://localhost:5500

Opción 2 - http-server con Node.js:
npx http-server -p 5500
Opción 3 - Servidor Python:
python -m http.server 5500
Una vez iniciado el servidor frontend, acceder a http://localhost:5500 en el navegador.
Uso de la Aplicación
Acceso Inicial
Al acceder a la aplicación por primera vez, el sistema redirige automáticamente a la página de login si no existe un token válido en localStorage.
Credenciales de Prueba
El sistema incluye usuarios de prueba con datos precargados:
Usuario Administrador:

Email: super@admin.com
Password: 123
Permisos: Acceso completo al sistema

Usuario Normal 1:

Email: L@A.U
Password: 123
Voluntariados: 1 de tipo Oferta

Usuario Normal 2:

Email: M@R.C
Password: 123
Voluntariados: 1 de tipo Petición

Usuario Normal 3:

Email: S@O.N
Password: 123
Voluntariados: 1 de tipo Petición

Flujo de Trabajo - Usuario Normal

Autenticación:

Acceder a http://localhost:5500
Introducir credenciales de usuario normal (ejemplo: L@A.U / 123)
Presionar botón "INICIAR SESIÓN"
El sistema valida credenciales y redirige al dashboard


Visualización del Dashboard:

Se muestran únicamente los voluntariados propios del usuario
Las tarjetas tienen código de colores (verde para Oferta, azul para Petición)
Es posible filtrar por tipo usando los botones superiores
Las tarjetas son arrastrables a la zona de selección


Gestión de Voluntariados:

Navegar a "VOLUNTARIADOS" en el menú superior
El formulario muestra el campo email bloqueado con el email del usuario actual
Completar título, fecha, descripción y tipo
Presionar "DAR DE ALTA" para crear el voluntariado
El nuevo voluntariado aparece automáticamente en la tabla
Para editar: clic en botón editar de la tabla
Para eliminar: clic en botón eliminar (con confirmación)


Actualizaciones en Tiempo Real:

Si otro usuario crea/modifica/elimina un voluntariado visible
El dashboard se actualiza automáticamente sin recargar
Se pueden tener múltiples pestañas abiertas sincronizadas


Cerrar Sesión:

Clic en "CERRAR SESIÓN" en la esquina superior derecha
El sistema elimina el token de localStorage
Redirige automáticamente a la página de login



Flujo de Trabajo - Administrador

Autenticación:

Iniciar sesión con credenciales de administrador (super@admin.com / 123)


Dashboard Completo:

El dashboard muestra todos los voluntariados del sistema
No hay filtrado por usuario, se visualiza toda la información
Las funcionalidades de drag and drop y filtros funcionan igual


Gestión de Voluntariados:

Acceder a "VOLUNTARIADOS" en el menú
El campo email es editable, permitiendo crear voluntariados para cualquier usuario
Posibilidad de modificar cualquier voluntariado del sistema
Posibilidad de eliminar cualquier voluntariado


Gestión de Usuarios:

El menú incluye la opción "ALTA USUARIO" visible solo para administradores
Acceder a dicha sección para gestionar usuarios
Formulario para crear nuevos usuarios con nombre, email, password y rol
Tabla con todos los usuarios del sistema
Opciones para editar y eliminar usuarios existentes



Funcionalidades del Dashboard
Visualización de Tarjetas:

Cada voluntariado se presenta en una tarjeta con toda su información
Color verde para voluntariados tipo Oferta
Color azul para voluntariados tipo Petición
Información mostrada: título, descripción, fecha, email del publicador

Sistema Drag and Drop:

Las tarjetas son arrastrables con el ratón
Zona inferior designada para soltar voluntariados de interés
Los voluntariados soltados se marcan como seleccionados
Se pueden devolver al área principal arrastrándolos nuevamente

Filtros:

Botón "OFERTA" filtra solo voluntariados de tipo Oferta
Botón "PETICIÓN" filtra solo voluntariados de tipo Petición
Los botones activos se resaltan visualmente
Clic nuevamente en un botón activo elimina el filtro

Indicadores:

Esquina superior derecha muestra el usuario actualmente autenticado
Botón de cerrar sesión siempre visible cuando hay sesión activa

Pruebas con Postman
Configuración Inicial

Descargar e instalar Postman desde https://www.postman.com/downloads/
Crear una nueva colección llamada "Producto 4 - Voluntariados"
Crear variable de entorno:

Nombre: baseUrl
Valor: http://localhost:4000



Pruebas de Autenticación
Prueba 1: Login Exitoso
Configuración:

Método: POST
URL: {{baseUrl}}/graphql
Headers:

Content-Type: application/json


Body (raw, JSON):

json{
  "query": "mutation { login(email: \"super@admin.com\", password: \"123\") { token usuario { email rol } } }"
}
Resultado esperado:

Status: 200 OK
Cuerpo de respuesta:

json{
  "data": {
    "login": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "usuario": {
        "email": "super@admin.com",
        "rol": "admin"
      }
    }
  }
}
Copiar el token de la respuesta para utilizarlo en las siguientes pruebas.
Prueba 2: Login con Credenciales Incorrectas
Configuración:

Método: POST
URL: {{baseUrl}}/graphql
Headers:

Content-Type: application/json


Body (raw, JSON):

json{
  "query": "mutation { login(email: \"super@admin.com\", password: \"incorrecta\") { token usuario { email rol } } }"
}
Resultado esperado:

Status: 200 OK (GraphQL siempre devuelve 200)
Cuerpo de respuesta con error:

json{
  "errors": [
    {
      "message": "credenciales inválidas"
    }
  ]
}
Pruebas de Queries GraphQL
Prueba 3: Obtener Todos los Voluntariados (Admin)
Configuración:

Método: POST
URL: {{baseUrl}}/graphql
Headers:

Content-Type: application/json
Authorization: Bearer [TOKEN_DEL_LOGIN_ADMIN]


Body (raw, JSON):

json{
  "query": "query { obtenerVoluntariados { id titulo email fecha descripcion tipo } }"
}
Resultado esperado:

Status: 200 OK
Cuerpo con array de todos los voluntariados del sistema

Prueba 4: Obtener Voluntariados (Usuario Normal)
Configuración:

Método: POST
URL: {{baseUrl}}/graphql
Headers:

Content-Type: application/json
Authorization: Bearer [TOKEN_DEL_LOGIN_USUARIO_L@A.U]


Body (raw, JSON):

json{
  "query": "query { obtenerVoluntariados { id titulo email fecha descripcion tipo } }"
}
Resultado esperado:

Status: 200 OK
Cuerpo con array solo de voluntariados donde email sea "L@A.U"

Prueba 5: Obtener Usuarios (Admin)
Configuración:

Método: POST
URL: {{baseUrl}}/graphql
Headers:

Content-Type: application/json
Authorization: Bearer [TOKEN_ADMIN]


Body (raw, JSON):

json{
  "query": "query { obtenerUsuarios { id nombre email rol } }"
}
Resultado esperado:

Status: 200 OK
Array con todos los usuarios (sin campo password)

Prueba 6: Obtener Usuarios (Usuario Normal - Debe Fallar)
Configuración:

Método: POST
URL: {{baseUrl}}/graphql
Headers:

Content-Type: application/json
Authorization: Bearer [TOKEN_USUARIO_NORMAL]


Body (raw, JSON):

json{
  "query": "query { obtenerUsuarios { id nombre email rol } }"
}
Resultado esperado:

Status: 200 OK
Cuerpo con error:

json{
  "errors": [
    {
      "message": "acceso denegado: se requiere rol de administrador"
    }
  ]
}
Pruebas de Mutations GraphQL
Prueba 7: Crear Usuario (Admin)
Configuración:

Método: POST
URL: {{baseUrl}}/graphql
Headers:

Content-Type: application/json
Authorization: Bearer [TOKEN_ADMIN]


Body (raw, JSON):

json{
  "query": "mutation { crearUsuario(nombre: \"Usuario Prueba\", email: \"prueba@test.com\", password: \"123\", rol: \"usuario\") { id nombre email rol } }"
}
Resultado esperado:

Status: 200 OK
Objeto con datos del nuevo usuario (sin password)

Prueba 8: Crear Voluntariado (Usuario)
Configuración:

Método: POST
URL: {{baseUrl}}/graphql
Headers:

Content-Type: application/json
Authorization: Bearer [TOKEN_USUARIO_L@A.U]


Body (raw, JSON):

json{
  "query": "mutation { crearVoluntariado(titulo: \"Necesito transporte\", email: \"L@A.U\", fecha: \"2025-02-15\", descripcion: \"Transporte para gatos al veterinario\", tipo: \"Petición\") { id titulo email tipo } }"
}
Resultado esperado:

Status: 200 OK
Objeto con datos del voluntariado creado
Los clientes Socket.io conectados recibirán evento en tiempo real

Prueba 9: Crear Voluntariado con Email Ajeno (Usuario - Debe Fallar)
Configuración:

Método: POST
URL: {{baseUrl}}/graphql
Headers:

Content-Type: application/json
Authorization: Bearer [TOKEN_USUARIO_L@A.U]


Body (raw, JSON):

json{
  "query": "mutation { crearVoluntariado(titulo: \"Ofrezco consulta\", email: \"M@R.C\", fecha: \"2025-02-15\", descripcion: \"Consultas veterinarias\", tipo: \"Oferta\") { id titulo } }"
}
Resultado esperado:

Status: 200 OK
Error en respuesta:

json{
  "errors": [
    {
      "message": "solo puedes crear voluntariados con tu propio email"
    }
  ]
}
Prueba 10: Actualizar Voluntariado
Configuración:

Método: POST
URL: {{baseUrl}}/graphql
Headers:

Content-Type: application/json
Authorization: Bearer [TOKEN_USUARIO]


Body (raw, JSON):

json{
  "query": "mutation { actualizarVoluntariado(id: \"[ID_VOLUNTARIADO]\", titulo: \"Título actualizado\", descripcion: \"Descripción actualizada\") { id titulo descripcion } }"
}
Nota: Reemplazar [ID_VOLUNTARIADO] con un ID real obtenido de queries anteriores.
Resultado esperado:

Status: 200 OK
Objeto con datos actualizados
Evento WebSocket emitido a clientes

Prueba 11: Eliminar Voluntariado
Configuración:

Método: POST
URL: {{baseUrl}}/graphql
Headers:

Content-Type: application/json
Authorization: Bearer [TOKEN_USUARIO]


Body (raw, JSON):

json{
  "query": "mutation { eliminarVoluntariado(id: \"[ID_VOLUNTARIADO]\") { id titulo } }"
}
Resultado esperado:

Status: 200 OK
Objeto con datos del voluntariado eliminado
Evento WebSocket emitido a clientes

Pruebas de Seguridad
Prueba 12: Query sin Token
Configuración:

Método: POST
URL: {{baseUrl}}/graphql
Headers:

Content-Type: application/json
(SIN Authorization header)


Body (raw, JSON):

json{
  "query": "query { obtenerVoluntariados { id titulo } }"
}
Resultado esperado:

Error: "no autenticado - token no proporcionado"

Prueba 13: Query con Token Inválido
Configuración:

Método: POST
URL: {{baseUrl}}/graphql
Headers:

Content-Type: application/json
Authorization: Bearer token_invalido_123


Body (raw, JSON):

json{
  "query": "query { obtenerVoluntariados { id titulo } }"
}
Resultado esperado:

Error: "token inválido"

Verificación de WebSockets
Para verificar que los eventos WebSocket funcionan correctamente:

Abrir dos ventanas del navegador con el dashboard
En Postman, ejecutar una mutation de crear voluntariado
Observar que ambas ventanas del navegador se actualizan automáticamente
Verificar en la consola del navegador los mensajes de Socket.io

Base de Datos
Esquema de Datos
Colección: usuarios
{
  _id: ObjectId,
  nombre: String (required, min: 3),
  email: String (required, unique, lowercase),
  password: String (required, hashed with bcrypt),
  rol: String (required, enum: ['admin', 'usuario'])
}
Índices:

email: Índice único para garantizar unicidad
_id: Índice automático de MongoDB

Colección: voluntariados
{
  _id: ObjectId,
  titulo: String (required, min: 5),
  email: String (required),
  fecha: Date (required),
  descripcion: String (required, min: 10),
  tipo: String (required, enum: ['Oferta', 'Petición'])
}
Índices:

email: Índice para optimizar búsquedas por usuario
_id: Índice automático de MongoDB

Acceso a MongoDB Atlas
Para verificar los datos directamente en la base de datos:

Acceder a https://cloud.mongodb.com
Iniciar sesión con las credenciales del proyecto
Navegar a Clusters > Cluster0 > Collections
Seleccionar base de datos: voluntariadosDB
Explorar colecciones: usuarios y voluntariados

Consultas Útiles
Desde MongoDB Compass o el shell de mongo:
// Contar total de usuarios
db.usuarios.countDocuments()

// Listar todos los usuarios con sus roles
db.usuarios.find({}, {nombre: 1, email: 1, rol: 1})

// Verificar que las contraseñas están hasheadas
db.usuarios.findOne({}, {password: 1})

// Contar voluntariados por tipo
db.voluntariados.aggregate([
  {$group: {_id: "$tipo", total: {$sum: 1}}}
])

// Obtener voluntariados de un usuario específico
db.voluntariados.find({email: "L@A.U"})

// Listar todos los emails únicos en voluntariados
db.voluntariados.distinct("email")
API GraphQL
Schema Completo
Tipos:
type Usuario {
  id: ID!
  nombre: String!
  email: String!
  rol: String!
}

type Voluntariado {
  id: ID!
  titulo: String!
  email: String!
  fecha: String!
  descripcion: String!
  tipo: String!
}

type AuthPayload {
  token: String!
  usuario: Usuario!
}
Queries:
type Query {
  obtenerUsuarios: [Usuario!]!          # Requiere rol admin
  obtenerVoluntariados: [Voluntariado!]!  # Filtra por rol
}
Mutations:
type Mutation {
  login(email: String!, password: String!): AuthPayload!
  
  crearUsuario(
    nombre: String!
    email: String!
    password: String!
    rol: String!
  ): Usuario!
  
  actualizarUsuario(
    id: ID!
    nombre: String
    email: String
    password: String
    rol: String
  ): Usuario!
  
  eliminarUsuario(id: ID!): Usuario!
  
  crearVoluntariado(
    titulo: String!
    email: String!
    fecha: String!
    descripcion: String!
    tipo: String!
  ): Voluntariado!
  
  actualizarVoluntariado(
    id: ID!
    titulo: String
    descripcion: String
  ): Voluntariado!
  
  eliminarVoluntariado(id: ID!): Voluntariado!
}
Solución de Problemas
El servidor backend no inicia
Síntoma: Error al ejecutar npm run dev en la carpeta backend
Soluciones:

Verificar que Node.js está instalado: node --version
Verificar que las dependencias están instaladas: npm install
Comprobar que el archivo .env existe y tiene las variables correctas
Verificar que el puerto 4000 no está siendo usado por otra aplicación

Error de conexión a MongoDB
Síntoma: Mensaje "error al conectar a mongodb atlas" en consola
Soluciones:

Verificar conexión a internet
Comprobar que la cadena MONGODB_URI en .env es correcta
Verificar que la IP está en la whitelist de MongoDB Atlas
Comprobar credenciales de acceso a MongoDB

Error CORS en el frontend
Síntoma: Errores de CORS en la consola del navegador al hacer peticiones
Soluciones:

Verificar que el backend tiene CORS habilitado
Asegurarse de que el frontend se sirve desde un servidor (no file://)
Comprobar que las URLs en almacenaje.js apuntan a http://localhost:4000
Verificar que el backend está ejecutándose

Token inválido o expirado
Síntoma: Error "token inválido" o "token expirado" en peticiones autenticadas
Soluciones:

Hacer logout y volver a hacer login para obtener un token nuevo
Limpiar localStorage del navegador
Verificar que JWT_SECRET en .env coincide con el del token generado
Comprobar que el token se está enviando correctamente en headers

WebSocket no conecta
Síntoma: Actualizaciones en tiempo real no funcionan
Soluciones:

Verificar en consola del navegador si hay errores de Socket.io
Comprobar que el backend inicializó Socket.io correctamente
Verificar que la URL de conexión en almacenaje.js es correcta
Comprobar que no hay firewalls bloqueando WebSocket
Refrescar la página para reintentar la conexión

El dashboard no muestra voluntariados
Síntoma: El dashboard carga pero no muestra tarjetas
Soluciones:

Abrir consola del navegador y verificar errores
Comprobar que hay voluntariados en la base de datos
Verificar que el token es válido
Para usuarios normales, verificar que tienen voluntariados propios
Refrescar la página

El formulario no crea voluntariados
Síntoma: Al enviar el formulario no se crea el voluntariado
Soluciones:

Verificar en consola del navegador si hay errores
Comprobar que todos los campos están completos
Verificar que la fecha tiene formato correcto
Para usuarios normales, verificar que el email no fue modificado
Comprobar que el token no ha expirado

Información Adicional
Estructura de Tokens JWT
Los tokens JWT generados contienen:
{
  email: "usuario@ejemplo.com",
  rol: "usuario",
  iat: 1703001234,  // timestamp emisión
  exp: 1703087634   // timestamp expiración (24h después)
}
El token está firmado con el secreto definido en JWT_SECRET del archivo .env.
Variables de Entorno
El archivo .env debe contener:
envMONGODB_URI=mongodb+srv://admin:adminadmin123@cluster0.gg8lavx.mongodb.net/voluntariadosDB
JWT_SECRET=mi_secreto_super_seguro_2024
PORT=4000
USE_HTTPS=false
```

En producción se recomienda usar valores diferentes y más seguros para JWT_SECRET.

### Endpoints del Backend
```
GraphQL API:
  POST http://localhost:4000/graphql

REST API (legacy):
  GET/POST http://localhost:4000/api/usuarios
  GET/POST http://localhost:4000/api/voluntariados

WebSocket:
  ws://localhost:4000
Eventos WebSocket
El servidor emite los siguientes eventos:
// Al crear voluntariado
io.emit('voluntariado:nuevo', voluntariado)

// Al actualizar voluntariado
io.emit('voluntariado:actualizado', voluntariado)

// Al eliminar voluntariado
io.emit('voluntariado:eliminado', { id })
Los clientes deben escuchar estos eventos para actualizar la UI.
Licencia
Este proyecto es de uso académico y educativo.
