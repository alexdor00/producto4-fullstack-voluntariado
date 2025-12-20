// CONSTANTES GLOBALES
const USUARIOS_KEY = 'usuarios';           
const USUARIO_ACTIVO_KEY = 'usuarioActivo';
const VOLUNTARIADOS_DB = 'VoluntariadosDB';
const VOLUNTARIADOS_STORE = 'voluntariados';
const SELECCION_STORE = 'seleccion';

// SECCIÓN COMÚN - USUARIOS (localStorage)

function inicializarUsuarios() {
    const usuarios = obtenerUsuarios();
    
    if (usuarios.length === 0) {
        const usuariosIniciales = [
            { 
                nombre: 'LAURA',
                email: 'L@A.U',
                password: '123',
                rol: 'usuario'
            },
            { 
                nombre: 'MARCOS',
                email: 'M@R.C',
                password: '123',
                rol: 'usuario'
            },
            { 
                nombre: 'SONIA',
                email: 'S@O.N',
                password: '123',
                rol: 'usuario'
            }
        ];
        
        localStorage.setItem(USUARIOS_KEY, JSON.stringify(usuariosIniciales));
        console.log('[COMÚN] Usuarios iniciales creados');
    }
}

export function obtenerUsuarios() {
    try {
        const data = localStorage.getItem(USUARIOS_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('[COMÚN] Error al obtener usuarios:', error);
        return [];
    }
}

export function obtenerUsuarioActivo() {
    try {
        inicializarUsuarios();
        
        const email = localStorage.getItem(USUARIO_ACTIVO_KEY);
        if (!email) return null;
        
        const usuarios = obtenerUsuarios();
        return usuarios.find(u => u.email === email) || null;
        
    } catch (error) {
        console.error('[COMÚN] Error al obtener usuario activo:', error);
        return null;
    }
}

export function crearUsuario(usuario) {
    try {
        const usuarios = obtenerUsuarios();
        
        const existe = usuarios.find(u => u.email === usuario.email);
        if (existe) {
            return { ok: false, error: 'El email ya está registrado' };
        }
        
        usuarios.push(usuario);
        localStorage.setItem(USUARIOS_KEY, JSON.stringify(usuarios));
        
        console.log('[COMÚN] Usuario creado:', usuario.email);
        return { ok: true, usuario };
        
    } catch (error) {
        console.error('[COMÚN] Error al crear usuario:', error);
        return { ok: false, error: error.message };
    }
}

export function borrarUsuario(email) {
    try {
        let usuarios = obtenerUsuarios();
        usuarios = usuarios.filter(u => u.email !== email);
        
        localStorage.setItem(USUARIOS_KEY, JSON.stringify(usuarios));
        
        console.log('[COMÚN] Usuario borrado:', email);
        return { ok: true };
        
    } catch (error) {
        console.error('[COMÚN] Error al borrar usuario:', error);
        return { ok: false, error: error.message };
    }
}

export function actualizarUsuario(email, datosNuevos) {
    try {
        const usuarios = obtenerUsuarios();
        const index = usuarios.findIndex(u => u.email === email);
        
        if (index === -1) {
            return { ok: false, error: 'Usuario no encontrado' };
        }
        
        usuarios[index] = { ...usuarios[index], ...datosNuevos };
        localStorage.setItem(USUARIOS_KEY, JSON.stringify(usuarios));
        
        console.log('[COMÚN] Usuario actualizado:', email);
        return { ok: true, usuario: usuarios[index] };
        
    } catch (error) {
        console.error('[COMÚN] Error al actualizar usuario:', error);
        return { ok: false, error: error.message };
    }
}

export function loguearUsuario(email, password) {
    try {
        inicializarUsuarios();
        
        const usuarios = obtenerUsuarios();
        const usuario = usuarios.find(u => 
            u.email.toLowerCase() === email.toLowerCase().trim()
        );
        
        if (!usuario) {
            return { ok: false, error: 'Usuario no encontrado' };
        }
        
        if (usuario.password !== password) {
            return { ok: false, error: 'Contraseña incorrecta' };
        }
        
        localStorage.setItem(USUARIO_ACTIVO_KEY, usuario.email);
        
        console.log('[COMÚN] Login exitoso:', usuario.nombre);
        return { ok: true, user: usuario };
        
    } catch (error) {
        console.error('[COMÚN] Error en login:', error);
        return { ok: false, error: error.message };
    }
}

export function cerrarSesion() {
    localStorage.removeItem(USUARIO_ACTIVO_KEY);
    console.log('[COMÚN] Sesión cerrada');
}

// SECCIÓN VOLUNTARIADOS (IndexedDB)

export function inicializarDB() {
    return new Promise((resolve, reject) => {
        console.log('[VOLUNTARIADOS] Inicializando IndexedDB...');
        
        const request = indexedDB.open(VOLUNTARIADOS_DB, 1);
        
        request.onerror = () => {
            console.error('[VOLUNTARIADOS] Error al abrir BD:', request.error);
            reject(request.error);
        };
        
        request.onsuccess = () => {
            console.log('[VOLUNTARIADOS] IndexedDB abierta');
            resolve(request.result);
        };
        
        request.onupgradeneeded = (event) => {
            console.log('[VOLUNTARIADOS] Creando estructura...');
            
            const db = event.target.result;
            
            if (!db.objectStoreNames.contains(VOLUNTARIADOS_STORE)) {
                const store = db.createObjectStore(VOLUNTARIADOS_STORE, { 
                    keyPath: 'id',
                    autoIncrement: true
                });
                
                store.createIndex('email', 'email', { unique: false });
                store.createIndex('tipo', 'tipo', { unique: false });
                
                console.log('[VOLUNTARIADOS] Store "voluntariados" creado');
            }
            
            if (!db.objectStoreNames.contains(SELECCION_STORE)) {
                db.createObjectStore(SELECCION_STORE, { keyPath: 'id' });
                console.log('[VOLUNTARIADOS] Store "seleccion" creado');
            }
        };
    });
}

export async function crearVoluntariado(voluntariado) {
    try {
        console.log('[VOLUNTARIADOS] Creando:', voluntariado.titulo);
        
        const db = await inicializarDB();
        
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([VOLUNTARIADOS_STORE], 'readwrite');
            const store = transaction.objectStore(VOLUNTARIADOS_STORE);
            const request = store.add(voluntariado);
            
            request.onsuccess = () => {
                console.log('[VOLUNTARIADOS] Creado con ID:', request.result);
                resolve({ ok: true, id: request.result });
            };
            
            request.onerror = () => {
                console.error('[VOLUNTARIADOS] Error al crear:', request.error);
                reject(request.error);
            };
        });
        
    } catch (error) {
        console.error('[VOLUNTARIADOS] Error en crearVoluntariado:', error);
        return { ok: false, error: error.message };
    }
}

