function formatearDinero(valor) {
    return valor.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
    });
}

function obtenerNombreMes(fecha) {
    return fecha.toLocaleDateString('es-ES', { year: 'numeric', month: 'long' });
}

let datosFilas = [];
let filasPorPagina = 10;
let paginaActual = 1;
let filaEquivalente = -1;

function renderizarTablaPaginada() {
    const cuerpoTabla = document.getElementById("tablaEstadoCuenta");
    cuerpoTabla.innerHTML = "";

    const inicio = (paginaActual - 1) * filasPorPagina;
    const fin = inicio + filasPorPagina;
    const filasPagina = datosFilas.slice(inicio, fin);

    filasPagina.forEach((filaHTML, index) => {
        const tr = document.createElement("tr");
        tr.innerHTML = filaHTML;
        if ((inicio + index) === filaEquivalente) tr.classList.add("highlight-row");
        cuerpoTabla.appendChild(tr);
    });

    renderizarControlesPaginacion();
}

function renderizarControlesPaginacion() {
    const totalPaginas = Math.ceil(datosFilas.length / filasPorPagina);
    const paginacionDiv = document.getElementById("paginacion");
    paginacionDiv.innerHTML = `
    <button onclick="cambiarPagina(-1)" ${paginaActual === 1 ? 'disabled' : ''}>← Anterior</button>
    <span>Página ${paginaActual} de ${totalPaginas}</span>
    <button onclick="cambiarPagina(1)" ${paginaActual === totalPaginas ? 'disabled' : ''}>Siguiente →</button>
  `;
}

function cambiarPagina(direccion) {
    const totalPaginas = Math.ceil(datosFilas.length / filasPorPagina);
    paginaActual = Math.min(Math.max(1, paginaActual + direccion), totalPaginas);
    renderizarTablaPaginada();
}

function imprimirTodo() {
    const contenedorImpresion = document.getElementById("contenedorImpresion");
    const resumenImpresion = document.getElementById("resumenImpresion");
    const cuerpoTablaImpresion = document.getElementById("tablaCompletaImpresion");

    // Copiar el resumen
    resumenImpresion.innerHTML = document.getElementById("resumen").innerHTML;

    // Llenar la tabla completa con todas las filas
    cuerpoTablaImpresion.innerHTML = "";
    datosFilas.forEach((filaHTML, index) => {
        const tr = document.createElement("tr");
        tr.innerHTML = filaHTML;
        cuerpoTablaImpresion.appendChild(tr);
    });

    // Mostrar tabla completa solo para imprimir
    contenedorImpresion.style.display = "block";

    // Ocultar todo lo demás temporalmente
    document.querySelectorAll(".no-print").forEach(el => el.style.display = "none");
    document.getElementById("tablaEstadoCuentaCompleta").style.display = "none";

    // Imprimir
    window.print();

    // Restaurar elementos
    document.querySelectorAll(".no-print").forEach(el => el.style.display = "");
    document.getElementById("tablaEstadoCuentaCompleta").style.display = "";
    contenedorImpresion.style.display = "none";
}


function cargarEstadoCuenta() {
    const config = JSON.parse(localStorage.getItem("configuracion"));
    const pagos = JSON.parse(localStorage.getItem("pagos") || "[]");
    if (!config || pagos.length === 0) return;

    const resumen = document.getElementById("resumen");
    const {
        totalTomado, separacion, inicial,
        cuotaMensual, cantidadCuotas, fechaInicioCuotas
    } = config;

    const totalNeto = totalTomado - separacion - inicial;
    let pagadoAcumulado = 0, totalRestante = totalNeto;
    let excedenteArrastrado = 0;
    const pagosPorMes = {};
    pagos.forEach(p => {
        const [y, m] = p.fecha.split("-").map(Number);
        const clave = `${y}-${String(m).padStart(2, '0')}`;
        pagosPorMes[clave] = (pagosPorMes[clave] || 0) + p.monto;
    });

    const [anioInicio, mesInicio] = fechaInicioCuotas.split("-").map(Number);
    let fecha = new Date(anioInicio, mesInicio - 1);
    let totalPagado = 0, cuotasEquivalentesPagadas = 0;
    datosFilas = [];

    for (let i = 0; i < cantidadCuotas; i++) {
        const claveMes = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
        const pagadoMes = pagosPorMes[claveMes] || 0;
        const totalDisponible = pagadoMes + excedenteArrastrado;
        const restanteCuota = Math.max(cuotaMensual - totalDisponible, 0);
        const excedenteMes = Math.max(totalDisponible - cuotaMensual, 0);
        const cuotaCubierta = Math.min(totalDisponible, cuotaMensual);

        pagadoAcumulado += cuotaCubierta;
        totalPagado += pagadoMes;
        totalRestante = Math.max(totalRestante - cuotaCubierta, 0);
        excedenteArrastrado = excedenteMes;

        cuotasEquivalentesPagadas += cuotaCubierta / cuotaMensual;

        let color = "black", emoji = "";
        if (pagadoMes > 0) {
            if (excedenteMes > 0) { color = "blue"; emoji = "😊"; }
            else if (restanteCuota > 0) { color = "red"; emoji = "😟"; }
            else { color = "green"; emoji = "🙂"; }
        }

        const filaHTML = `
      <td>${i + 1}</td>
      <td>${obtenerNombreMes(fecha)}</td>
      <td>${formatearDinero(cuotaMensual)}</td>
      <td>${formatearDinero(pagadoAcumulado)}</td>
      <td>${formatearDinero(pagadoMes)}</td>
      <td style="color: ${color}">${formatearDinero(excedenteMes)} ${emoji}</td>
      <td>${formatearDinero(restanteCuota)}</td>
      <td>${formatearDinero(totalRestante)}</td>
    `;

        datosFilas.push(filaHTML);
        fecha.setMonth(fecha.getMonth() + 1);
    }

    const totalRecibido = totalPagado + inicial + separacion;
    const fechaEquivalente = new Date(anioInicio, mesInicio - 1);
    fechaEquivalente.setMonth(fechaEquivalente.getMonth() + Math.floor(cuotasEquivalentesPagadas));
    const equivaleMes = obtenerNombreMes(fechaEquivalente);
    filaEquivalente = Math.floor(cuotasEquivalentesPagadas);

    resumen.innerHTML = `
    <p><strong>Total tomado:</strong> ${formatearDinero(totalTomado)}</p>
    <p>Separación: ${formatearDinero(separacion)} | Inicial: ${formatearDinero(inicial)}</p>
    <p><strong>Total neto a pagar:</strong> ${formatearDinero(totalNeto)}</p>
    <p>Cuota mensual: ${formatearDinero(cuotaMensual)}</p>
    <p>Cantidad de cuotas: ${cantidadCuotas}</p>
    <p><strong>Total pagado:</strong> ${formatearDinero(totalPagado)}</p>
    <p class="green"><strong>Totales recibidos:</strong> ${formatearDinero(totalRecibido)}</p>
    <p><strong>Total restante:</strong> ${formatearDinero(totalRestante)}</p>
    <p class="highlight-row no-print"><strong>🎉 Equivale a haber pagado hasta el mes:</strong> ${equivaleMes}</p>
  `;

    renderizarTablaPaginada();
}

document.addEventListener("DOMContentLoaded", cargarEstadoCuenta);
