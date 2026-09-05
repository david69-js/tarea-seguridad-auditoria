<?php /** Dashboard: KPIs, gráficas (Chart.js), clima (OpenWeather) y alertas. */ ?>
<div class="row g-3 mb-3">
    <div class="col-6 col-xl-3">
        <div class="kpi-card kpi-primary">
            <div class="kpi-icon" aria-hidden="true"><i class="bi bi-cash-coin"></i></div>
            <div>
                <div class="kpi-value" id="kpiVentasHoy">—</div>
                <div class="kpi-label">Ventas de hoy <span id="kpiNumHoy" class="text-muted"></span></div>
            </div>
        </div>
    </div>
    <div class="col-6 col-xl-3">
        <div class="kpi-card kpi-success">
            <div class="kpi-icon" aria-hidden="true"><i class="bi bi-calendar-check"></i></div>
            <div>
                <div class="kpi-value" id="kpiVentasMes">—</div>
                <div class="kpi-label">Ventas del mes <span id="kpiNumMes" class="text-muted"></span></div>
            </div>
        </div>
    </div>
    <div class="col-6 col-xl-3">
        <div class="kpi-card kpi-info">
            <div class="kpi-icon" aria-hidden="true"><i class="bi bi-box-seam"></i></div>
            <div>
                <div class="kpi-value" id="kpiProductos">—</div>
                <div class="kpi-label">Productos activos</div>
            </div>
        </div>
    </div>
    <div class="col-6 col-xl-3">
        <div class="kpi-card kpi-warning">
            <div class="kpi-icon" aria-hidden="true"><i class="bi bi-exclamation-triangle"></i></div>
            <div>
                <div class="kpi-value" id="kpiStockBajo">—</div>
                <div class="kpi-label">Stock bajo (&lt; 5 unidades)</div>
            </div>
        </div>
    </div>
</div>

<!-- Clima actual: API externa OpenWeatherMap (consultada desde el servidor) -->
<div class="row g-3 mb-3">
    <div class="col-12">
        <section class="weather-card" id="climaCard" aria-live="polite" aria-label="Clima actual">
            <i class="bi bi-cloud-sun" style="font-size:2.4rem" aria-hidden="true"></i>
            <div>
                <div class="weather-temp">Consultando clima…</div>
                <div class="weather-desc">OpenWeatherMap</div>
            </div>
        </section>
    </div>
</div>

<div class="row g-3">
    <div class="col-lg-8">
        <div class="card panel h-100">
            <div class="card-header"><i class="bi bi-graph-up-arrow" aria-hidden="true"></i> Ventas de los últimos 7 días</div>
            <div class="card-body">
                <div class="chart-box"><canvas id="chartDias" height="110"
                     aria-label="Gráfica de líneas con las ventas diarias de los últimos 7 días" role="img"></canvas></div>
            </div>
        </div>
    </div>
    <div class="col-lg-4">
        <div class="card panel h-100">
            <div class="card-header"><i class="bi bi-trophy" aria-hidden="true"></i> Productos más vendidos</div>
            <div class="card-body">
                <div class="chart-box"><canvas id="chartTop" height="200"
                     aria-label="Gráfica de anillo con los cinco productos más vendidos" role="img"></canvas></div>
            </div>
        </div>
    </div>
    <div class="col-lg-8">
        <div class="card panel h-100">
            <div class="card-header"><i class="bi bi-bar-chart" aria-hidden="true"></i> Ventas por mes (últimos 6 meses)</div>
            <div class="card-body">
                <div class="chart-box"><canvas id="chartMeses" height="110"
                     aria-label="Gráfica de barras con las ventas de los últimos 6 meses" role="img"></canvas></div>
            </div>
        </div>
    </div>
    <div class="col-lg-4">
        <div class="card panel h-100">
            <div class="card-header"><i class="bi bi-bell" aria-hidden="true"></i> Alertas de inventario</div>
            <ul class="list-group list-group-flush" id="listaStockBajo">
                <li class="list-group-item text-muted">Cargando…</li>
            </ul>
        </div>
    </div>
</div>

<script>
/* Estilo común de las gráficas, para que las tres se lean igual.
   Se aplica dentro de DOMContentLoaded porque Chart.js se carga al final
   del layout, después de este script. */
const ejeQuetzales = {
    y: { beginAtZero: true, grid: { color: '#eef2f7' },
         ticks: { callback: (v) => 'Q ' + v.toLocaleString('es-GT') } },
    x: { grid: { display: false } }
};

