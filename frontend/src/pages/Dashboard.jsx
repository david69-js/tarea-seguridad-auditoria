import { useEffect, useState } from 'react';
import {
    ArcElement, BarElement, CategoryScale, Chart as ChartJS, Filler,
    Legend, LinearScale, LineElement, PointElement, Tooltip,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { api } from '../lib/api';
import { money } from '../lib/formato';
import { useToast } from '../lib/toast';
import Kpi from '../components/Kpi';

/* Dashboard: KPIs, gráficas (Chart.js), clima (OpenWeather) y alertas. */

ChartJS.register(ArcElement, BarElement, CategoryScale, Filler, Legend, LinearScale, LineElement, PointElement, Tooltip);

/* Estilo común de las gráficas, para que las tres se lean igual. */
ChartJS.defaults.font.family = "'Inter', system-ui, sans-serif";
ChartJS.defaults.color = '#5b6b82';
ChartJS.defaults.plugins.tooltip.callbacks.label = (ctx) =>
    ` ${ctx.dataset.label || ctx.label}: ${money(ctx.parsed.y ?? ctx.parsed)}`;

const ejeQuetzales = {
    y: { beginAtZero: true, grid: { color: '#eef2f7' },
         ticks: { callback: (v) => 'Q ' + v.toLocaleString('es-GT') } },
    x: { grid: { display: false } },
};
const opcionesQuetzales = { responsive: true, plugins: { legend: { display: false } }, scales: ejeQuetzales };

function Panel({ icono, titulo, children }) {
    return (
        <div className="card panel h-100">
            <div className="card-header"><i className={`bi ${icono}`} aria-hidden="true"></i> {titulo}</div>
            {children}
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Clima actual (API externa: OpenWeatherMap, consultada en el        */
/*  servidor). Si no hay API key configurada, la tarjeta lo dice en    */
/*  vez de quedarse cargando para siempre.                             */
/* ------------------------------------------------------------------ */
function Clima() {
    const [res, setRes] = useState(null);
    useEffect(() => { api('/api/clima').then(setRes); }, []);

    if (!res) {
        return (
            <section className="weather-card" aria-live="polite" aria-label="Clima actual">
                <i className="bi bi-cloud-sun" style={{ fontSize: '2.4rem' }} aria-hidden="true"></i>
                <div>
                    <div className="weather-temp">Consultando clima…</div>
                    <div className="weather-desc">OpenWeatherMap</div>
                </div>
            </section>
        );
    }

    if (!res.ok) {
        return (
            <section className="weather-card is-off" aria-live="polite" aria-label="Clima actual">
                <i className="bi bi-cloud-slash" style={{ fontSize: '2rem' }} aria-hidden="true"></i>
                <div>
                    <div className="fw-semibold">Clima no disponible</div>
                    <div className="small">{res.detalle || res.mensaje}</div>
                </div>
            </section>
        );
    }

    const c = res.data;
    return (
        <section className="weather-card" aria-live="polite" aria-label="Clima actual">
            <img src={`https://openweathermap.org/img/wn/${encodeURIComponent(c.icono)}@2x.png`}
                 alt={c.descripcion} width="56" height="56" />
            <div>
                <div className="weather-temp">{c.temperatura} °C</div>
                <div className="weather-desc">{c.descripcion} · {c.ciudad}, {c.pais}</div>
                <div className="weather-meta">
                    Sensación {c.sensacion} °C · Humedad {c.humedad}% · Viento {c.viento} km/h
                    · Actualizado {c.actualizado}
                </div>
            </div>
        </section>
    );
}

export default function Dashboard() {
    const toast = useToast();
    const [d, setD] = useState(null);
    const [bajos, setBajos] = useState(null);

    useEffect(() => {
        api('/api/reportes/dashboard').then((res) => {
            if (res.ok) setD(res.data);
            else toast(res.mensaje || 'No se pudo cargar el dashboard.', false);
        });
        api('/api/productos?stock_bajo=1').then((res) => setBajos(res.ok ? res.data : []));
    }, [toast]);

    const k = d?.kpis;

    return (
        <>
            <div className="row g-3 mb-3">
                <div className="col-6 col-xl-3">
                    <Kpi tono="primary" icono="bi-cash-coin" valor={k ? money(k.ventas_hoy) : '—'}>
                        Ventas de hoy {k && <span className="text-muted">· {k.num_ventas_hoy} facturas</span>}
                    </Kpi>
                </div>
                <div className="col-6 col-xl-3">
                    <Kpi tono="success" icono="bi-calendar-check" valor={k ? money(k.ventas_mes) : '—'}>
                        Ventas del mes {k && <span className="text-muted">· {k.num_ventas_mes} facturas</span>}
                    </Kpi>
                </div>
                <div className="col-6 col-xl-3">
                    <Kpi tono="info" icono="bi-box-seam" valor={k ? k.total_productos : '—'}>Productos activos</Kpi>
                </div>
                <div className="col-6 col-xl-3">
                    <Kpi tono="warning" icono="bi-exclamation-triangle" valor={k ? k.stock_bajo : '—'}>
                        Stock bajo (&lt; 5 unidades)
                    </Kpi>
                </div>
            </div>

            <div className="row g-3 mb-3">
                <div className="col-12"><Clima /></div>
            </div>

            <div className="row g-3">
                <div className="col-lg-8">
                    <Panel icono="bi-graph-up-arrow" titulo="Ventas de los últimos 7 días">
                        <div className="card-body"><div className="chart-box">
                            {d && <Line height={110} role="img"
                                        aria-label="Gráfica de líneas con las ventas diarias de los últimos 7 días"
                                        options={opcionesQuetzales}
                                        data={{
                                            labels: d.ventas_por_dia.map((x) => x.dia),
                                            datasets: [{
                                                label: 'Ventas', data: d.ventas_por_dia.map((x) => +x.total),
                                                borderColor: '#4f46e5', backgroundColor: 'rgba(79,70,229,.12)',
                                                fill: true, tension: .35, pointRadius: 4, pointBackgroundColor: '#4f46e5',
                                                borderWidth: 2,
                                            }],
                                        }} />}
                        </div></div>
                    </Panel>
                </div>
                <div className="col-lg-4">
                    <Panel icono="bi-trophy" titulo="Productos más vendidos">
                        <div className="card-body"><div className="chart-box">
                            {/* Top de productos: unidades, no quetzales */}
                            {d && <Doughnut height={200} role="img"
                                            aria-label="Gráfica de anillo con los cinco productos más vendidos"
                                            options={{
                                                responsive: true, cutout: '62%',
                                                plugins: {
                                                    legend: { position: 'bottom', labels: { boxWidth: 10, padding: 12, font: { size: 11 } } },
                                                    tooltip: { callbacks: { label: (ctx) => ` ${ctx.label}: ${ctx.parsed} unidades` } },
                                                },
                                            }}
                                            data={{
                                                labels: d.top_productos.map((x) => x.nombre),
                                                datasets: [{
                                                    data: d.top_productos.map((x) => +x.unidades),
                                                    backgroundColor: ['#4f46e5', '#059669', '#d97706', '#dc2626', '#0284c7'],
                                                    borderWidth: 2, borderColor: '#fff',
                                                }],
                                            }} />}
                        </div></div>
                    </Panel>
                </div>
                <div className="col-lg-8">
                    <Panel icono="bi-bar-chart" titulo="Ventas por mes (últimos 6 meses)">
                        <div className="card-body"><div className="chart-box">
                            {d && <Bar height={110} role="img"
                                       aria-label="Gráfica de barras con las ventas de los últimos 6 meses"
                                       options={opcionesQuetzales}
                                       data={{
                                           labels: d.ventas_por_mes.map((x) => x.mes),
                                           datasets: [{ label: 'Ventas', data: d.ventas_por_mes.map((x) => +x.total),
                                               backgroundColor: '#059669', borderRadius: 6, maxBarThickness: 56 }],
                                       }} />}
                        </div></div>
                    </Panel>
                </div>
                <div className="col-lg-4">
                    <Panel icono="bi-bell" titulo="Alertas de inventario">
                        <ul className="list-group list-group-flush">
                            {bajos === null && <li className="list-group-item text-muted">Cargando…</li>}
                            {bajos?.length === 0 && (
                                <li className="list-group-item text-success">
                                    <i className="bi bi-check-circle" aria-hidden="true"></i> Sin alertas de stock.
                                </li>
                            )}
                            {bajos?.map((p) => (
                                <li key={p.id} className="list-group-item d-flex justify-content-between align-items-center gap-2">
                                    <span>{p.nombre}<br /><small className="text-muted">{p.codigo}</small></span>
                                    <span className="pill pill-danger">{p.stock} u.</span>
                                </li>
                            ))}
                        </ul>
                    </Panel>
                </div>
            </div>
        </>
    );
}