export async function obtenerVoluntariados() {
    try {
        console.log('[VOLUNTARIADOS] Obteniendo todos...');
        
        const db = await inicializarDB();
        
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([VOLUNTARIADOS_STORE], 'readonly');
            const store = transaction.objectStore(VOLUNTARIADOS_STORE);
            const request = store.getAll();
            
            request.onsuccess = () => {
                console.log('[VOLUNTARIADOS] Obtenidos:', request.result.length);
                resolve(request.result);
            };
            
            request.onerror = () => {
                console.error('[VOLUNTARIADOS] Error al obtener:', request.error);
                reject(request.error);
            };
        });
        
    } catch (error) {
        console.error('[VOLUNTARIADOS] Error en obtenerVoluntariados:', error);
        return [];
    }
}

export async function borrarVoluntariado(id) {
    try {
        console.log('[VOLUNTARIADOS] Borrando ID:', id);
        
        const db = await inicializarDB();
        
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([VOLUNTARIADOS_STORE], 'readwrite');
            const store = transaction.objectStore(VOLUNTARIADOS_STORE);
            const request = store.delete(id);
            
            request.onsuccess = () => {
                console.log('[VOLUNTARIADOS] Borrado correctamente');
                resolve({ ok: true });
            };
            
            request.onerror = () => {
                console.error('[VOLUNTARIADOS] Error al borrar:', request.error);
                reject(request.error);
            };
        });
        
    } catch (error) {
        console.error('[VOLUNTARIADOS] Error en borrarVoluntariado:', error);
        return { ok: false, error: error.message };
    }
}

