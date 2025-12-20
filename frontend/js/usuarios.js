//Con localStorage
import { almacenaje } from './almacenaje.js';

// MOSTRAR USUARIO ACTIVO EN NAVBAR
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

// CARGAR TABLA DE USUARIOS
function cargarTablaUsuarios() {
    const tbody = document.getElementById('tablaUsuarios');
    tbody.innerHTML = '<tr><td colspan="4" class="text-center">Cargando...</td></tr>';
    
    try {
        const usuarios = almacenaje.obtenerUsuarios();
        
        tbody.innerHTML = '';
        
        if (usuarios.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center">No hay usuarios</td></tr>';
            return;
        }
        
        usuarios.forEach(usuario => {
            const fila = document.createElement('tr');
            fila.className = 'text-center';
            
            fila.innerHTML = `
                <td class="fw-bold">${usuario.nombre}</td>
                <td>${usuario.email}</td>
                <td>${usuario.password}</td>
                <td>
                    <button class="btn btn-danger btn-sm btn-borrar" data-email="${usuario.email}">
                        BORRAR
                    </button>
                </td>
            `;
            
            tbody.appendChild(fila);
        });
        
        agregarEventosBorrar();
        
        console.log('Tabla cargada:', usuarios.length, 'usuarios');
        
    } catch (error) {
        console.error('Error al cargar tabla:', error);
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-danger">Error al cargar</td></tr>';
    }
}

// EVENTOS DE BORRAR
function agregarEventosBorrar() {
    const botones = document.querySelectorAll('.btn-borrar');
    
    botones.forEach(boton => {
        boton.addEventListener('click', function() {
            const email = this.getAttribute('data-email');
            borrarUsuario(email);
        });
    });
}

// BORRAR USUARIO
function borrarUsuario(email) {
    const resultado = almacenaje.borrarUsuario(email);
    
    if (resultado.ok) {
        cargarTablaUsuarios();
        console.log('Usuario borrado:', email);
    } else {
        alert('Error al borrar usuario');
    }
}

// ALTA DE USUARIO
function altaUsuario(event) {
    event.preventDefault();
    
    const nombre = document.getElementById('nombre').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    
    if (!nombre || !email || !password) {
        alert('Todos los campos son obligatorios');
        return;
    }
    
    const nuevoUsuario = {
        nombre: nombre.toUpperCase(),
        email: email,
        password: password,
        rol: 'usuario'
    };
    
    const resultado = almacenaje.crearUsuario(nuevoUsuario);
    
    if (resultado.ok) {
        cargarTablaUsuarios();
        document.getElementById('formUsuario').reset();
        alert('Usuario creado correctamente');
        console.log('Usuario creado:', nuevoUsuario.email);
    } else {
        alert(resultado.error);
    }
}

// INICIALIZACION
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== PAGINA USUARIOS CARGADA ===');
    
    mostrarUsuarioActivo();
    
    cargarTablaUsuarios();
    
    const formulario = document.getElementById('formUsuario');
    formulario.addEventListener('submit', altaUsuario);
    
    console.log('Pagina lista');
});