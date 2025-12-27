import { almacenaje } from '../js/almacenaje.js';

// mostrar usuario activo
function mostrarUsuarioActivo() {
    const label = document.getElementById('usuarioActivoLabel');
    const usuario = almacenaje.obtenerUsuarioActivo();
    
    if (usuario) {
        label.textContent = usuario.email;
        label.style.color = '#8ab893';
    } else {
        label.textContent = 'NO LOGIN';
        label.style.color = '#ff4444';
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

// configurar campo email
function configurarCampoEmail() {
    const usuario = almacenaje.obtenerUsuarioActivo();
    const campoEmail = document.getElementById('email');
    
    if (usuario && campoEmail) {
        // auto-rellenar con email del usuario
        campoEmail.value = usuario.email;
        
        // bloquear si no es admin
        if (usuario.rol !== 'admin') {
            campoEmail.readOnly = true;
            campoEmail.style.backgroundColor = '#495057';
            campoEmail.style.cursor = 'not-allowed';
        }
    }
}

// cargar tabla de voluntariados
async function cargarTablaVoluntariados() {
    const tbody = document.getElementById('tablaVoluntariados');
    tbody.innerHTML = '<tr><td colspan="6" class="text-center">cargando...</td></tr>';
    
    try {
        const voluntariados = await almacenaje.obtenerVoluntariados();
        
        tbody.innerHTML = '';
        
        if (voluntariados.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">no hay voluntariados</td></tr>';
            return;
        }
        
        voluntariados.forEach(vol => {
            const fila = document.createElement('tr');
            fila.className = 'text-center';
            
            fila.innerHTML = `
                <td class="fw-bold">${vol.titulo}</td>
                <td>${vol.email}</td>
                <td>${vol.fecha}</td>
                <td class="text-start">${vol.descripcion}</td>
                <td>
                    <span class="badge ${vol.tipo === 'Oferta' ? 'bg-success' : 'bg-warning'}">
                        ${vol.tipo.toUpperCase()}
                    </span>
                </td>
                <td>
                    <button class="btn btn-danger btn-sm btn-borrar" data-id="${vol.id}">
                        BORRAR
                    </button>
                </td>
            `;
            
            tbody.appendChild(fila);
        });
        
        agregarEventosBorrar();
        
        console.log('tabla cargada:', voluntariados.length, 'voluntariados');
        
    } catch (error) {
        console.error('error al cargar tabla:', error);
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">error al cargar</td></tr>';
    }
}

// eventos de borrar
function agregarEventosBorrar() {
    const botones = document.querySelectorAll('.btn-borrar');
    
    botones.forEach(boton => {
        boton.addEventListener('click', async function() {
            const id = parseInt(this.getAttribute('data-id'));
            await borrarVoluntariado(id);
        });
    });
}

// borrar voluntariado
async function borrarVoluntariado(id) {
    try {
        await almacenaje.borrarVoluntariado(id);
        
        await cargarTablaVoluntariados();
        await dibujarGrafico();
        
        mostrarAlerta('voluntariado borrado correctamente', 'success');
        
    } catch (error) {
        console.error('error al borrar:', error);
        mostrarAlerta('error al borrar el voluntariado', 'danger');
    }
}

// dar de alta voluntariado
async function altaVoluntariado(event) {
    event.preventDefault();
    
    const titulo = document.getElementById('titulo').value.trim();
    const email = document.getElementById('email').value.trim();
    const fecha = document.getElementById('fecha').value;
    const descripcion = document.getElementById('descripcion').value.trim();
    const tipo = document.getElementById('tipo').value;
    
    if (!titulo || !email || !fecha || !descripcion) {
        mostrarAlerta('todos los campos son obligatorios', 'warning');
        return;
    }
    
    const nuevoVoluntariado = {
        titulo: titulo.toUpperCase(),
        email: email,
        fecha: fecha,
        descripcion: descripcion.toUpperCase(),
        tipo: tipo
    };
    
    try {
        await almacenaje.crearVoluntariado(nuevoVoluntariado);
        
        await cargarTablaVoluntariados();
        await dibujarGrafico();
        
        document.getElementById('formVoluntariado').reset();
        configurarCampoEmail(); // re-establecer email
        
        mostrarAlerta('voluntariado creado correctamente', 'success');
        
    } catch (error) {
        console.error('error al crear voluntariado:', error);
        mostrarAlerta('error: ' + error.message, 'danger');
    }
}

// mostrar alertas
function mostrarAlerta(mensaje, tipo) {
    const alerta = document.getElementById('alerta');
    
    alerta.textContent = mensaje;
    alerta.className = `alert alert-${tipo} mt-3`;
    alerta.classList.remove('d-none');
    
    setTimeout(() => {
        alerta.classList.add('d-none');
    }, 3000);
}

// dibujar grafico con canvas
async function dibujarGrafico() {
    const canvas = document.getElementById('graficoVoluntariados');
    const ctx = canvas.getContext('2d');
    
    try {
        const voluntariados = await almacenaje.obtenerVoluntariados();
        
        const ofertas = voluntariados.filter(v => v.tipo === 'Oferta').length;
        const peticiones = voluntariados.filter(v => v.tipo === 'Petición').length;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const barWidth = 120;
        const barSpacing = 150;
        const maxHeight = 250;
        const baseY = 320;
        const maxValue = Math.max(ofertas, peticiones, 1);
        
        const alturaOfertas = (ofertas / maxValue) * maxHeight;
        const alturaPeticiones = (peticiones / maxValue) * maxHeight;
        
        const xOfertas = 200;
        const xPeticiones = xOfertas + barWidth + barSpacing;
        
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 3;
        
        ctx.fillStyle = '#8ab893';
        ctx.fillRect(xOfertas, baseY - alturaOfertas, barWidth, alturaOfertas);
        
        ctx.fillStyle = '#e0ac69';
        ctx.fillRect(xPeticiones, baseY - alturaPeticiones, barWidth, alturaPeticiones);
        
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px Poppins';
        ctx.textAlign = 'center';
        
        ctx.fillText(ofertas.toString(), xOfertas + barWidth/2, baseY - alturaOfertas - 15);
        ctx.fillText(peticiones.toString(), xPeticiones + barWidth/2, baseY - alturaPeticiones - 15);
        
        ctx.font = 'bold 18px Poppins';
        ctx.fillText('OFERTAS', xOfertas + barWidth/2, baseY + 30);
        ctx.fillText('PETICIONES', xPeticiones + barWidth/2, baseY + 30);
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(150, baseY);
        ctx.lineTo(650, baseY);
        ctx.stroke();
        
        console.log('grafico dibujado - ofertas:', ofertas, 'peticiones:', peticiones);
        
    } catch (error) {
        console.error('error al dibujar grafico:', error);
    }
}

// inicializacion
document.addEventListener('DOMContentLoaded', async function() {
    console.log('=== pagina voluntariados cargada ===');
    
    await almacenaje.inicializarVoluntariadosEjemplo();
    
    mostrarUsuarioActivo();
    configurarLogout();
    configurarCampoEmail(); // bloquear email si no es admin
    
    await cargarTablaVoluntariados();
    await dibujarGrafico();
    
    const formulario = document.getElementById('formVoluntariado');
    formulario.addEventListener('submit', altaVoluntariado);
    
    console.log('pagina lista');
});