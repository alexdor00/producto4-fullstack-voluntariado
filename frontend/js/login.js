import { almacenaje } from './almacenaje.js';

// MOSTRAR USUARIO ACTIVO
// Muestra el email del usuario activo o -no login-
function mostrarUsuarioActivo() {
    const userStatus = document.getElementById('userStatus');
    const usuario = almacenaje.obtenerUsuarioActivo();
    
    if (usuario) {
        // Si hay usuario activo, mostrar su email
        userStatus.textContent = usuario.email;
        userStatus.style.color = '#8ab893';
        userStatus.style.fontWeight = '700';
    } else {
        // Si no hay usuario activo, mostrar -no login-
        userStatus.textContent = '-NO LOGIN-';
        userStatus.style.color = '#ff4444';
        userStatus.style.fontWeight = '400';
    }
}

// INICIO DE SESION
// Maneja el evento de clic en el boton de inicio de sesion
function manejarLogin(event) {
    // Previene el comportamiento por defecto del formulario
    event.preventDefault();
    
    // Obtiene los valores de los campos de correo y contraseña
    const email = document.getElementById('emailLogin').value.trim();
    const password = document.getElementById('passwordLogin').value.trim();
    const mensajeError = document.getElementById('mensajeError');
    
    // Validacion basica
    if (!email || !password) {
        mensajeError.textContent = 'Todos los campos son obligatorios';
        mensajeError.classList.remove('d-none');
        return;
    }
    
    // Llama a loguearUsuario con los valores obtenidos
    // Usa almacenaje.loguearUsuario para autenticar
    const resultado = almacenaje.loguearUsuario(email, password);
    
    // Muestra alerta de exito o error segun el resultado
    if (resultado.ok) {
        // LOGIN EXITOSO
        console.log('Login exitoso:', resultado.user.nombre);
        
        // Ocultar mensaje de error
        mensajeError.classList.add('d-none');
        
        // El email ya se guardo en localStorage (lo hace loguearUsuario)
        // Actualizar el navbar con el usuario activo
        mostrarUsuarioActivo();
        
        // Limpiar formulario
        document.getElementById('formLogin').reset();
        
        // Mostrar mensaje de exito y redirigir
        alert('Inicio de sesión exitoso.');
        
        setTimeout(() => {
            window.location.href = '../index.html';
        }, 1000);
        
    } else {
        // LOGIN FALLIDO
        console.log('Login fallido:', resultado.error);
        
        // Mostrar mensaje de error
        mensajeError.textContent = resultado.error;
        mensajeError.classList.remove('d-none');
    }
}

// EVENTO DOMContentLoaded
// Configura el comportamiento de la pagina cuando se carga
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== PAGINA LOGIN CARGADA ===');
    
    // Llama a mostrarUsuarioActivo para mostrar el usuario activo al cargar
    mostrarUsuarioActivo();
    
    // Añade un evento de clic al boton de inicio de sesion
    const formLogin = document.getElementById('formLogin');
    formLogin.addEventListener('submit', manejarLogin);
    
    console.log('Pagina lista');
});