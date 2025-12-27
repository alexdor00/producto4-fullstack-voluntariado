import { almacenaje } from '../js/almacenaje.js';

// mostrar usuario activo en navbar
function mostrarUsuarioActivo() {
    const userStatus = document.getElementById('userStatus');
    const usuario = almacenaje.obtenerUsuarioActivo();
    
    if (usuario) {
        userStatus.textContent = usuario.email;
        userStatus.style.color = '#8ab893';
        userStatus.style.fontWeight = '700';
    } else {
        userStatus.textContent = '-NO LOGIN-';
        userStatus.style.color = '#ff4444';
        userStatus.style.fontWeight = '400';
    }
}

// cerrar sesion
function configurarLogout() {
    const btnLogout = document.getElementById('btnLogout');
    const usuario = almacenaje.obtenerUsuarioActivo();
    
    if (usuario && btnLogout) {
        btnLogout.style.display = 'inline-block';
        btnLogout.addEventListener('click', function() {
            almacenaje.cerrarSesion();
            window.location.href = 'login.html';
        });
    }
}

// cargar tabla de usuarios
async function cargarTablaUsuarios() {
    const tbody = document.getElementById('tablaUsuarios');
    tbody.innerHTML = '<tr><td colspan="4" class="text-center">cargando...</td></tr>';
    
    try {
        const usuarios = await almacenaje.obtenerUsuarios();
        
        tbody.innerHTML = '';
        
        if (usuarios.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center">no hay usuarios</td></tr>';
            return;
        }
        
        usuarios.forEach(usuario => {
            const fila = document.createElement('tr');
            fila.className = 'text-center';
            
            fila.innerHTML = `
                <td class="fw-bold">${usuario.nombre}</td>
                <td>${usuario.email}</td>
                <td>${usuario.rol || 'usuario'}</td>
                <td>
                    <button class="btn btn-danger btn-sm btn-borrar" data-email="${usuario.email}">
                        BORRAR
                    </button>
                </td>
            `;
            
            tbody.appendChild(fila);
        });
        
        agregarEventosBorrar();
        
        console.log('tabla cargada:', usuarios.length, 'usuarios');
        
    } catch (error) {
        console.error('error al cargar tabla:', error);
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-danger">error al cargar</td></tr>';
    }
}

// eventos de borrar
function agregarEventosBorrar() {
    const botones = document.querySelectorAll('.btn-borrar');
    
    botones.forEach(boton => {
        boton.addEventListener('click', async function() {
            const email = this.getAttribute('data-email');
            await borrarUsuario(email);
        });
    });
}

// borrar usuario
async function borrarUsuario(email) {
    try {
        const resultado = await almacenaje.borrarUsuario(email);
        
        if (resultado.ok) {
            await cargarTablaUsuarios();
            console.log('usuario borrado:', email);
            alert('usuario eliminado correctamente');
        } else {
            alert('error al borrar usuario');
        }
        
    } catch (error) {
        console.error('error al borrar:', error);
        alert('error al borrar usuario');
    }
}

// alta de usuario
async function altaUsuario(event) {
    event.preventDefault();
    
    const nombre = document.getElementById('nombre').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    
    if (!nombre || !email || !password) {
        alert('todos los campos son obligatorios');
        return;
    }
    
    const nuevoUsuario = {
        nombre: nombre.toUpperCase(),
        email: email,
        password: password,
        rol: 'usuario'
    };
    
    try {
        const resultado = await almacenaje.crearUsuario(nuevoUsuario);
        
        if (resultado.ok) {
            await cargarTablaUsuarios();
            document.getElementById('formUsuario').reset();
            alert('usuario creado correctamente');
            console.log('usuario creado:', nuevoUsuario.email);
        } else {
            alert(resultado.error);
        }
        
    } catch (error) {
        console.error('error al crear:', error);
        alert('error al crear usuario');
    }
}

// inicializacion
document.addEventListener('DOMContentLoaded', async function() {
    console.log('=== pagina usuarios cargada ===');
    
    const usuario = almacenaje.obtenerUsuarioActivo();
    
    // VERIFICAR QUE SEA ADMIN
    if (!usuario || usuario.rol !== 'admin') {
        document.querySelector('.container').innerHTML = `
            <div class="alert alert-danger text-center mt-5">
                <h3>ACCESO DENEGADO</h3>
                <p>Esta sección es solo para administradores.</p>
                <a href="../index.html" class="btn btn-primary mt-3">VOLVER AL DASHBOARD</a>
            </div>
        `;
        return;
    }
    
    mostrarUsuarioActivo();
    configurarLogout();
    
    await cargarTablaUsuarios();
    
    const formulario = document.getElementById('formUsuario');
    formulario.addEventListener('submit', altaUsuario);
    
    console.log('pagina lista');
});