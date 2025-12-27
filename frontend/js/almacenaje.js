// CONFIGURACION GLOBAL

// url del servidor graphql
const API_URL = 'http://localhost:4000/graphql';

// token jwt del usuario actual
let token = localStorage.getItem('token') || null;

// conexion websocket global
let socket = null;

// SISTEMA DE CACHE

// almacen de cache en memoria
const cache = new Map();

// tiempo que los datos se consideran validos: 5 minutos
const CACHE_DURACION = 5 * 60 * 1000;

// guarda datos en la cache con timestamp
function guardarEnCache(clave, datos) {
    cache.set(clave, {
        datos,
        timestamp: Date.now()
    });
}

// recupera datos de la cache si aun son validos
function obtenerDeCache(clave) {
    const entrada = cache.get(clave);
    if (!entrada) return null;
    
    // calcular cuanto tiempo llevan los datos en cache
    const edad = Date.now() - entrada.timestamp;
    
    // si pasaron mas de 5 minutos, borrar y pedir de nuevo
    if (edad > CACHE_DURACION) {
        cache.delete(clave);
        return null;
    }
    
    console.log(`[cache] usando datos cacheados: ${clave}`);
    return entrada.datos;
}

// limpia entradas de la cache
function limpiarCache(patron) {
    if (patron) {
        // limpiar solo claves que contengan el patron
        for (const clave of cache.keys()) {
            if (clave.includes(patron)) {
                cache.delete(clave);
            }
        }
    } else {
        // limpiar toda la cache
        cache.clear();
    }
}

// WEBSOCKET CON RECONEXION AUTOMATICA

// contador de intentos de reconexion
let intentosReconexion = 0;

// maximo de intentos antes de rendirse
const MAX_INTENTOS_RECONEXION = 5;

// temporizador para intentos de reconexion
let intervaloReconexion = null;

// inicializa la conexion websocket con el servidor
function inicializarWebSocket() {
    // evitar conexiones duplicadas
    if (socket?.connected) {
        console.log('[websocket] ya conectado');
        return;
    }
    
    // crear conexion con opciones de reconexion
    socket = io('http://localhost:4000', {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: MAX_INTENTOS_RECONEXION
    });
    
    // evento: conexion establecida
    socket.on('connect', () => {
        console.log('[websocket] conectado:', socket.id);
        intentosReconexion = 0;
        
        // limpiar temporizador de reconexion manual si existia
        if (intervaloReconexion) {
            clearInterval(intervaloReconexion);
            intervaloReconexion = null;
        }
    });
    
    // evento: desconexion
    socket.on('disconnect', (razon) => {
        console.log('[websocket] desconectado:', razon);
        
        // si el servidor cerro la conexion, intentar reconectar
        if (razon === 'io server disconnect') {
            intentarReconexion();
        }
    });
    
    // evento: error de conexion
    socket.on('connect_error', (error) => {
        console.error('[websocket] error de conexion:', error.message);
        intentarReconexion();
    });
    
    // evento: reconexion exitosa
    socket.on('reconnect', (numeroIntento) => {
        console.log(`[websocket] reconectado tras ${numeroIntento} intentos`);
        // refrescar datos tras reconectar
        limpiarCache('voluntariados');
    });
    
    // evento: todos los intentos de reconexion fallaron
    socket.on('reconnect_failed', () => {
        console.error('[websocket] reconexion fallida tras multiples intentos');
    });
    
    // eventos de voluntariados en tiempo real
    
    // nuevo voluntariado creado
    socket.on('voluntariado_creado', (voluntariado) => {
        console.log('[websocket] nuevo voluntariado:', voluntariado.titulo);
        limpiarCache('voluntariados');
        window.dispatchEvent(new CustomEvent('voluntariado-creado', { 
            detail: voluntariado 
        }));
    });
    
    // voluntariado actualizado
    socket.on('voluntariado_actualizado', (voluntariado) => {
        console.log('[websocket] voluntariado actualizado:', voluntariado.id);
        limpiarCache('voluntariados');
        window.dispatchEvent(new CustomEvent('voluntariado-actualizado', { 
            detail: voluntariado 
        }));
    });
    
    // voluntariado eliminado
    socket.on('voluntariado_eliminado', (data) => {
        console.log('[websocket] voluntariado eliminado:', data.id);
        limpiarCache('voluntariados');
        window.dispatchEvent(new CustomEvent('voluntariado-eliminado', { 
            detail: data 
        }));
    });
}

