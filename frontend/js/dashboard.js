import { almacenaje } from './almacenaje.js';

let filtroActivo = null;
let voluntariadosSeleccionados = [];

function mostrarUsuarioActivo() {
    const userStatus = document.getElementById('userStatus');
    const usuario = almacenaje.obtenerUsuarioActivo();
    
    if (usuario) {
        userStatus.textContent = usuario.email;
        userStatus.style.color = '#8ab893';
    } else {
        userStatus.textContent = '-NO LOGIN-';
        userStatus.style.color = '#ff4444';
    }
}

async function renderizarTarjetas() {
    const grid = document.getElementById('gridVoluntariados');
    grid.innerHTML = '<div class="col-12 text-center"><p class="text-white">Cargando...</p></div>';
    
    try {
        const voluntariados = await almacenaje.obtenerVoluntariados();
        let voluntariosFiltrados = voluntariados.filter(v => !voluntariadosSeleccionados.includes(v.id));
        
        if (filtroActivo) {
            voluntariosFiltrados = voluntariosFiltrados.filter(v => v.tipo === filtroActivo);
        }
        
        grid.innerHTML = '';
        
        if (voluntariosFiltrados.length === 0) {
            grid.innerHTML = '<div class="col-12 text-center"><p class="text-white fs-4">No hay voluntariados</p></div>';
            return;
        }
        
        voluntariosFiltrados.forEach(vol => {
            const claseTipo = vol.tipo === 'Oferta' ? 'oferta' : 'peticion';
            
            const col = document.createElement('div');
            col.className = 'col-12 col-md-6 col-lg-4';
            
            const card = document.createElement('div');
            card.className = `card-voluntariado ${claseTipo}`;
            card.draggable = true;
            card.dataset.id = vol.id;
            
            card.innerHTML = `
                <div class="card-body">
                    <h3 class="card-title">${vol.titulo}</h3>
                    <p class="descripcion">${vol.descripcion}</p>
                    <div class="info-footer">
                        <div class="fecha">${vol.fecha}</div>
                        <div class="usuario">PUBLICADO: <strong>${vol.email}</strong></div>
                    </div>
                </div>
            `;
            
            card.addEventListener('dragstart', function(e) {
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', this.dataset.id);
                this.style.opacity = '0.4';
                console.log('Arrastrando:', this.dataset.id);
            });
            
            card.addEventListener('dragend', function(e) {
                this.style.opacity = '1';
            });
            
            col.appendChild(card);
            grid.appendChild(col);
        });
        
    } catch (error) {
        console.error('Error:', error);
    }
}

async function renderizarSeleccion() {
    const zona = document.getElementById('zonaSeleccion');
    zona.innerHTML = '';
    
    if (voluntariadosSeleccionados.length === 0) {
        return;
    }
    
    const voluntariados = await almacenaje.obtenerVoluntariados();
    
    voluntariadosSeleccionados.forEach(id => {
        const vol = voluntariados.find(v => v.id === id);
        if (!vol) return;
        
        const claseTipo = vol.tipo === 'Oferta' ? 'oferta' : 'peticion';
        
        const card = document.createElement('div');
        card.className = `card-voluntariado ${claseTipo} seleccionada`;
        card.draggable = true;
        card.dataset.id = vol.id;
        
        card.innerHTML = `
            <div class="card-body">
                <h3 class="card-title">${vol.titulo}</h3>
                <p class="descripcion">${vol.descripcion}</p>
                <div class="info-footer">
                    <div class="fecha">${vol.fecha}</div>
                    <div class="usuario">PUBLICADO: <strong>${vol.email}</strong></div>
                </div>
            </div>
        `;
        
        card.addEventListener('dragstart', function(e) {
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', this.dataset.id);
            this.style.opacity = '0.4';
        });
        
        card.addEventListener('dragend', function(e) {
            this.style.opacity = '1';
        });
        
        zona.appendChild(card);
    });
}

function aplicarFiltro() {
    renderizarTarjetas();
    const btnOferta = document.getElementById('btnOferta');
    const btnPeticion = document.getElementById('btnPeticion');
    btnOferta.classList.toggle('active', filtroActivo === 'Oferta');
    btnPeticion.classList.toggle('active', filtroActivo === 'Petición');
}

async function agregarASeleccion(id) {
    const idNum = parseInt(id);
    if (!voluntariadosSeleccionados.includes(idNum)) {
        voluntariadosSeleccionados.push(idNum);
        await almacenaje.guardarSeleccion(voluntariadosSeleccionados);
        await renderizarTarjetas();
        await renderizarSeleccion();
        console.log('Agregado:', idNum);
    }
}

async function quitarSeleccion(id) {
    const idNum = parseInt(id);
    voluntariadosSeleccionados = voluntariadosSeleccionados.filter(vId => vId !== idNum);
    await almacenaje.guardarSeleccion(voluntariadosSeleccionados);
    await renderizarTarjetas();
    await renderizarSeleccion();
    console.log('Quitado:', idNum);
}

document.addEventListener('DOMContentLoaded', async function() {
    console.log('Iniciando dashboard');
    
    await almacenaje.inicializarVoluntariadosEjemplo();
    mostrarUsuarioActivo();
    
    voluntariadosSeleccionados = await almacenaje.obtenerSeleccion();
    
    await renderizarTarjetas();
    await renderizarSeleccion();
    
    // Zona de seleccion
    const zonaSeleccion = document.getElementById('zonaSeleccion');
    
    zonaSeleccion.addEventListener('dragover', function(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        this.style.backgroundColor = 'rgba(138, 184, 147, 0.2)';
    });
    
    zonaSeleccion.addEventListener('dragleave', function(e) {
        this.style.backgroundColor = '';
    });
    
    zonaSeleccion.addEventListener('drop', async function(e) {
        e.preventDefault();
        this.style.backgroundColor = '';
        const id = e.dataTransfer.getData('text/plain');
        await agregarASeleccion(id);
    });
    
    // Grid disponibles
    const gridDisponibles = document.getElementById('gridVoluntariados');
    
    gridDisponibles.addEventListener('dragover', function(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    });
    
    gridDisponibles.addEventListener('drop', async function(e) {
        e.preventDefault();
        const id = e.dataTransfer.getData('text/plain');
        
        if (voluntariadosSeleccionados.includes(parseInt(id))) {
            await quitarSeleccion(id);
        }
    });
    
    // Filtros
    document.getElementById('btnOferta').addEventListener('click', function() {
        filtroActivo = filtroActivo === 'Oferta' ? null : 'Oferta';
        aplicarFiltro();
    });
    
    document.getElementById('btnPeticion').addEventListener('click', function() {
        filtroActivo = filtroActivo === 'Petición' ? null : 'Petición';
        aplicarFiltro();
    });
    
    console.log('Dashboard listo');
});