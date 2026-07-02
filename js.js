// PEGA AQUÍ LA URL QUE TE DIO GOOGLE APPS SCRIPT
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbw8aVMF282PVCj68mpOpuwUy4lKRBmLMwYqVA7_ohyT8R2vqpgNlmAXav_iSX1mQk5Y/exec";

// --- MENÚ HAMBURGUESA (MOBILE) ---
const hamburgerBtn = document.getElementById('hamburger-btn');
const navMenu = document.getElementById('nav-menu');

if (hamburgerBtn && navMenu) {
    hamburgerBtn.addEventListener('click', function () {
        hamburgerBtn.classList.toggle('open');
        navMenu.classList.toggle('open');
    });

    // Cerrar el menú al hacer clic en un enlace
    navMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            hamburgerBtn.classList.remove('open');
            navMenu.classList.remove('open');
        });
    });
}

// --- VALIDACIÓN PARA EL FORMULARIO DE CITAS ---
// Solo se ejecuta si el formulario 'appointmentForm' existe en la página actual
const formularioCitas = document.getElementById('appointmentForm');

if (formularioCitas) {
    formularioCitas.addEventListener('submit', function (e) {
        e.preventDefault(); // Evitar que la página se recargue

        const btn = document.querySelector('.btn-submit');
        btn.innerText = "Enviando...";
        btn.disabled = true;

        // Recolectar los datos del formulario (incluyendo el nuevo campo 'servicio')
        const datos = {
            propietario: document.getElementById('propietario').value,
            mascota: document.getElementById('mascota').value,
            telefono: document.getElementById('telefono').value,
            servicio: document.getElementById('servicio').value,
            fecha: document.getElementById('fecha').value,
            notas: document.getElementById('notas').value
        };

        // Enviar los datos a Google Sheets usando fetch
        fetch(WEB_APP_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(datos)
        })
            .then(() => {
                document.getElementById('appointmentForm').reset();
                document.getElementById('mensajeExito').className = "mensaje-visible";
                btn.innerText = "Enviar Solicitud";
                btn.disabled = false;
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Hubo un problema al enviar la cita. Inténtalo de nuevo.');
                btn.disabled = false;
                btn.innerText = "Enviar Solicitud";
            });
    });
}

// --- VALIDACIÓN PARA LOS PRODUCTOS DE LA TIENDA ---
if (document.getElementById('contenedor-productos')) {
    cargarProductos();
}

// --- VARIABLES GLOBALES DE LA TIENDA ---
let todosLosProductos = []; // Cache de todos los productos
let categoriaActiva = 'Todos';
let textoBusqueda = '';

function cargarProductos() {
    const contenedor = document.getElementById('contenedor-productos');

    fetch(WEB_APP_URL)
        .then(response => response.json())
        .then(productos => {
            if (productos.length === 0) {
                contenedor.innerHTML = "<p class='cargando'>Por el momento no hay productos disponibles.</p>";
                return;
            }

            // Guardar todos los productos en memoria
            todosLosProductos = productos;

            // Generar los botones de categoría dinámicamente
            generarFiltrosCategorias(productos);

            // Conectar eventos de búsqueda y filtro
            conectarEventosFiltro();

            // Renderizar todos los productos al inicio
            renderizarProductos(todosLosProductos);
        })
        .catch(error => {
            console.error('Error al cargar productos:', error);
            contenedor.innerHTML = "<p class='cargando'>Hubo un error al cargar la tienda. Inténtalo más tarde.</p>";
        });
}

// Extrae las categorías únicas de los productos y crea los botones
function generarFiltrosCategorias(productos) {
    const contenedorFiltros = document.getElementById('filtros-categoria');
    if (!contenedorFiltros) return;

    const categorias = ['Todos', ...new Set(
        productos
            .map(p => p.categoria)
            .filter(c => c && c.trim() !== '')
    )];

    contenedorFiltros.innerHTML = categorias.map(cat => `
        <button
            class="btn-filtro ${cat === 'Todos' ? 'activo' : ''}"
            data-categoria="${cat}">
            ${cat}
        </button>
    `).join('');

    // Evento para cada botón de categoría
    contenedorFiltros.querySelectorAll('.btn-filtro').forEach(btn => {
        btn.addEventListener('click', function () {
            categoriaActiva = this.dataset.categoria;

            // Marcar el botón activo
            contenedorFiltros.querySelectorAll('.btn-filtro').forEach(b => b.classList.remove('activo'));
            this.classList.add('activo');

            aplicarFiltros();
        });
    });
}