// intenta reconectar el websocket manualmente
function intentarReconexion() {
    // evitar multiples temporizadores
    if (intervaloReconexion) return;
    
    // si ya se intento muchas veces, rendirse
    if (intentosReconexion >= MAX_INTENTOS_RECONEXION) {
        console.error('[websocket] maximos intentos de reconexion alcanzados');
        return;
    }
    
    // intentar reconectar cada 2 segundos
    intervaloReconexion = setInterval(() => {
        intentosReconexion++;
        console.log(`[websocket] intento de reconexion ${intentosReconexion}/${MAX_INTENTOS_RECONEXION}`);
        
        if (socket) {
            socket.connect();
        } else {
            inicializarWebSocket();
        }
        
        // si se conecto o se agotaron intentos, parar
        if (socket?.connected || intentosReconexion >= MAX_INTENTOS_RECONEXION) {
            clearInterval(intervaloReconexion);
            intervaloReconexion = null;
        }
    }, 2000);
}

// FETCH CON RETRY AUTOMATICO

// hace peticiones graphql con reintento automatico si falla
async function consultarGraphQL(query, variables = {}, intentos = 3) {
    try {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        // añadir token si el usuario esta logueado
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ query, variables })
        });
        
        // verificar que la respuesta sea correcta
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const resultado = await response.json();
        
        // manejar errores de graphql
        if (resultado.errors) {
            console.error('[graphql] error:', resultado.errors);
            throw new Error(resultado.errors[0].message);
        }
        
        return resultado.data;
        
    } catch (error) {
        console.error('[fetch] error:', error);
        
        // si quedan intentos, reintentar tras 1 segundo
        if (intentos > 1) {
            console.log(`[fetch] reintentando... (${4 - intentos}/3)`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            return consultarGraphQL(query, variables, intentos - 1);
        }
        
        // si ya no quedan intentos, lanzar error
        throw error;
    }
}

// FUNCIONES DE USUARIOS

// obtiene la lista de todos los usuarios (solo admin)
export async function obtenerUsuarios() {
    try {
        // intentar obtener de cache primero
        const cacheKey = 'usuarios_lista';
        const datosCacheados = obtenerDeCache(cacheKey);
        if (datosCacheados) return datosCacheados;
        
        const query = `
            query {
                obtenerUsuarios {
                    id
                    nombre
                    email
                    rol
                }
            }
        `;
        
        const data = await consultarGraphQL(query);
        const usuarios = data.obtenerUsuarios || [];
        
        // guardar en cache para proximas peticiones
        guardarEnCache(cacheKey, usuarios);
        return usuarios;
        
    } catch (error) {
        console.error('[usuarios] error al obtener:', error);
        return [];
    }
}

// recupera el usuario activo del localstorage
export function obtenerUsuarioActivo() {
    const usuarioGuardado = localStorage.getItem('usuarioActivo');
    const tokenGuardado = localStorage.getItem('token');
    
    // restaurar token y websocket si hay usuario guardado
    if (usuarioGuardado && tokenGuardado) {
        token = tokenGuardado;
        
        // inicializar websocket si no esta conectado
        if (!socket || !socket.connected) {
            inicializarWebSocket();
        }
    }
    
    return usuarioGuardado ? JSON.parse(usuarioGuardado) : null;
}

// crea un nuevo usuario (solo admin)
export async function crearUsuario(usuario) {
    try {
        const query = `
            mutation CrearUsuario($nombre: String!, $email: String!, $password: String!, $rol: String) {
                crearUsuario(nombre: $nombre, email: $email, password: $password, rol: $rol) {
                    id
                    nombre
                    email
                    rol
                }
            }
        `;
        
        const variables = {
            nombre: usuario.nombre.toUpperCase(),
            email: usuario.email,
            password: usuario.password,
            rol: usuario.rol || 'usuario'
        };
        
        const data = await consultarGraphQL(query, variables);
        
        // limpiar cache de usuarios para que se vuelvan a pedir
        limpiarCache('usuarios');
        
        console.log('[usuarios] usuario creado:', data.crearUsuario.email);
        return { ok: true, usuario: data.crearUsuario };
        
    } catch (error) {
        console.error('[usuarios] error al crear:', error);
        return { ok: false, error: error.message };
    }
}

