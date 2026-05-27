const API_BASE = "http://localhost:3000/api";
let todasSolicitudes = [];
let estadosMap = new Map();
let currentPage = 1;
const rowsPerPage = 7;
let currentFilters = {
  identificacion: "",
  estado: "",
  fechaDesde: "",
  fechaHasta: "",
};
let solicitudEnModal = null;
let isSending = false;

function showMessage(text, isError = false) {
  const msg = document.createElement("div");
  msg.className = "toast";
  msg.style.background = isError ? "#dc2626" : "#10b981";
  msg.innerText = text;
  document.body.appendChild(msg);
  setTimeout(() => msg.remove(), 3000);
}

function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/[&<>]/g, function (m) {
    if (m === "&") return "&amp;";
    if (m === "<") return "&lt;";
    if (m === ">") return "&gt;";
    return m;
  });
}

async function fetchEstados() {
  try {
    const res = await fetch(`${API_BASE}/estados`);
    if (!res.ok) throw new Error();
    const data = await res.json();
    if (data.success && Array.isArray(data.data)) {
      data.data.forEach((e) => estadosMap.set(e.id, e.nombre));
    } else throw new Error();
  } catch (e) {
    console.warn(
      "No se pudo obtener /estados, se usarán desde las solicitudes",
    );
  }
  renderEstadoFilter();
}

function renderEstadoFilter() {
  const select = document.getElementById("filterEstado");
  select.innerHTML = '<option value="">Todos</option>';
  for (let [id, nombre] of estadosMap.entries()) {
    select.innerHTML += `<option value="${id}">${nombre}</option>`;
  }
}

async function cargarSolicitudes() {
  const container = document.getElementById("solicitudesContainer");
  container.innerHTML = '<div class="loading">Cargando solicitudes...</div>';
  try {
    const res = await fetch(`${API_BASE}/solicitudes`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.success) throw new Error(data.error || "Error al cargar");
    todasSolicitudes = data.data || [];

    if (estadosMap.size === 0 && todasSolicitudes.length) {
      todasSolicitudes.forEach((s) => {
        if (s.id_estado_actual && s.estado_nombre) {
          estadosMap.set(s.id_estado_actual, s.estado_nombre);
        }
      });
      renderEstadoFilter();
    }
    aplicarFiltrosYRender();
  } catch (err) {
    container.innerHTML = `<div class="error-msg"> Error: ${err.message}</div>`;
  }
}

function filtrarSolicitudes() {
  let filtered = [...todasSolicitudes];
  const { identificacion, estado, fechaDesde, fechaHasta } = currentFilters;

  if (identificacion.trim()) {
    filtered = filtered.filter(
      (s) =>
        s.identificacion &&
        s.identificacion.toLowerCase().includes(identificacion.toLowerCase()),
    );
  }
  if (estado) {
    filtered = filtered.filter((s) => s.id_estado_actual == estado);
  }
  if (fechaDesde) {
    const desde = new Date(fechaDesde);
    desde.setHours(0, 0, 0, 0);
    filtered = filtered.filter((s) => new Date(s.created_at) >= desde);
  }
  if (fechaHasta) {
    const hasta = new Date(fechaHasta);
    hasta.setHours(23, 59, 59, 999);
    filtered = filtered.filter((s) => new Date(s.created_at) <= hasta);
  }
  return filtered;
}

function renderTabla(solicitudesFiltradas) {
  const container = document.getElementById("solicitudesContainer");
  const totalPages = Math.ceil(solicitudesFiltradas.length / rowsPerPage);
  const start = (currentPage - 1) * rowsPerPage;
  const paginated = solicitudesFiltradas.slice(start, start + rowsPerPage);

  if (solicitudesFiltradas.length === 0) {
    container.innerHTML =
      '<div class="loading">No hay solicitudes que coincidan con los filtros.</div>';
    document.getElementById("paginationContainer").innerHTML = "";
    return;
  }

  let html = `<div class="table-wrapper">
    <table>
      <thead>
        <tr><th>N° Crédito</th><th>Cliente</th><th>Identificación</th><th>Monto</th><th>Estado</th><th>Asesor</th><th>Auxiliar</th><th>Fecha</th><th>Acciones Detalles - Estado</th></tr>
      </thead>
      <tbody>`;
  paginated.forEach((s) => {
    const estadoNombre =
      estadosMap.get(s.id_estado_actual) || s.estado_nombre || "Desconocido";
    html += `<tr>
      <td>${escapeHtml(s.numero_credito)}</td>
      <td>${escapeHtml(s.cliente_nombre || "-")}</td>
      <td>${escapeHtml(s.identificacion || "-")}</td>
      <td>$${Number(s.monto_solicitado).toLocaleString()}</td>
      <td><span class="badge">${escapeHtml(estadoNombre)}</span></td>
      <td>${escapeHtml(s.asesor_nombre || "-")}</td>
      <td>${escapeHtml(s.auxiliar_nombre || "-")}</td>
      <td>${new Date(s.created_at).toLocaleDateString()}</td>
      <td class="actions">
        <button class="btn-icon view" data-id="${s.id}">Ver Detalles</button>
        <button class="btn-icon change" data-id="${s.id}">Cambiar Estado</button>
      </td>
    </tr>`;
  });
  html += `</tbody></table></div>`;
  container.innerHTML = html;

  let pagHtml = "";
  for (let i = 1; i <= totalPages; i++) {
    pagHtml += `<button class="${i === currentPage ? "active" : ""}" data-page="${i}">${i}</button>`;
  }
  document.getElementById("paginationContainer").innerHTML = pagHtml;
  document.querySelectorAll("#paginationContainer button").forEach((btn) => {
    btn.addEventListener("click", (e) => {currentPage = parseInt(btn.dataset.page);
      renderTabla(solicitudesFiltradas);
    });
  });

  document.querySelectorAll(".btn-icon.view").forEach((btn) => {
    btn.addEventListener("click", () => abrirDetalle(parseInt(btn.dataset.id)));
  });
  document.querySelectorAll(".btn-icon.change").forEach((btn) => {
    btn.addEventListener("click", () =>abrirDetalle(parseInt(btn.dataset.id), true),
    );
  });
}

