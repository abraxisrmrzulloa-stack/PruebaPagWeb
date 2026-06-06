// PEGA AQUÍ LA URL QUE TE DIO GOOGLE APPS SCRIPT
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbycozQaj8b42DeCKp2fRv0Nwbivo8kguFKP1SXZr0pRWbTAHSjWKqhRnkET7Z6Z7xA/exec";

document.getElementById('appointmentForm').addEventListener('submit', function(e) {
    e.preventDefault(); // Evitar que la página se recargue
    
    const btn = document.querySelector('.btn-submit');
    btn.innerText = "Enviando...";
    btn.disabled = true;

    // Recolectar los datos del formulario
    const datos = {
        propietario: document.getElementById('propietario').value,
        mascota: document.getElementById('mascota').value,
        telefono: document.getElementById('telefono').value,
        fecha: document.getElementById('fecha').value,
        notas: document.getElementById('notas').value
    };

    // Enviar los datos a Google Sheets usando fetch
    fetch(WEB_APP_URL, {
        method: 'POST',
        mode: 'no-cors', // Necesario para evitar problemas de CORS con Google
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(datos)
    })
    .then(() => {
        // Como usamos no-cors, asumimos éxito si no hay error de red
        document.getElementById('appointmentForm').reset();
        document.getElementById('mensajeExito').className = "mensaje-visible";
        btn.innerText = "Enviar Solicitud";
        btn.disabled = false;
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Hubo un problema al enviar la cita. Inténtalo de nuevo.');
        btn.disabled = false;
    });
});

// Asegúrate de que esta URL sea la de tu Google Apps Script
// Si ya la tienes declarada arriba en tu archivo, no la vuelvas a escribir.
// const WEB_APP_URL = "TU_URL_DE_GOOGLE_APPS_SCRIPT_AQUI";

// Código para cargar productos si estamos en la página de la tienda
if (document.getElementById('contenedor-productos')) {
    cargarProductos();
}

function cargarProductos() {
    const contenedor = document.getElementById('contenedor-productos');

    // Hacemos la petición a Google Sheets (ejecuta el doGet del script)
    fetch(WEB_APP_URL)
        .then(response => response.json())
        .then(productos => {
            // Limpiamos el mensaje de "Cargando..."
            contenedor.innerHTML = "";

            if (productos.length === 0) {
                contenedor.innerHTML = "<p>Por el momento no hay productos disponibles.</p>";
                return;
            }

            // Recorremos cada producto de la lista y creamos su Card
            productos.forEach(producto => {
                const card = document.createElement('div');
                card.className = 'product-card';

                // Si no hay imagen en el Excel, ponemos una por defecto
                const urlImagen = producto.imagen || 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?q=80&w=300';

                card.innerHTML = `
                    <div class="product-img-box">
                        <img src="${urlImagen}" alt="${producto.nombre}">
                    </div>
                    <div class="product-info">
                        <span class="product-id">ID: #${producto.id}</span>
                        <h3>${producto.nombre}</h3>
                        <p>${producto.descripcion}</p>
                        <a href="https://wa.me/521234567890?text=Hola,%20me%20interesa%20el%20producto%20${encodeURIComponent(producto.nombre)}" class="btn-interes" target="_blank">
                            <i class="fab fa-whatsapp"></i> Preguntar por WhatsApp
                        </a>
                    </div>
                `;
                contenedor.appendChild(card);
            });
        })
        .catch(error => {
            console.error('Error al cargar productos:', error);
            contenedor.innerHTML = "<p>Hubo un error al cargar la tienda. Inténtalo más tarde.</p>";
        });
}