// elimina un usuario por email (solo admin)
export async function borrarUsuario(email) {
    try {
        const query = `
            mutation BorrarUsuario($email: String!) {
                borrarUsuario(email: $email) {
                    ok
                    mensaje
                }
            }
        `;
        
        const data = await consultarGraphQL(query, { email });
        
        // limpiar cache de usuarios
        limpiarCache('usuarios');
        
        console.log('[usuarios] usuario borrado:', email);
        return { ok: true };
        
    } catch (error) {
        console.error('[usuarios] error al borrar:', error);
        return { ok: false, error: error.message };
    }
}

// actualiza datos de un usuario (no implementado en backend)
export async function actualizarUsuario(email, datosNuevos) {
    try {
        console.warn('[usuarios] actualizar usuario no implementado en backend');
        return { ok: false, error: 'funcion no disponible' };
        
    } catch (error) {
        console.error('[usuarios] error al actualizar:', error);
        return { ok: false, error: error.message };
    }
}

// inicia sesion con email y password
export async function loguearUsuario(email, password) {
    try {
        const query = `
            mutation Login($email: String!, $password: String!) {
                loginUsuario(email: $email, password: $password) {
                    ok
                    mensaje
                    token
                    usuario {
                        id
                        nombre
                        email
                        rol
                    }
                }
            }
        `;
        
        const data = await consultarGraphQL(query, { email, password });
        const resultado = data.loginUsuario;
        
        // verificar si el login fue exitoso
        if (!resultado.ok) {
            return { ok: false, error: resultado.mensaje };
        }
        
        // guardar token en variable global y localstorage
        token = resultado.token;
        localStorage.setItem('token', token);
        
        // guardar datos del usuario
        localStorage.setItem('usuarioActivo', JSON.stringify(resultado.usuario));
        
        // inicializar websocket tras login
        inicializarWebSocket();
        
        console.log('[usuarios] login exitoso:', resultado.usuario.nombre);
        return { ok: true, user: resultado.usuario };
        
    } catch (error) {
        console.error('[usuarios] error en login:', error);
        return { ok: false, error: error.message };
    }
}

// cierra sesion y limpia datos
export function cerrarSesion() {
    // limpiar token
    token = null;
    localStorage.removeItem('token');
    localStorage.removeItem('usuarioActivo');
    
    // desconectar websocket
    if (socket) {
        socket.disconnect();
        socket = null;
    }
    
    // limpiar toda la cache
    limpiarCache();
    
    console.log('[usuarios] sesion cerrada');
}

// FUNCIONES DE VOLUNTARIADOS
// inicializa la base de datos (compatibilidad)
export async function inicializarDB() {
    console.log('[voluntariados] usando backend graphql');
    inicializarWebSocket();
    return Promise.resolve();
}

// crea un nuevo voluntariado
export async function crearVoluntariado(voluntariado) {
    try {
        const query = `
            mutation CrearVoluntariado(
                $titulo: String!
                $email: String!
                $fecha: String!
                $descripcion: String!
                $tipo: String!
            ) {
                crearVoluntariado(
                    titulo: $titulo
                    email: $email
                    fecha: $fecha
                    descripcion: $descripcion
                    tipo: $tipo
                ) {
                    id
                    titulo
                    email
                    fecha
                    descripcion
                    tipo
                }
            }
        `;
        
        const variables = {
            titulo: voluntariado.titulo.toUpperCase(),
            email: voluntariado.email,
            fecha: voluntariado.fecha,
            descripcion: voluntariado.descripcion.toUpperCase(),
            tipo: voluntariado.tipo
        };
        
        const data = await consultarGraphQL(query, variables);
        
        // limpiar cache de voluntariados
        limpiarCache('voluntariados');
        
        console.log('[voluntariados] creado:', data.crearVoluntariado.id);
        return { ok: true, id: data.crearVoluntariado.id };
        
    } catch (error) {
        console.error('[voluntariados] error al crear:', error);
        return { ok: false, error: error.message };
    }
}

