import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { fechaCorta, fechaISO, folio, money } from '../lib/formato';
import { useToast } from '../lib/toast';
import FilaVacia from '../components/FilaVacia';
import Kpi from '../components/Kpi';

/* Reportes: ventas por rango de fechas, productos más vendidos y (solo
   admin) rentabilidad por producto: más y menos rentables del período. */

function primeroDelMes() {
    const hoy = new Date();
    return fechaISO(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
}

export default function Reportes() {
    const toast = useToast();
    const { esAdmin } = useAuth();
    const [rentabilidad, setRentabilidad] = useState(null);
    const [desde, setDesde] = useState(primeroDelMes);
    const [hasta, setHasta] = useState(() => fechaISO());
    const [reporte, setReporte] = useState(null);
    const [top, setTop] = useState(null);

    const generar = async (e) => {
        e?.preventDefault();
        if (desde && hasta && desde > hasta) {
            toast('La fecha inicial no puede ser posterior a la final.', false);
            return;
        }
        const res = await api(`/api/reportes/ventas?desde=${desde}&hasta=${hasta}`);
        if (res.ok) setReporte(res.data);
        else toast(res.mensaje, false);

        if (esAdmin) {
            const ren = await api(`/api/reportes/rentabilidad?desde=${desde}&hasta=${hasta}`);
            setRentabilidad(ren.ok ? ren.data : null);
        }
    };

    useEffect(() => {
        generar();
        api('/api/reportes/productos-vendidos').then((res) => setTop(res.ok ? res.data : []));
    }, []);

    const r = reporte?.resumen;

    return (
        <>
            <div className="card panel mb-3 no-print">
                <div className="card-body">
                    <form className="row g-3 align-items-end" onSubmit={generar}>
                        <div className="col-6 col-md-auto">
                            <label className="form-label" htmlFor="repDesde">Desde</label>
                            <input type="date" id="repDesde" className="form-control" value={desde} onChange={(e) => setDesde(e.target.value)} />
                        </div>
                        <div className="col-6 col-md-auto">
                            <label className="form-label" htmlFor="repHasta">Hasta</label>
                            <input type="date" id="repHasta" className="form-control" value={hasta} onChange={(e) => setHasta(e.target.value)} />
                        </div>
                        <div className="col-6 col-md-auto">
                            <button className="btn btn-primary w-100" type="submit">
                                <i className="bi bi-funnel" aria-hidden="true"></i> Generar
                            </button>
                        </div>
                        <div className="col-6 col-md-auto">
                            <button type="button" className="btn btn-outline-secondary w-100" onClick={() => window.print()}>
                                <i className="bi bi-printer" aria-hidden="true"></i> Imprimir / PDF
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <h2 className="h6 text-muted mb-2">
                {reporte ? `Período del ${reporte.desde} al ${reporte.hasta}` : 'Período seleccionado'}
            </h2>

            <div className="row g-3 mb-3" aria-live="polite">
                {r && <>
                    <div className="col-6 col-md-3"><Kpi tono="primary" icono="bi-receipt" valor={r.num}>Ventas</Kpi></div>
                    <div className="col-6 col-md-3"><Kpi tono="success" icono="bi-cash" valor={money(r.total)}>Total vendido</Kpi></div>
                    <div className="col-6 col-md-3"><Kpi tono="info" icono="bi-calculator" valor={money(r.num ? r.total / r.num : 0)}>Promedio por venta</Kpi></div>
                    <div className="col-6 col-md-3"><Kpi tono="warning" icono="bi-tag" valor={money(r.descuento)}>Descuentos</Kpi></div>
                </>}
            </div>

            <div className="row g-3">
                <div className="col-lg-7">
                    <div className="card panel">
                        <div className="card-header"><i className="bi bi-table" aria-hidden="true"></i> Ventas del período</div>
                        <div className="table-responsive">
                            <table className="table table-sm table-hover mb-0">
                                <caption className="visually-hidden">Ventas registradas en el rango de fechas seleccionado</caption>
                                <thead>
                                    <tr>
                                        <th scope="col">Venta</th>
                                        <th scope="col">Fecha</th>
                                        <th scope="col">Cliente</th>
                                        <th scope="col" className="text-end">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {!reporte && <FilaVacia columnas={4}>Generando reporte…</FilaVacia>}
                                    {reporte?.ventas.length === 0 && (
                                        <FilaVacia columnas={4} icono="bi-calendar-x">Sin ventas en el período seleccionado.</FilaVacia>
                                    )}
                                    {reporte?.ventas.map((v) => (
                                        <tr key={v.id}>
                                            <td className="fw-semibold">#{folio(v.id)}</td>
                                            <td>{fechaCorta(v.fecha)}</td>
                                            <td>{v.cliente || 'Cliente General'}</td>
                                            <td className="text-end">{money(v.total)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="col-lg-5">
                    <div className="card panel">
                        <div className="card-header"><i className="bi bi-trophy" aria-hidden="true"></i> Productos más vendidos</div>
                        <div className="table-responsive">
                            <table className="table table-sm mb-0">
                                <caption className="visually-hidden">Ranking de productos por unidades vendidas</caption>
                                <thead>
                                    <tr>
                                        <th scope="col">Producto</th>
                                        <th scope="col" className="text-center">Uds.</th>
                                        <th scope="col" className="text-end">Ingresos</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {top === null && <FilaVacia columnas={3}>Cargando…</FilaVacia>}
                                    {top?.length === 0 && <FilaVacia columnas={3} icono="bi-bar-chart">Aún no hay datos de ventas.</FilaVacia>}
                                    {top?.map((p) => (
                                        <tr key={p.codigo}>
                                            <td>{p.nombre}<br /><small className="text-muted">{p.categoria || '—'}</small></td>
                                            <td className="text-center fw-semibold">{p.unidades}</td>
                                            <td className="text-end">{money(p.ingresos)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {esAdmin && rentabilidad && <Rentabilidad datos={rentabilidad} />}
        </>
    );
}

/* ------------------------------------------------------------------ */
/*  Rentabilidad por producto (solo admin)                             */
/*  Ganancia por unidad = precio de venta − precio de compra.          */
/*  Ganancia generada = unidades vendidas × ganancia al momento de     */
/*  cada venta. Los 3 primeros y los 3 últimos se marcan como más y    */
/*  menos rentables.                                                   */
/* ------------------------------------------------------------------ */
function Rentabilidad({ datos }) {
    const lista = datos.productos;
    const top = 3;

    return (
        <section className="mt-4" aria-labelledby="tituloRentabilidad">
            <h2 className="h6 text-muted mb-2" id="tituloRentabilidad">
                Rentabilidad por producto · del {datos.desde} al {datos.hasta}
            </h2>

            <div className="row g-3 mb-3">
                <div className="col-12 col-md-4">
                    <Kpi tono="success" icono="bi-graph-up-arrow" valor={money(datos.ganancia_bruta)}>Ganancia bruta</Kpi>
                </div>
                <div className="col-6 col-md-4">
                    <Kpi tono="warning" icono="bi-tag" valor={`− ${money(datos.descuentos)}`}>Descuentos</Kpi>
                </div>
                <div className="col-6 col-md-4">
                    <Kpi tono="primary" icono="bi-piggy-bank" valor={money(datos.ganancia_neta)}>Ganancia neta</Kpi>
                </div>
            </div>

            <div className="card panel">
                <div className="card-header"><i className="bi bi-bar-chart-steps" aria-hidden="true"></i> Productos más y menos rentables</div>
                <div className="table-responsive">
                    <table className="table table-sm table-hover align-middle mb-0">
                        <caption className="visually-hidden">Productos ordenados por ganancia generada en el período</caption>
                        <thead>
                            <tr>
                                <th scope="col">#</th>
                                <th scope="col">Producto</th>
                                <th scope="col" className="text-end">Compra</th>
                                <th scope="col" className="text-end">Venta</th>
                                <th scope="col" className="text-end">Ganancia / u.</th>
                                <th scope="col" className="text-center">Uds. vendidas</th>
                                <th scope="col" className="text-end">Ganancia generada</th>
                            </tr>
                        </thead>
                        <tbody>
                            {lista.length === 0 && <FilaVacia columnas={7} icono="bi-box">No hay productos activos.</FilaVacia>}
                            {lista.map((p, i) => {
                                const mas = i < top && p.ganancia_total > 0;
                                const menos = i >= lista.length - top;
                                return (
                                    <tr key={p.id}>
                                        <td className="text-muted">{i + 1}</td>
                                        <td>
                                            {p.nombre}
                                            {mas && <span className="pill pill-success ms-2">Más rentable</span>}
                                            {menos && <span className="pill pill-danger ms-2">Menos rentable</span>}
                                            <br /><small className="text-muted">{p.categoria || '—'}</small>
                                        </td>
                                        <td className="text-end text-muted">{money(p.precio_compra)}</td>
                                        <td className="text-end">{money(p.precio)}</td>
                                        <td className="text-end">{money(p.ganancia)} <small className="text-muted">({p.margen}%)</small></td>
                                        <td className="text-center">{p.unidades}</td>
                                        <td className={`text-end fw-semibold ${p.ganancia_total > 0 ? 'text-success' : 'text-muted'}`}>
                                            {money(p.ganancia_total)}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
            <p className="form-hint mt-2">
                La ganancia por producto es bruta; los descuentos se aplican a la venta completa y se restan en la ganancia neta.
            </p>
        </section>
    );
}
