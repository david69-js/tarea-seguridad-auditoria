<?php /** Historial de ventas con acceso a la factura y anulación (admin). */ ?>
<div class="page-head">
    <p class="page-sub">Últimas 200 ventas registradas. Cada una tiene su factura imprimible con código QR.</p>
    <div class="toolbar">
        <label class="visually-hidden" for="buscarVenta">Buscar venta</label>
        <div class="input-group" style="max-width: 300px;">
            <span class="input-group-text"><i class="bi bi-search" aria-hidden="true"></i></span>
            <input id="buscarVenta" type="search" class="form-control" placeholder="Filtrar por cliente o cajero…">
        </div>
        <a href="<?= base_url('/pos') ?>" class="btn btn-primary">
            <i class="bi bi-plus-lg" aria-hidden="true"></i> Nueva venta
        </a>
    </div>
</div>

<div class="card panel">
    <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
            <caption class="visually-hidden">Historial de ventas registradas</caption>
            <thead>
                <tr>
                    <th scope="col">Factura</th>
                    <th scope="col">Fecha</th>
                    <th scope="col">Cliente</th>
                    <th scope="col">Cajero</th>
                    <th scope="col">Método</th>
                    <th scope="col" class="text-end">Total</th>
                    <th scope="col">Estado</th>
                    <th scope="col" class="text-end">Acciones</th>
                </tr>
            </thead>
            <tbody id="tablaVentas">
                <tr><td colspan="8" class="empty-state">Cargando ventas…</td></tr>
            </tbody>
        </table>
    </div>
</div>

<script>
let ventas = [];

async function cargarVentas() {
    const res = await api('/api/ventas');
    ventas = res.ok ? res.data : [];
    pintarVentas();
}

function pintarVentas() {
    const filtro = document.getElementById('buscarVenta').value.toLowerCase().trim();
    const lista = filtro
        ? ventas.filter(v => `${v.cliente || ''} ${v.cajero}`.toLowerCase().includes(filtro))
        : ventas;
    const tbody = document.getElementById('tablaVentas');

    if (!lista.length) {
        tbody.innerHTML = `<tr><td colspan="8" class="empty-state">
            <i class="bi bi-receipt" aria-hidden="true"></i> No hay ventas que mostrar.</td></tr>`;
        return;
    }

    tbody.innerHTML = lista.map(v => {
        const anulada = v.estado === 'anulada';
        const estado = anulada
            ? '<span class="pill pill-danger"><i class="bi bi-x-circle" aria-hidden="true"></i> Anulada</span>'
            : '<span class="pill pill-success"><i class="bi bi-check-circle" aria-hidden="true"></i> Completada</span>';
        const botonAnular = anulada ? '' : `
            <button class="btn btn-sm btn-outline-danger" type="button" onclick="anular(${v.id})"
                    aria-label="Anular la venta ${v.id}" title="Anular venta">
                <i class="bi bi-x-circle" aria-hidden="true"></i></button>`;

        return `<tr>
            <td class="fw-semibold">#${String(v.id).padStart(6, '0')}</td>
            <td>${fechaCorta(v.fecha)}</td>
            <td>${escapeHtml(v.cliente || 'Consumidor Final')}</td>
            <td>${escapeHtml(v.cajero)}</td>
            <td class="text-capitalize">${escapeHtml(v.metodo_pago)}</td>
            <td class="text-end fw-semibold">${money(v.total)}</td>
            <td>${estado}</td>
            <td>
                <div class="row-actions">
                    <a class="btn btn-sm btn-outline-primary" href="${BASE_URL}/ventas/${v.id}" target="_blank"
                       rel="noopener" aria-label="Ver factura ${v.id}" title="Ver factura">
                        <i class="bi bi-receipt" aria-hidden="true"></i></a>
                    <span data-admin-only>${botonAnular}</span>
                </div>
            </td></tr>`;
    }).join('');
    aplicarPermisos();
}

async function anular(id) {
    if (!confirm('¿Anular esta venta?\n\nSe devolverá el stock de los productos al inventario.')) return;
    const res = await api('/api/ventas/' + id + '/anular', { method: 'POST' });
    toast(res.mensaje, res.ok);
    if (res.ok) cargarVentas();
}

document.getElementById('buscarVenta').addEventListener('input', pintarVentas);
cargarVentas();
</script>