// obtiene todos los voluntariados del usuario (o todos si es admin)
export async function obtenerVoluntariados() {
    try {
        // intentar obtener de cache primero
        const cacheKey = 'voluntariados_lista';
        const datosCacheados = obtenerDeCache(cacheKey);
        if (datosCacheados) return datosCacheados;
        
        const query = `
            query {
                obtenerVoluntariados {
                    id
                    titulo
                    email
                    fecha
                    descripcion
                    tipo
                }
            }
        `;
        
        const data = await consultarGraphQL(query);
        const voluntariados = data.obtenerVoluntariados || [];
        
        // guardar en cache
        guardarEnCache(cacheKey, voluntariados);
        
        console.log('[voluntariados] obtenidos:', voluntariados.length);
        return voluntariados;
        
    } catch (error) {
        console.error('[voluntariados] error al obtener:', error);
        return [];
    }
}

// elimina un voluntariado por id
export async function borrarVoluntariado(id) {
    try {
        const query = `
            mutation BorrarVoluntariado($id: Int!) {
                borrarVoluntariado(id: $id) {
                    ok
                    mensaje
                }
            }
        `;
        
        const data = await consultarGraphQL(query, { id: parseInt(id) });
        
        // limpiar cache
        limpiarCache('voluntariados');
        
        console.log('[voluntariados] borrado:', id);
        return { ok: true };
        
    } catch (error) {
        console.error('[voluntariados] error al borrar:', error);
        return { ok: false, error: error.message };
    }
}

// actualiza datos de un voluntariado
export async function actualizarVoluntariado(id, datos) {
    try {
        const query = `
            mutation ActualizarVoluntariado(
                $id: Int!
                $titulo: String
                $email: String
                $fecha: String
                $descripcion: String
                $tipo: String
            ) {
                actualizarVoluntariado(
                    id: $id
                    titulo: $titulo
                    email: $email
                    fecha: $fecha
                    descripcion: $descripcion
                    tipo: $tipo
                ) {
                    id
                    titulo
                    email
                    fecha
                    descripcion
                    tipo
                }
            }
        `;
        
        const variables = {
            id: parseInt(id),
            ...datos
        };
        
        const data = await consultarGraphQL(query, variables);
        
        // limpiar cache
        limpiarCache('voluntariados');
        
        console.log('[voluntariados] actualizado:', id);
        return { ok: true, voluntariado: data.actualizarVoluntariado };
        
    } catch (error) {
        console.error('[voluntariados] error al actualizar:', error);
        return { ok: false, error: error.message };
    }
}

// inicializa datos de ejemplo (no necesario, datos en mongodb)
export async function inicializarVoluntariadosEjemplo() {
    console.log('[voluntariados] datos iniciales en mongodb');
}

// FUNCIONES DE DASHBOARD

// guarda la seleccion de voluntariados en localstorage
export async function guardarSeleccion(voluntariadosSeleccionados) {
    try {
        localStorage.setItem('seleccion', JSON.stringify(voluntariadosSeleccionados));
        console.log('[dashboard] seleccion guardada:', voluntariadosSeleccionados.length);
        return { ok: true };
    } catch (error) {
        console.error('[dashboard] error al guardar seleccion:', error);
        return { ok: false, error: error.message };
    }
}

// recupera la seleccion guardada
export async function obtenerSeleccion() {
    try {
        const seleccion = localStorage.getItem('seleccion');
        const items = seleccion ? JSON.parse(seleccion) : [];
        console.log('[dashboard] seleccion obtenida:', items.length);
        return items;
    } catch (error) {
        console.error('[dashboard] error al obtener seleccion:', error);
        return [];
    }
}

// exportacion centralizada de todas las funciones
export const almacenaje = {
    obtenerUsuarios,
    obtenerUsuarioActivo,
    crearUsuario,
    borrarUsuario,
    actualizarUsuario,
    loguearUsuario,
    cerrarSesion,
    inicializarDB,
    crearVoluntariado,
    obtenerVoluntariados,
    borrarVoluntariado,
    actualizarVoluntariado,
    inicializarVoluntariadosEjemplo,
    guardarSeleccion,
    obtenerSeleccion
};