export async function actualizarVoluntariado(id, datos) {
    try {
        console.log('[VOLUNTARIADOS] Actualizando ID:', id);
        
        const db = await inicializarDB();
        
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([VOLUNTARIADOS_STORE], 'readwrite');
            const store = transaction.objectStore(VOLUNTARIADOS_STORE);
            
            const getRequest = store.get(id);
            
            getRequest.onsuccess = () => {
                const voluntariado = { ...getRequest.result, ...datos, id };
                const updateRequest = store.put(voluntariado);
                
                updateRequest.onsuccess = () => {
                    console.log('[VOLUNTARIADOS] Actualizado correctamente');
                    resolve({ ok: true, voluntariado });
                };
                
                updateRequest.onerror = () => reject(updateRequest.error);
            };
            
            getRequest.onerror = () => reject(getRequest.error);
        });
        
    } catch (error) {
        console.error('[VOLUNTARIADOS] Error en actualizarVoluntariado:', error);
        return { ok: false, error: error.message };
    }
}

async function inicializarVoluntariadosEjemplo() {
    try {
        const voluntariadosExistentes = await obtenerVoluntariados();
        
        if (voluntariadosExistentes.length === 0) {
            const voluntariadosIniciales = [
                {
                    titulo: 'OFREZCO MEDICINA',
                    email: 'L@A.U',
                    fecha: '2025-10-24',
                    descripcion: 'SUPLEMENTOS VITAMINICOS PARA ANIMALES ENFERMOS',
                    tipo: 'Oferta'
                },
                {
                    titulo: 'NECESITO REFUGIO',
                    email: 'M@R.C',
                    fecha: '2025-10-27',
                    descripcion: 'SE DAN EN ADOPCION 4 GATITOS',
                    tipo: 'Petición'
                },
                {
                    titulo: 'NECESITO VEHICULO',
                    email: 'S@O.N',
                    fecha: '2025-10-28',
                    descripcion: 'NECESITO UN VEHICULO PARA TRASLADAR UN CABALLO',
                    tipo: 'Petición'
                }
            ];
            
            for (const vol of voluntariadosIniciales) {
                await crearVoluntariado(vol);
            }
            
            console.log('[COMÚN] Voluntariados iniciales cargados');
        } else {
            console.log('[COMÚN] Ya existen voluntariados, no se cargan datos iniciales');
        }
    } catch (error) {
        console.error('[COMÚN] Error al inicializar voluntariados:', error);
    }
}

// SECCIÓN DASHBOARD

export async function guardarSeleccion(voluntariadosSeleccionados) {
    try {
        console.log('[DASHBOARD] Guardando selección:', voluntariadosSeleccionados.length, 'items');
        
        const db = await inicializarDB();
        
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([SELECCION_STORE], 'readwrite');
            const store = transaction.objectStore(SELECCION_STORE);
            const request = store.put({ 
                id: 'seleccion', 
                items: voluntariadosSeleccionados 
            });
            
            request.onsuccess = () => {
                console.log('[DASHBOARD] Selección guardada');
                resolve({ ok: true });
            };
            
            request.onerror = () => {
                console.error('[DASHBOARD] Error al guardar selección:', request.error);
                reject(request.error);
            };
        });
        
    } catch (error) {
        console.error('[DASHBOARD] Error en guardarSeleccion:', error);
        return { ok: false, error: error.message };
    }
}

export async function obtenerSeleccion() {
    try {
        console.log('[DASHBOARD] Obteniendo selección...');
        
        const db = await inicializarDB();
        
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([SELECCION_STORE], 'readonly');
            const store = transaction.objectStore(SELECCION_STORE);
            const request = store.get('seleccion');
            
            request.onsuccess = () => {
                const items = request.result?.items || [];
                console.log('[DASHBOARD] Selección obtenida:', items.length, 'items');
                resolve(items);
            };
            
            request.onerror = () => {
                console.error('[DASHBOARD] Error al obtener selección:', request.error);
                reject(request.error);
            };
        });
        
    } catch (error) {
        console.error('[DASHBOARD] Error en obtenerSeleccion:', error);
        return [];
    }
}

// EXPORTACIÓN CENTRALIZADA

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