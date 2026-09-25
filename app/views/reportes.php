<?php /** Reportes: ventas por rango de fechas + productos más vendidos + exportar. */ ?>
<div class="card panel mb-3 no-print">
    <div class="card-body">
        <form id="formReporte" class="row g-3 align-items-end">
            <div class="col-6 col-md-auto">
                <label class="form-label" for="repDesde">Desde</label>
                <input type="date" id="repDesde" class="form-control" value="<?= date('Y-m-01') ?>">
            </div>
            <div class="col-6 col-md-auto">
                <label class="form-label" for="repHasta">Hasta</label>
                <input type="date" id="repHasta" class="form-control" value="<?= date('Y-m-d') ?>">
            </div>
            <div class="col-6 col-md-auto">
                <button class="btn btn-primary w-100" type="submit">
                    <i class="bi bi-funnel" aria-hidden="true"></i> Generar
                </button>
            </div>
            <div class="col-6 col-md-auto">
                <button type="button" class="btn btn-outline-secondary w-100" onclick="window.print()">
                    <i class="bi bi-printer" aria-hidden="true"></i> Imprimir / PDF
                </button>
            </div>
        </form>
    </div>
</div>

<h2 class="h6 text-muted mb-2" id="tituloPeriodo">Período seleccionado</h2>

<div class="row g-3 mb-3" id="resumenReporte" aria-live="polite"></div>

<div class="row g-3">
    <div class="col-lg-7">
        <div class="card panel">
            <div class="card-header"><i class="bi bi-table" aria-hidden="true"></i> Ventas del período</div>
            <div class="table-responsive">
                <table class="table table-sm table-hover mb-0">
                    <caption class="visually-hidden">Ventas registradas en el rango de fechas seleccionado</caption>
                    <thead>
                        <tr>
                            <th scope="col">Factura</th>
                            <th scope="col">Fecha</th>
                            <th scope="col">Cliente</th>
                            <th scope="col">Método</th>
                            <th scope="col" class="text-end">Total</th>
                        </tr>
                    </thead>
                    <tbody id="tablaReporte">
                        <tr><td colspan="5" class="empty-state">Generando reporte…</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <div class="col-lg-5">
        <div class="card panel">
            <div class="card-header"><i class="bi bi-trophy" aria-hidden="true"></i> Productos más vendidos</div>
            <div class="table-responsive">
                <table class="table table-sm mb-0">
                    <caption class="visually-hidden">Ranking de productos por unidades vendidas</caption>
                    <thead>
                        <tr>
                            <th scope="col">Producto</th>
                            <th scope="col" class="text-center">Uds.</th>
                            <th scope="col" class="text-end">Ingresos</th>
                        </tr>
                    </thead>
                    <tbody id="tablaTop">
                        <tr><td colspan="3" class="empty-state">Cargando…</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>

<script>
async function generarReporte(e) {
    if (e) e.preventDefault();
    const desde = document.getElementById('repDesde').value;
    const hasta = document.getElementById('repHasta').value;

    if (desde && hasta && desde > hasta) {
        toast('La fecha inicial no puede ser posterior a la final.', false);
        return;
    }

    const res = await api(`/api/reportes/ventas?desde=${desde}&hasta=${hasta}`);
    if (!res.ok) { toast(res.mensaje, false); return; }

    const r = res.data.resumen;
    document.getElementById('tituloPeriodo').textContent =
        `Período del ${res.data.desde} al ${res.data.hasta}`;

    document.getElementById('resumenReporte').innerHTML = `
        <div class="col-6 col-md-3"><div class="kpi-card kpi-primary">
            <div class="kpi-icon" aria-hidden="true"><i class="bi bi-receipt"></i></div>
            <div><div class="kpi-value">${r.num}</div><div class="kpi-label">Ventas</div></div></div></div>
        <div class="col-6 col-md-3"><div class="kpi-card kpi-success">
            <div class="kpi-icon" aria-hidden="true"><i class="bi bi-cash"></i></div>
            <div><div class="kpi-value">${money(r.total)}</div><div class="kpi-label">Total vendido</div></div></div></div>
        <div class="col-6 col-md-3"><div class="kpi-card kpi-info">
            <div class="kpi-icon" aria-hidden="true"><i class="bi bi-percent"></i></div>
            <div><div class="kpi-value">${money(r.iva)}</div><div class="kpi-label">IVA recaudado</div></div></div></div>
        <div class="col-6 col-md-3"><div class="kpi-card kpi-warning">
            <div class="kpi-icon" aria-hidden="true"><i class="bi bi-tag"></i></div>
            <div><div class="kpi-value">${money(r.descuento)}</div><div class="kpi-label">Descuentos</div></div></div></div>`;

    const tbody = document.getElementById('tablaReporte');
    tbody.innerHTML = res.data.ventas.length
        ? res.data.ventas.map(v => `<tr>
            <td class="fw-semibold">#${String(v.id).padStart(6, '0')}</td>
            <td>${fechaCorta(v.fecha)}</td>
            <td>${escapeHtml(v.cliente || 'Consumidor Final')}</td>
            <td class="text-capitalize">${escapeHtml(v.metodo_pago)}</td>
            <td class="text-end">${money(v.total)}</td></tr>`).join('')
        : `<tr><td colspan="5" class="empty-state">
            <i class="bi bi-calendar-x" aria-hidden="true"></i> Sin ventas en el período seleccionado.</td></tr>`;
}

async function cargarTop() {
    const res = await api('/api/reportes/productos-vendidos');
    const tbody = document.getElementById('tablaTop');
    tbody.innerHTML = (res.ok && res.data.length)
        ? res.data.map(p => `<tr>
            <td>${escapeHtml(p.nombre)}<br><small class="text-muted">${escapeHtml(p.categoria || '—')}</small></td>
            <td class="text-center fw-semibold">${p.unidades}</td>
            <td class="text-end">${money(p.ingresos)}</td></tr>`).join('')
        : `<tr><td colspan="3" class="empty-state">
            <i class="bi bi-bar-chart" aria-hidden="true"></i> Aún no hay datos de ventas.</td></tr>`;
}

document.getElementById('formReporte').addEventListener('submit', generarReporte);
generarReporte();
cargarTop();
</script>
