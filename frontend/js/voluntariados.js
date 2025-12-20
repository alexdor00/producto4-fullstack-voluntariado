// Gestión de voluntariados con IndexedDB

import { almacenaje } from '../js/almacenaje.js';

// 1. MOSTRAR USUARIO ACTIVO EN NAVBAR
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

// 2. CARGAR TABLA DE VOLUNTARIADOS
async function cargarTablaVoluntariados() {
    const tbody = document.getElementById('tablaVoluntariados');
    tbody.innerHTML = '<tr><td colspan="6" class="text-center">Cargando...</td></tr>';
    
    try {
        // Obtener todos los voluntariados de IndexedDB
        const voluntariados = await almacenaje.obtenerVoluntariados();
        
        tbody.innerHTML = ''; // Limpiar
        
        if (voluntariados.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">No hay voluntariados</td></tr>';
            return;
        }
        
        // Crear una fila por cada voluntariado
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
        
        // Añadir eventos a botones de borrar
        agregarEventosBorrar();
        
        console.log('Tabla cargada:', voluntariados.length, 'voluntariados');
        
    } catch (error) {
        console.error('Error al cargar tabla:', error);
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Error al cargar</td></tr>';
    }
}

// 3. EVENTOS DE BORRAR
function agregarEventosBorrar() {
    const botones = document.querySelectorAll('.btn-borrar');
    
    botones.forEach(boton => {
        boton.addEventListener('click', async function() {
            const id = parseInt(this.getAttribute('data-id'));
            await borrarVoluntariado(id);
        });
    });
}

// 4. BORRAR VOLUNTARIADO
async function borrarVoluntariado(id) {
    try {
        await almacenaje.borrarVoluntariado(id);
        
        // Recargar tabla y gráfico
        await cargarTablaVoluntariados();
        await dibujarGrafico();
        
        mostrarAlerta('Voluntariado borrado correctamente', 'success');
        
    } catch (error) {
        console.error('Error al borrar:', error);
        mostrarAlerta('Error al borrar el voluntariado', 'danger');
    }
}

// 5. DAR DE ALTA VOLUNTARIADO
async function altaVoluntariado(event) {
    event.preventDefault();
    
    // Obtener valores del formulario
    const titulo = document.getElementById('titulo').value.trim();
    const email = document.getElementById('email').value.trim();
    const fecha = document.getElementById('fecha').value;
    const descripcion = document.getElementById('descripcion').value.trim();
    const tipo = document.getElementById('tipo').value;
    
    // Validar campos vacíos
    if (!titulo || !email || !fecha || !descripcion) {
        mostrarAlerta('Todos los campos son obligatorios', 'warning');
        return;
    }
    
    // Validar que el email existe en usuarios
    const usuarios = almacenaje.obtenerUsuarios();
    const usuarioExiste = usuarios.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!usuarioExiste) {
        mostrarAlerta('El email no esta registrado. Debe registrarse primero en Alta Usuario', 'danger');
        return;
    }
    
    // Crear objeto voluntariado
    const nuevoVoluntariado = {
        titulo: titulo.toUpperCase(),
        email: email,
        fecha: fecha,
        descripcion: descripcion.toUpperCase(),
        tipo: tipo
    };
    
    try {
        // Guardar en IndexedDB
        await almacenaje.crearVoluntariado(nuevoVoluntariado);
        
        // Recargar tabla y gráfico
        await cargarTablaVoluntariados();
        await dibujarGrafico();
        
        // Limpiar formulario
        document.getElementById('formVoluntariado').reset();
        
        mostrarAlerta('Voluntariado creado correctamente', 'success');
        
    } catch (error) {
        console.error('Error al crear voluntariado:', error);
        mostrarAlerta('Error al crear el voluntariado', 'danger');
    }
}

// 6. MOSTRAR ALERTAS
function mostrarAlerta(mensaje, tipo) {
    const alerta = document.getElementById('alerta');
    
    alerta.textContent = mensaje;
    alerta.className = `alert alert-${tipo} mt-3`;
    alerta.classList.remove('d-none');
    
    setTimeout(() => {
        alerta.classList.add('d-none');
    }, 3000);
}

// 7. DIBUJAR GRÁFICO CON CANVAS
async function dibujarGrafico() {
    const canvas = document.getElementById('graficoVoluntariados');
    const ctx = canvas.getContext('2d');
    
    try {
        // Obtener datos
        const voluntariados = await almacenaje.obtenerVoluntariados();
        
        // Contar peticiones y ofertas
        const ofertas = voluntariados.filter(v => v.tipo === 'Oferta').length;
        const peticiones = voluntariados.filter(v => v.tipo === 'Petición').length;
        
        // Limpiar canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Configuración del gráfico
        const barWidth = 120;
        const barSpacing = 150;
        const maxHeight = 250;
        const baseY = 320;
        const maxValue = Math.max(ofertas, peticiones, 1);
        
        // Calcular alturas proporcionales
        const alturaOfertas = (ofertas / maxValue) * maxHeight;
        const alturaPeticiones = (peticiones / maxValue) * maxHeight;
        
        // Posiciones X centradas
        const xOfertas = 200;
        const xPeticiones = xOfertas + barWidth + barSpacing;
        
        // DIBUJAR BARRA OFERTAS (Verde con sombra)
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 3;
        
        ctx.fillStyle = '#8ab893';
        ctx.fillRect(xOfertas, baseY - alturaOfertas, barWidth, alturaOfertas);
        
        // DIBUJAR BARRA PETICIONES (Naranja con sombra)
        ctx.fillStyle = '#e0ac69';
        ctx.fillRect(xPeticiones, baseY - alturaPeticiones, barWidth, alturaPeticiones);
        
        // Resetear sombra
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // ETIQUETAS DE NÚMEROS (encima de las barras)
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px Poppins';
        ctx.textAlign = 'center';
        
        // Número Ofertas
        ctx.fillText(ofertas.toString(), xOfertas + barWidth/2, baseY - alturaOfertas - 15);
        
        // Número Peticiones
        ctx.fillText(peticiones.toString(), xPeticiones + barWidth/2, baseY - alturaPeticiones - 15);
        
        // ETIQUETAS DE TEXTO (debajo de las barras)
        ctx.font = 'bold 18px Poppins';
        
        // Texto Ofertas
        ctx.fillText('OFERTAS', xOfertas + barWidth/2, baseY + 30);
        
        // Texto Peticiones
        ctx.fillText('PETICIONES', xPeticiones + barWidth/2, baseY + 30);
        
        
        
        // LÍNEA BASE
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(150, baseY);
        ctx.lineTo(650, baseY);
        ctx.stroke();
        
        console.log('Grafico dibujado - Ofertas:', ofertas, 'Peticiones:', peticiones);
        
    } catch (error) {
        console.error('Error al dibujar grafico:', error);
    }
}

// 8. INICIALIZACIÓN AL CARGAR LA PÁGINA
document.addEventListener('DOMContentLoaded', async function() {
    console.log('=== PAGINA VOLUNTARIADOS CARGADA ===');
    
    // 0. Inicializar voluntariados de ejemplo (solo primera vez)
    await almacenaje.inicializarVoluntariadosEjemplo();
    
    // 1. Mostrar usuario activo
    mostrarUsuarioActivo();
    
    // 2. Cargar tabla inicial
    await cargarTablaVoluntariados();
    
    // 3. Dibujar gráfico inicial
    await dibujarGrafico();
    
    // 4. Registrar evento del formulario
    const formulario = document.getElementById('formVoluntariado');
    formulario.addEventListener('submit', altaVoluntariado);
    
    console.log('Pagina lista');
});