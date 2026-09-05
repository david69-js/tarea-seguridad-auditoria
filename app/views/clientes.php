<?php /** CRUD de clientes. */ ?>
<div class="page-head">
    <p class="page-sub">Clientes registrados para facturación. «CF» equivale a consumidor final.</p>
    <div class="toolbar">
        <label class="visually-hidden" for="buscarCliente">Buscar cliente por nombre o NIT</label>
        <div class="input-group" style="max-width: 320px;">
            <span class="input-group-text"><i class="bi bi-search" aria-hidden="true"></i></span>
            <input id="buscarCliente" type="search" class="form-control" placeholder="Buscar por nombre o NIT…">
        </div>
        <button class="btn btn-primary" id="btnNuevoCliente" type="button">
            <i class="bi bi-person-plus" aria-hidden="true"></i> Nuevo cliente
        </button>
    </div>
</div>

<div class="card panel">
    <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
            <caption class="visually-hidden">Listado de clientes</caption>
            <thead>
                <tr>
                    <th scope="col">Nombre</th>
                    <th scope="col">NIT</th>
                    <th scope="col">Correo</th>
                    <th scope="col">Teléfono</th>
                    <th scope="col">Dirección</th>
                    <th scope="col" class="text-end">Acciones</th>
                </tr>
            </thead>
            <tbody id="tablaClientes">
                <tr><td colspan="6" class="empty-state">Cargando clientes…</td></tr>
            </tbody>
        </table>
    </div>
</div>

<div class="modal fade" id="modalCliente" tabindex="-1" aria-labelledby="tituloClienteModal" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered">
    <form class="modal-content" id="formCliente" novalidate>
      <div class="modal-header">
        <h2 class="modal-title h5" id="tituloClienteModal">
            <i class="bi bi-person" aria-hidden="true"></i>
            <span id="tituloCliente">Nuevo cliente</span>
        </h2>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
      </div>
      <div class="modal-body">
        <input type="hidden" id="cliId">
        <div class="mb-3">
            <label class="form-label" for="cliNombre">Nombre *</label>
            <input id="cliNombre" class="form-control" required autocomplete="name">
        </div>
        <div class="row g-3">
          <div class="col-sm-6">
            <label class="form-label" for="cliNit">NIT</label>
            <input id="cliNit" class="form-control" value="CF">
          </div>
          <div class="col-sm-6">
            <label class="form-label" for="cliTelefono">Teléfono</label>
            <input id="cliTelefono" type="tel" class="form-control" autocomplete="tel">
          </div>
        </div>
        <div class="mt-3">
            <label class="form-label" for="cliCorreo">Correo</label>
            <input id="cliCorreo" type="email" class="form-control" autocomplete="email">
        </div>
        <div class="mt-3">
            <label class="form-label" for="cliDireccion">Dirección</label>
            <input id="cliDireccion" class="form-control">
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
        <button type="submit" class="btn btn-primary" id="btnGuardarCliente">
            <i class="bi bi-save" aria-hidden="true"></i> Guardar
        </button>
      </div>
    </form>
  </div>
</div>

<script>
const modalCli = () => bootstrap.Modal.getOrCreateInstance('#modalCliente');
let clientes = [];

async function cargarClientes() {
    const q = document.getElementById('buscarCliente').value;
    const res = await api('/api/clientes?q=' + encodeURIComponent(q));
    clientes = res.ok ? res.data : [];
    const tbody = document.getElementById('tablaClientes');

    if (!clientes.length) {
        tbody.innerHTML = `<tr><td colspan="6" class="empty-state">
            <i class="bi bi-people" aria-hidden="true"></i> No hay clientes que coincidan.</td></tr>`;
        return;
    }

    tbody.innerHTML = clientes.map(c => `<tr>
        <td class="fw-semibold">${escapeHtml(c.nombre)}</td>
        <td><code>${escapeHtml(c.nit)}</code></td>
        <td>${escapeHtml(c.correo || '—')}</td>
        <td>${escapeHtml(c.telefono || '—')}</td>
        <td class="text-muted">${escapeHtml(c.direccion || '—')}</td>
        <td>
            <div class="row-actions">
                <button class="btn btn-sm btn-outline-primary" type="button" onclick="editarCliente(${c.id})"
                        aria-label="Editar a ${escapeHtml(c.nombre)}" title="Editar">
                    <i class="bi bi-pencil" aria-hidden="true"></i></button>
                <button class="btn btn-sm btn-outline-danger" type="button" data-admin-only
                        onclick='eliminarCliente(${c.id}, ${JSON.stringify(c.nombre)})'
                        aria-label="Eliminar a ${escapeHtml(c.nombre)}" title="Eliminar">
                    <i class="bi bi-trash" aria-hidden="true"></i></button>
            </div>
        </td></tr>`).join('');
    aplicarPermisos();
}

document.getElementById('btnNuevoCliente').addEventListener('click', () => {
    document.getElementById('formCliente').reset();
    document.getElementById('cliId').value = '';
    document.getElementById('cliNit').value = 'CF';
    document.getElementById('tituloCliente').textContent = 'Nuevo cliente';
    modalCli().show();
});

function editarCliente(id) {
    const c = clientes.find(x => x.id === id);
    if (!c) return;
    document.getElementById('cliId').value = c.id;
    document.getElementById('cliNombre').value = c.nombre;
    document.getElementById('cliNit').value = c.nit;
    document.getElementById('cliCorreo').value = c.correo || '';
    document.getElementById('cliTelefono').value = c.telefono || '';
    document.getElementById('cliDireccion').value = c.direccion || '';
    document.getElementById('tituloCliente').textContent = 'Editar cliente';
    modalCli().show();
}

async function eliminarCliente(id, nombre) {
    if (!confirm(`¿Eliminar al cliente "${nombre}"?`)) return;
    const res = await api('/api/clientes/' + id, { method: 'DELETE' });
    toast(res.mensaje, res.ok);
    if (res.ok) cargarClientes();
}

document.getElementById('formCliente').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!e.target.checkValidity()) { e.target.reportValidity(); return; }

    const id  = document.getElementById('cliId').value;
    const btn = document.getElementById('btnGuardarCliente');
    const body = {
        nombre:    document.getElementById('cliNombre').value.trim(),
        nit:       document.getElementById('cliNit').value.trim(),
        correo:    document.getElementById('cliCorreo').value.trim(),
        telefono:  document.getElementById('cliTelefono').value.trim(),
        direccion: document.getElementById('cliDireccion').value.trim(),
    };

    btn.disabled = true;
    const res = await api(id ? '/api/clientes/' + id : '/api/clientes',
                          { method: id ? 'PUT' : 'POST', body });
    btn.disabled = false;

    toast(res.mensaje, res.ok);
    if (res.ok) { modalCli().hide(); cargarClientes(); }
});

let dCli;
document.getElementById('buscarCliente').addEventListener('input', () => {
    clearTimeout(dCli); dCli = setTimeout(cargarClientes, 300);
});
cargarClientes();
</script>