// Conecta los eventos de la barra de búsqueda
function conectarEventosFiltro() {
    const buscador = document.getElementById('buscador-productos');
    const btnLimpiar = document.getElementById('btn-limpiar-busqueda');
    if (!buscador) return;

    buscador.addEventListener('input', function () {
        textoBusqueda = this.value.trim().toLowerCase();

        // Mostrar/ocultar botón X
        if (btnLimpiar) {
            btnLimpiar.style.display = textoBusqueda ? 'flex' : 'none';
        }

        aplicarFiltros();
    });

    if (btnLimpiar) {
        btnLimpiar.addEventListener('click', function () {
            buscador.value = '';
            textoBusqueda = '';
            btnLimpiar.style.display = 'none';
            buscador.focus();
            aplicarFiltros();
        });
    }
}

// Aplica tanto el filtro de categoría como el de búsqueda de texto
function aplicarFiltros() {
    let resultados = todosLosProductos;

    // 1. Filtrar por categoría
    if (categoriaActiva !== 'Todos') {
        resultados = resultados.filter(p => p.categoria === categoriaActiva);
    }

    // 2. Filtrar por texto de búsqueda (nombre o descripción)
    if (textoBusqueda) {
        resultados = resultados.filter(p =>
            (p.nombre && p.nombre.toLowerCase().includes(textoBusqueda)) ||
            (p.descripcion && p.descripcion.toLowerCase().includes(textoBusqueda))
        );
    }

    renderizarProductos(resultados);
}

// Dibuja las tarjetas de productos en el DOM
function renderizarProductos(productos) {
    const contenedor = document.getElementById('contenedor-productos');
    const contador = document.getElementById('contador-resultados');

    // Actualizar contador
    if (contador) {
        const hayFiltros = textoBusqueda || categoriaActiva !== 'Todos';
        if (hayFiltros) {
            contador.style.display = 'block';
            contador.textContent = productos.length === 0
                ? 'No se encontraron productos.'
                : `${productos.length} producto${productos.length !== 1 ? 's' : ''} encontrado${productos.length !== 1 ? 's' : ''}`;
        } else {
            contador.style.display = 'none';
        }
    }

    if (productos.length === 0) {
        contenedor.innerHTML = `
            <div class="sin-resultados">
                <i class="fas fa-search"></i>
                <p>No encontramos productos que coincidan con tu búsqueda.</p>
                <button onclick="limpiarTodosFiltros()" class="btn-reset-filtros">Ver todos los productos</button>
            </div>
        `;
        return;
    }

    contenedor.innerHTML = '';
    productos.forEach(producto => {
        const card = document.createElement('div');
        card.className = 'product-card';
        const urlImagen = producto.imagen || 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?q=80&w=300';

        card.innerHTML = `
            <div class="product-img-box card-img-clickable">
                <img src="${urlImagen}" alt="${producto.nombre}" loading="lazy">
                <div class="card-img-overlay"><i class="fas fa-expand"></i> Ver fotos</div>
            </div>
            <div class="product-info">
                <div class="product-meta">
                    <span class="product-id">ID: #${producto.id}</span>
                    ${producto.categoria ? `<span class="product-tag">${producto.categoria}</span>` : ''}
                </div>
                <h3>${producto.nombre}</h3>
                <p>${producto.descripcion}</p>
                <div class="card-actions">
                    <button class="btn-ver-producto" onclick="abrirModal(${JSON.stringify(producto).replace(/"/g, '&quot;')})">Ver producto</button>
                    <a href="https://wa.me/523112794209?text=Hola,%20me%20interesa%20el%20producto%20${encodeURIComponent(producto.nombre)}" class="btn-interes" target="_blank" rel="noopener noreferrer">
                        <i class="fab fa-whatsapp"></i> WhatsApp
                    </a>
                </div>
            </div>
        `;

        // Clic en la imagen también abre el modal
        card.querySelector('.card-img-clickable').addEventListener('click', () => abrirModal(producto));
        contenedor.appendChild(card);
    });
}

// Limpia todos los filtros y muestra todos los productos
function limpiarTodosFiltros() {
    const buscador = document.getElementById('buscador-productos');
    const btnLimpiar = document.getElementById('btn-limpiar-busqueda');
    const contenedorFiltros = document.getElementById('filtros-categoria');

    if (buscador) buscador.value = '';
    if (btnLimpiar) btnLimpiar.style.display = 'none';

    textoBusqueda = '';
    categoriaActiva = 'Todos';

    if (contenedorFiltros) {
        contenedorFiltros.querySelectorAll('.btn-filtro').forEach(b => b.classList.remove('activo'));
        const btnTodos = contenedorFiltros.querySelector('[data-categoria="Todos"]');
        if (btnTodos) btnTodos.classList.add('activo');
    }

    renderizarProductos(todosLosProductos);
}