function aplicarFiltrosYRender() {
  const filtradas = filtrarSolicitudes();
  currentPage = 1;
  renderTabla(filtradas);
}

async function abrirDetalle(id, focusChange = false) {
  const modal = document.getElementById("modalDetalle");
  const detalleDiv = document.getElementById("detalleBody");
  detalleDiv.innerHTML = '<div class="loading">Cargando detalles...</div>';
  modal.style.display = "flex";
  try {
    const res = await fetch(`${API_BASE}/solicitudes/${id}`);
    const data = await res.json();
     if (!data.success) throw new Error(data.error);
      const sol = data.data;
      const historial = data.historial || [];
      solicitudEnModal = sol;

    let html = `<div style="color: white"; style="margin-bottom: 16px;"><strong>N° Crédito:</strong> ${escapeHtml(sol.numero_credito)}</div>
                <div style="color: white";><strong>Cliente:</strong> ${escapeHtml(sol.cliente_nombre)} (ID: ${escapeHtml(sol.identificacion || "N/A")})</div>
                <div style="color: white";><strong>Monto:</strong> $${Number(sol.monto_solicitado).toLocaleString()}</div>
                <div style="color: white";><strong>Plazo:</strong> ${sol.plazo_meses} meses</div>
                <div style="color: white";><strong>Asesor:</strong> ${escapeHtml(sol.asesor_nombre)}</div>
                <div style="color: white";><strong>Auxiliar:</strong> ${escapeHtml(sol.auxiliar_nombre)}</div>
                <div style="color: white";><strong>Estado actual:</strong> ${estadosMap.get(sol.id_estado_actual) || sol.estado_nombre}</div>
                <hr><h4>Historial de cambios</h4>`;
    if (historial.length === 0) html += "<p>Sin cambios registrados</p>";
    historial.forEach((h) => {
      html += `<div style="margin-bottom: 8px;"><strong>${new Date(h.fecha_cambio).toLocaleString()}</strong> → ${h.estado_nuevo_nombre || h.id_estado_nuevo}<br>${h.comentario ? `📝 ${escapeHtml(h.comentario)}` : ""}</div>`;
    });
    detalleDiv.innerHTML = html;

    const select = document.getElementById("nuevoEstadoSelect");
    select.innerHTML = "";
    for (let [idEstado, nombre] of estadosMap.entries()) {
      const disabled = idEstado == sol.id_estado_actual ? "disabled" : "";
      select.innerHTML += `<option value="${idEstado}" ${disabled}>${nombre}</option>`;
    }
    document.getElementById("observacion").value = "";
    document.getElementById("changeMessage").innerHTML = "";
    if (focusChange) {
      document.querySelector(".form-change").scrollIntoView({ behavior: "smooth" });
    }
  } catch (err) {
    detalleDiv.innerHTML = `<div class="error-msg"> Error: ${err.message}</div>`;
  }
}

async function cambiarEstado() {
  if (isSending) return;
  if (!solicitudEnModal) return;
  const nuevoId = document.getElementById("nuevoEstadoSelect").value;
  const comentario = document.getElementById("observacion").value.trim();
  if (!nuevoId) {
    document.getElementById("changeMessage").innerHTML ='<span style="color:#dc2626">Seleccione un nuevo estado</span>';
    return;
  }
  if (!comentario) {
    document.getElementById("changeMessage").innerHTML ='<span style="color:#dc2626">La observación es obligatoria</span>';
    return;
  }
  isSending = true;
  const btn = document.getElementById("btnConfirmarCambio");
  btn.disabled = true;
  btn.textContent = "Enviando...";
  try {
    const res = await fetch(`${API_BASE}/solicitudes/${solicitudEnModal.id}/estado`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nuevo_estado_id: parseInt(nuevoId),
          comentario,
        }),
      },
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error al cambiar estado");
    showMessage("Estado actualizado correctamente");
    document.getElementById("changeMessage").innerHTML ='<span style="color:#10b981">¡Cambio exitoso! Cerrando...</span>';
    setTimeout(() => {
      document.getElementById("modalDetalle").style.display = "none";
      cargarSolicitudes();
    }, 1000);
  } catch (err) {
    document.getElementById("changeMessage").innerHTML =`<span style="color:#dc2626"> ${err.message}</span>`;
    showMessage(err.message, true);
  } finally {isSending = false; btn.disabled = false;
    btn.textContent = "Confirmar cambio";
  }
}

function cerrarModal() {
  document.getElementById("modalDetalle").style.display = "none";
  solicitudEnModal = null;
}

document.getElementById("btnFiltrar").addEventListener("click", () => {
  currentFilters = {
    identificacion: document.getElementById("filterIdentificacion").value,
    estado: document.getElementById("filterEstado").value,
    fechaDesde: document.getElementById("filterFechaDesde").value,
    fechaHasta: document.getElementById("filterFechaHasta").value,
  };
   aplicarFiltrosYRender();
 });

document.querySelector(".close-modal").addEventListener("click", cerrarModal);
  window.addEventListener("click", (e) => {
    if (e.target === document.getElementById("modalDetalle")) cerrarModal();
 });
document.getElementById("btnConfirmarCambio").addEventListener("click", cambiarEstado);

fetchEstados();
cargarSolicitudes();
