const configForm = document.getElementById("configForm");
const pagoForm = document.getElementById("pagoForm");
const pagosTableBody = document.querySelector("#pagosTable tbody");
const btnReiniciar = document.getElementById("reiniciarTodo");
const fechaPagoInput = document.getElementById("fechaPago");
const montoPagoInput = document.getElementById("montoPago");
const btnAgregarPago = document.getElementById("btnAgregarPago");
const comprobanteInput = document.getElementById("comprobantePago");

let pagos = JSON.parse(localStorage.getItem("pagos")) || [];

const configGuardada = JSON.parse(localStorage.getItem("configuracion"));
if (configGuardada) {
    ["totalTomado", "separacion", "inicial", "cuotaMensual", "cantidadCuotas", "fechaInicioCuotas"].forEach(id => {
        document.getElementById(id).value = configGuardada[id];
    });
}

// ✅ Validación dinámica del formulario
function validarFormularioPago() {
    const fechaValida = fechaPagoInput.value.trim() !== "";
    const montoValido = montoPagoInput.value.trim() !== "" && parseFloat(montoPagoInput.value) > 0;
    btnAgregarPago.disabled = !(fechaValida && montoValido);
}
fechaPagoInput.addEventListener("input", validarFormularioPago);
montoPagoInput.addEventListener("input", validarFormularioPago);
validarFormularioPago(); // 🔒 Desactiva por defecto

configForm.addEventListener("submit", e => {
    e.preventDefault();
    const data = {
        totalTomado: parseFloat(document.getElementById("totalTomado").value),
        separacion: parseFloat(document.getElementById("separacion").value),
        inicial: parseFloat(document.getElementById("inicial").value),
        cuotaMensual: parseFloat(document.getElementById("cuotaMensual").value),
        cantidadCuotas: parseInt(document.getElementById("cantidadCuotas").value),
        fechaInicioCuotas: document.getElementById("fechaInicioCuotas").value
    };
    localStorage.setItem("configuracion", JSON.stringify(data));
    alert("✅ Configuración guardada correctamente");
});

pagoForm.addEventListener("submit", e => {
    e.preventDefault();
    const fecha = fechaPagoInput.value;
    const monto = parseFloat(montoPagoInput.value);
    const file = comprobanteInput.files[0];
    const reader = new FileReader();

    reader.onload = function () {
        const comprobante = reader.result;
        pagos.push({ fecha, monto, comprobante });
        localStorage.setItem("pagos", JSON.stringify(pagos));
        renderPagos();
        pagoForm.reset();
        validarFormularioPago();
        document.getElementById("nombreArchivo").textContent = "Ningún archivo seleccionado";
    };

    if (file) {
        reader.readAsDataURL(file);
    } else {
        pagos.push({ fecha, monto, comprobante: null });
        localStorage.setItem("pagos", JSON.stringify(pagos));
        renderPagos();
        pagoForm.reset();
        validarFormularioPago();
        document.getElementById("nombreArchivo").textContent = "Ningún archivo seleccionado";
    }
});

comprobanteInput.addEventListener("change", function () {
    const nombre = this.files[0] ? this.files[0].name : "Ningún archivo seleccionado";
    document.getElementById("nombreArchivo").textContent = nombre;
});

btnReiniciar.addEventListener("click", () => {
    if (confirm("¿Estás seguro de reiniciar todo?")) {
        localStorage.clear();
        location.reload();
    }
});

function renderPagos() {
    pagosTableBody.innerHTML = "";
    pagos.forEach((pago, i) => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td><input type="date" value="${pago.fecha}" onchange="actualizarPago(${i}, 'fecha', this.value)"/></td>
            <td><input type="number" step="0.01" value="${pago.monto}" onchange="actualizarPago(${i}, 'monto', parseFloat(this.value))"/></td>
            <td>
                ${pago.comprobante ? `<button onclick="verComprobante('${pago.comprobante.replace(/'/g, "\\'")}', ${i})">👁️ Ver</button>` : '—'}
                <br/>
                <label class="file-label">📎
                    <input type="file" onchange="actualizarComprobante(this.files[0], ${i})"/>
                </label>
            </td>
            <td><button onclick="eliminarPago(${i})">🗑️</button></td>
        `;

        pagosTableBody.appendChild(row);
    });
}

function actualizarPago(i, campo, valor) {
    pagos[i][campo] = valor;
    localStorage.setItem("pagos", JSON.stringify(pagos));
}

function actualizarComprobante(file, i) {
    const reader = new FileReader();
    reader.onload = function () {
        pagos[i].comprobante = reader.result;
        localStorage.setItem("pagos", JSON.stringify(pagos));
        renderPagos();
    };
    reader.readAsDataURL(file);
}

function eliminarPago(i) {
    pagos.splice(i, 1);
    localStorage.setItem("pagos", JSON.stringify(pagos));
    renderPagos();
}

function verComprobante(dataUrl, index) {
    const modal = document.getElementById("modalComprobante");
    const iframe = document.getElementById("comprobanteViewer");
    const link = document.getElementById("descargarComprobante");
    modal.style.display = "block";
    iframe.src = dataUrl;
    link.href = dataUrl;
}

document.querySelector(".modal .close").onclick = () => {
    document.getElementById("modalComprobante").style.display = "none";
};

// Acordeón
document.addEventListener('DOMContentLoaded', () => {
    const headers = document.querySelectorAll('.accordion-header');
    headers.forEach(header => {
        header.addEventListener('click', () => {
            header.classList.toggle('active');
            const content = header.nextElementSibling;
            if (header.classList.contains('active')) {
                content.style.maxHeight = content.scrollHeight + "px";
                content.style.paddingTop = "0.5rem";
            } else {
                content.style.maxHeight = null;
                content.style.paddingTop = "0";
            }
        });
    });

    validarFormularioPago(); // vuelve a validar en caso de recarga
    renderPagos();
});
