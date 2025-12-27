// configuracion del backend
const API_URL = 'http://localhost:4000/graphql';
let token = localStorage.getItem('token') || null;
let socket = null;

// inicializar websocket
function inicializarWebSocket() {
    if (socket) return;
    
    socket = io('http://localhost:4000');
    
    socket.on('connect', () => {
        console.log('[websocket] conectado:', socket.id);
    });
    
    socket.on('disconnect', () => {
        console.log('[websocket] desconectado');
    });
    
    // evento: voluntariado creado
    socket.on('voluntariado_creado', (voluntariado) => {
        console.log('[websocket] nuevo voluntariado:', voluntariado.titulo);
        // disparar evento personalizado para que las paginas lo escuchen
        window.dispatchEvent(new CustomEvent('voluntariado-creado', { 
            detail: voluntariado 
        }));
    });
    
    // evento: voluntariado actualizado
    socket.on('voluntariado_actualizado', (voluntariado) => {
        console.log('[websocket] voluntariado actualizado:', voluntariado.id);
        window.dispatchEvent(new CustomEvent('voluntariado-actualizado', { 
            detail: voluntariado 
        }));
    });
    
    // evento: voluntariado eliminado
    socket.on('voluntariado_eliminado', (data) => {
        console.log('[websocket] voluntariado eliminado:', data.id);
        window.dispatchEvent(new CustomEvent('voluntariado-eliminado', { 
            detail: data 
        }));
    });
}

// funcion auxiliar para graphql
async function consultarGraphQL(query, variables = {}) {
    try {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        // añadir token si existe
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ query, variables })
        });
        
        const resultado = await response.json();
        
        if (resultado.errors) {
            console.error('[graphql] error:', resultado.errors);
            throw new Error(resultado.errors[0].message);
        }
        
        return resultado.data;
        
    } catch (error) {
        console.error('[fetch] error:', error);
        throw error;
    }
}

// usuarios

export async function obtenerUsuarios() {
    try {
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
        return data.obtenerUsuarios || [];
        
    } catch (error) {
        console.error('[usuarios] error al obtener:', error);
        return [];
    }
}

export function obtenerUsuarioActivo() {
    const usuarioGuardado = localStorage.getItem('usuarioActivo');
    const tokenGuardado = localStorage.getItem('token');
    
    // si hay usuario y token, restaurar token global
    if (usuarioGuardado && tokenGuardado) {
        token = tokenGuardado;
        
        // inicializar websocket si no esta conectado
        if (!socket || !socket.connected) {
            inicializarWebSocket();
        }
    }
    
    return usuarioGuardado ? JSON.parse(usuarioGuardado) : null;
}

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
        
        console.log('[usuarios] usuario creado:', data.crearUsuario.email);
        return { ok: true, usuario: data.crearUsuario };
        
    } catch (error) {
        console.error('[usuarios] error al crear:', error);
        return { ok: false, error: error.message };
    }
}

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
        
        console.log('[usuarios] usuario borrado:', email);
        return { ok: true };
        
    } catch (error) {
        console.error('[usuarios] error al borrar:', error);
        return { ok: false, error: error.message };
    }
}

export async function actualizarUsuario(email, datosNuevos) {
    try {
        // por ahora no hay mutation de actualizar usuario en el backend
        // se podria implementar si es necesario
        console.warn('[usuarios] actualizar usuario no implementado en backend');
        return { ok: false, error: 'funcion no disponible' };
        
    } catch (error) {
        console.error('[usuarios] error al actualizar:', error);
        return { ok: false, error: error.message };
    }
}

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
        
        if (!resultado.ok) {
            return { ok: false, error: resultado.mensaje };
        }
        
        // guardar token
        token = resultado.token;
        localStorage.setItem('token', token);
        
        // guardar usuario activo
        localStorage.setItem('usuarioActivo', JSON.stringify(resultado.usuario));
        
        // inicializar websocket despues del login
        inicializarWebSocket();
        
        console.log('[usuarios] login exitoso:', resultado.usuario.nombre);
        return { ok: true, user: resultado.usuario };
        
    } catch (error) {
        console.error('[usuarios] error en login:', error);
        return { ok: false, error: error.message };
    }
}

export function cerrarSesion() {
    token = null;
    localStorage.removeItem('token');
    localStorage.removeItem('usuarioActivo');
    
    // desconectar websocket
    if (socket) {
        socket.disconnect();
        socket = null;
    }
    
    console.log('[usuarios] sesion cerrada');
}

// voluntariados

export async function inicializarDB() {
    // ya no se usa indexeddb, pero mantenemos la funcion para compatibilidad
    console.log('[voluntariados] usando backend graphql');
    inicializarWebSocket();
    return Promise.resolve();
}

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
        
        console.log('[voluntariados] creado:', data.crearVoluntariado.id);
        return { ok: true, id: data.crearVoluntariado.id };
        
    } catch (error) {
        console.error('[voluntariados] error al crear:', error);
        return { ok: false, error: error.message };
    }
}

export async function obtenerVoluntariados() {
    try {
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
        
        console.log('[voluntariados] obtenidos:', data.obtenerVoluntariados.length);
        return data.obtenerVoluntariados || [];
        
    } catch (error) {
        console.error('[voluntariados] error al obtener:', error);
        return [];
    }
}

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
        
        console.log('[voluntariados] borrado:', id);
        return { ok: true };
        
    } catch (error) {
        console.error('[voluntariados] error al borrar:', error);
        return { ok: false, error: error.message };
    }
}

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
        
        console.log('[voluntariados] actualizado:', id);
        return { ok: true, voluntariado: data.actualizarVoluntariado };
        
    } catch (error) {
        console.error('[voluntariados] error al actualizar:', error);
        return { ok: false, error: error.message };
    }
}

export async function inicializarVoluntariadosEjemplo() {
    // ya no es necesario inicializar datos de ejemplo
    // los datos estan en mongodb
    console.log('[voluntariados] datos iniciales en mongodb');
}

// dashboard - seleccion (mantener en localstorage)

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

// exportacion centralizada

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