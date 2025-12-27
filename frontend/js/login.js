import { almacenaje } from '../js/almacenaje.js';

// mostrar usuario activo
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

// inicio de sesion
async function manejarLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('emailLogin').value.trim();
    const password = document.getElementById('passwordLogin').value.trim();
    const mensajeError = document.getElementById('mensajeError');
    
    // validacion basica
    if (!email || !password) {
        mensajeError.textContent = 'todos los campos son obligatorios';
        mensajeError.classList.remove('d-none');
        return;
    }
    
    try {
        // llamar a login (ahora es async)
        const resultado = await almacenaje.loguearUsuario(email, password);
        
        if (resultado.ok) {
            console.log('login exitoso:', resultado.user.nombre);
            
            mensajeError.classList.add('d-none');
            mostrarUsuarioActivo();
            
            document.getElementById('formLogin').reset();
            
            alert('inicio de sesion exitoso');
            
            setTimeout(() => {
                window.location.href = '../index.html';
            }, 500);
            
        } else {
            console.log('login fallido:', resultado.error);
            mensajeError.textContent = resultado.error;
            mensajeError.classList.remove('d-none');
        }
        
    } catch (error) {
        console.error('error en login:', error);
        mensajeError.textContent = 'error al conectar con el servidor';
        mensajeError.classList.remove('d-none');
    }
}

// inicializacion
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== pagina login cargada ===');
    
    mostrarUsuarioActivo();
    
    const formLogin = document.getElementById('formLogin');
    formLogin.addEventListener('submit', manejarLogin);
    
    console.log('pagina lista');
});