document.addEventListener('DOMContentLoaded', async () => {
    Chart.defaults.font.family = "'Inter', system-ui, sans-serif";
    Chart.defaults.color = '#5b6b82';
    Chart.defaults.plugins.tooltip.callbacks.label = (ctx) =>
        ` ${ctx.dataset.label || ctx.label}: ${money(ctx.parsed.y ?? ctx.parsed)}`;

    const res = await api('/api/reportes/dashboard');
    if (!res.ok) { toast(res.mensaje || 'No se pudo cargar el dashboard.', false); return; }
    const d = res.data;

    // --- KPIs ---
    document.getElementById('kpiVentasHoy').textContent = money(d.kpis.ventas_hoy);
    document.getElementById('kpiVentasMes').textContent = money(d.kpis.ventas_mes);
    document.getElementById('kpiProductos').textContent = d.kpis.total_productos;
    document.getElementById('kpiStockBajo').textContent = d.kpis.stock_bajo;
    document.getElementById('kpiNumHoy').textContent = `· ${d.kpis.num_ventas_hoy} facturas`;
    document.getElementById('kpiNumMes').textContent = `· ${d.kpis.num_ventas_mes} facturas`;

    // --- Ventas por día ---
    new Chart(document.getElementById('chartDias'), {
        type: 'line',
        data: {
            labels: d.ventas_por_dia.map(x => x.dia),
            datasets: [{
                label: 'Ventas', data: d.ventas_por_dia.map(x => +x.total),
                borderColor: '#4f46e5', backgroundColor: 'rgba(79,70,229,.12)',
                fill: true, tension: .35, pointRadius: 4, pointBackgroundColor: '#4f46e5',
                borderWidth: 2
            }]
        },
        options: { responsive: true, plugins: { legend: { display: false } }, scales: ejeQuetzales }
    });

    // --- Ventas por mes ---
    new Chart(document.getElementById('chartMeses'), {
        type: 'bar',
        data: {
            labels: d.ventas_por_mes.map(x => x.mes),
            datasets: [{ label: 'Ventas', data: d.ventas_por_mes.map(x => +x.total),
                backgroundColor: '#059669', borderRadius: 6, maxBarThickness: 56 }]
        },
        options: { responsive: true, plugins: { legend: { display: false } }, scales: ejeQuetzales }
    });

    // --- Top de productos (unidades, no quetzales) ---
    new Chart(document.getElementById('chartTop'), {
        type: 'doughnut',
        data: {
            labels: d.top_productos.map(x => x.nombre),
            datasets: [{
                data: d.top_productos.map(x => +x.unidades),
                backgroundColor: ['#4f46e5', '#059669', '#d97706', '#dc2626', '#0284c7'],
                borderWidth: 2, borderColor: '#fff'
            }]
        },
        options: {
            responsive: true, cutout: '62%',
            plugins: {
                legend: { position: 'bottom', labels: { boxWidth: 10, padding: 12, font: { size: 11 } } },
                tooltip: { callbacks: { label: (ctx) => ` ${ctx.label}: ${ctx.parsed} unidades` } }
            }
        }
    });

    // --- Alertas de inventario ---
    const bajos = await api('/api/productos?stock_bajo=1');
    const ul = document.getElementById('listaStockBajo');
    if (bajos.ok && bajos.data.length) {
        ul.innerHTML = bajos.data.map(p => `
            <li class="list-group-item d-flex justify-content-between align-items-center gap-2">
                <span>${escapeHtml(p.nombre)}<br><small class="text-muted">${escapeHtml(p.codigo)}</small></span>
                <span class="pill pill-danger">${p.stock} u.</span></li>`).join('');
    } else {
        ul.innerHTML = `<li class="list-group-item text-success">
            <i class="bi bi-check-circle" aria-hidden="true"></i> Sin alertas de stock.</li>`;
    }

    cargarClima();
});

/* ------------------------------------------------------------------ */
/*  Clima actual (API externa: OpenWeatherMap)                         */
/*  Si no hay API key configurada, la tarjeta lo dice en vez de        */
/*  quedarse cargando para siempre.                                    */
/* ------------------------------------------------------------------ */
async function cargarClima() {
    const card = document.getElementById('climaCard');
    const res = await api('/api/clima');

    if (!res.ok) {
        card.classList.add('is-off');
        card.innerHTML = `
            <i class="bi bi-cloud-slash" style="font-size:2rem" aria-hidden="true"></i>
            <div>
                <div class="fw-semibold">Clima no disponible</div>
                <div class="small">${escapeHtml(res.detalle || res.mensaje)}</div>
            </div>`;
        return;
    }

    const c = res.data;
    card.classList.remove('is-off');
    card.innerHTML = `
        <img src="https://openweathermap.org/img/wn/${escapeHtml(c.icono)}@2x.png"
             alt="${escapeHtml(c.descripcion)}" width="56" height="56">
        <div>
            <div class="weather-temp">${c.temperatura} °C</div>
            <div class="weather-desc">${escapeHtml(c.descripcion)} · ${escapeHtml(c.ciudad)}, ${escapeHtml(c.pais)}</div>
            <div class="weather-meta">
                Sensación ${c.sensacion} °C · Humedad ${c.humedad}% · Viento ${c.viento} km/h
                · Actualizado ${escapeHtml(c.actualizado)}
            </div>
        </div>`;
}
</script>
