import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { fechaCorta, fechaISO, folio, money } from '../lib/formato';
import { useToast } from '../lib/toast';
import FilaVacia from '../components/FilaVacia';
import Kpi from '../components/Kpi';

/* Reportes: ventas por rango de fechas + productos más vendidos + imprimir. */

function primeroDelMes() {
    const hoy = new Date();
    return fechaISO(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
}

export default function Reportes() {
    const toast = useToast();
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
                    <div className="col-6 col-md-3"><Kpi tono="info" icono="bi-percent" valor={money(r.iva)}>IVA recaudado</Kpi></div>
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
                                        <th scope="col">Factura</th>
                                        <th scope="col">Fecha</th>
                                        <th scope="col">Cliente</th>
                                        <th scope="col">Método</th>
                                        <th scope="col" className="text-end">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {!reporte && <FilaVacia columnas={5}>Generando reporte…</FilaVacia>}
                                    {reporte?.ventas.length === 0 && (
                                        <FilaVacia columnas={5} icono="bi-calendar-x">Sin ventas en el período seleccionado.</FilaVacia>
                                    )}
                                    {reporte?.ventas.map((v) => (
                                        <tr key={v.id}>
                                            <td className="fw-semibold">#{folio(v.id)}</td>
                                            <td>{fechaCorta(v.fecha)}</td>
                                            <td>{v.cliente || 'Consumidor Final'}</td>
                                            <td className="text-capitalize">{v.metodo_pago}</td>
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
        </>
    );
}