// =============================================
// --- MODAL Y CARRUSEL DE PRODUCTO ---
// =============================================

let imagenActual = 0;
let imagenesModal = [];

function abrirModal(producto) {
    // Recopilar las imágenes disponibles (ignorar vacías)
    const fallback = 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?q=80&w=600';
    imagenesModal = [
        producto.imagen,
        producto.imagen2,
        producto.imagen3,
        producto.imagen4
    ].filter(url => url && url.trim() !== '');

    if (imagenesModal.length === 0) imagenesModal = [fallback];

    imagenActual = 0;

    // Rellenar info
    document.getElementById('modal-id').textContent = `ID: #${producto.id}`;
    document.getElementById('modal-nombre').textContent = producto.nombre;
    document.getElementById('modal-descripcion').textContent = producto.descripcion;

    const modalCat = document.getElementById('modal-categoria');
    if (producto.categoria) {
        modalCat.textContent = producto.categoria;
        modalCat.style.display = 'inline-block';
    } else {
        modalCat.style.display = 'none';
    }

    document.getElementById('modal-whatsapp').href =
        `https://wa.me/523112794209?text=Hola,%20me%20interesa%20el%20producto%20${encodeURIComponent(producto.nombre)}`;

    // Construir carrusel
    construirCarrusel();

    // Mostrar modal
    const modal = document.getElementById('producto-modal');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Evitar scroll del fondo
}

function construirCarrusel() {
    const track = document.getElementById('carrusel-track');
    const dotsContainer = document.getElementById('carrusel-dots');
    const btnPrev = document.getElementById('carrusel-prev');
    const btnNext = document.getElementById('carrusel-next');

    // Insertar imágenes en el track
    track.innerHTML = imagenesModal.map((url, i) => `
        <div class="carrusel-slide">
            <img src="${url}" alt="Imagen ${i + 1} del producto" loading="lazy">
        </div>
    `).join('');

    // Insertar dots
    dotsContainer.innerHTML = imagenesModal.map((_, i) => `
        <button class="carrusel-dot ${i === 0 ? 'activo' : ''}" data-index="${i}" aria-label="Ir a imagen ${i + 1}"></button>
    `).join('');

    // Mostrar/ocultar flechas según número de imágenes
    const hayVarias = imagenesModal.length > 1;
    btnPrev.style.display = hayVarias ? 'flex' : 'none';
    btnNext.style.display = hayVarias ? 'flex' : 'none';
    dotsContainer.style.display = hayVarias ? 'flex' : 'none';

    // Eventos de los dots
    dotsContainer.querySelectorAll('.carrusel-dot').forEach(dot => {
        dot.addEventListener('click', () => irASlide(parseInt(dot.dataset.index)));
    });

    // Eventos flechas
    btnPrev.onclick = () => irASlide((imagenActual - 1 + imagenesModal.length) % imagenesModal.length);
    btnNext.onclick = () => irASlide((imagenActual + 1) % imagenesModal.length);

    irASlide(0);
}

function irASlide(index) {
    imagenActual = index;
    const track = document.getElementById('carrusel-track');
    track.style.transform = `translateX(-${index * 100}%)`;

    // Actualizar dots
    document.querySelectorAll('.carrusel-dot').forEach((dot, i) => {
        dot.classList.toggle('activo', i === index);
    });
}

function cerrarModal() {
    const modal = document.getElementById('producto-modal');
    modal.style.display = 'none';
    document.body.style.overflow = '';
    imagenActual = 0;
    imagenesModal = [];
}

// Inicializar eventos del modal al cargar la página
const modalEl = document.getElementById('producto-modal');
if (modalEl) {
    // Cerrar al hacer clic en el overlay (fondo)
    modalEl.addEventListener('click', function (e) {
        if (e.target === modalEl) cerrarModal();
    });

    // Cerrar con botón X
    document.getElementById('btn-cerrar-modal').addEventListener('click', cerrarModal);

    // Navegar con teclas de flecha, cerrar con Escape
    document.addEventListener('keydown', function (e) {
        if (modalEl.style.display !== 'flex') return;
        if (e.key === 'Escape') cerrarModal();
        if (e.key === 'ArrowRight') irASlide((imagenActual + 1) % imagenesModal.length);
        if (e.key === 'ArrowLeft') irASlide((imagenActual - 1 + imagenesModal.length) % imagenesModal.length);
    });
}
