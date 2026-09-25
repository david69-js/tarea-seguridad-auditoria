import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { fechaCorta, folio, money } from '../lib/formato';
import { useToast } from '../lib/toast';
import FilaVacia from '../components/FilaVacia';

/* Historial de ventas con acceso a la factura y anulación (admin). */

export default function Ventas() {
    const { esAdmin } = useAuth();
    const toast = useToast();
    const [ventas, setVentas] = useState(null);
    const [filtro, setFiltro] = useState('');

    const cargar = useCallback(async () => {
        const res = await api('/api/ventas');
        setVentas(res.ok ? res.data : []);
    }, []);

    useEffect(() => { cargar(); }, [cargar]);

    const anular = async (id) => {
        if (!confirm('¿Anular esta venta?\n\nSe devolverá el stock de los productos al inventario.')) return;
        const res = await api('/api/ventas/' + id + '/anular', { method: 'POST' });
        toast(res.mensaje, res.ok);
        if (res.ok) cargar();
    };

    const texto = filtro.toLowerCase().trim();
    const lista = (ventas ?? []).filter((v) =>
        !texto || `${v.cliente || ''} ${v.cajero}`.toLowerCase().includes(texto));

    return (
        <>
            <div className="page-head">
                <p className="page-sub">Últimas 200 ventas registradas. Cada una tiene su factura imprimible con código QR.</p>
                <div className="toolbar">
                    <label className="visually-hidden" htmlFor="buscarVenta">Buscar venta</label>
                    <div className="input-group" style={{ maxWidth: 300 }}>
                        <span className="input-group-text"><i className="bi bi-search" aria-hidden="true"></i></span>
                        <input id="buscarVenta" type="search" className="form-control" placeholder="Filtrar por cliente o cajero…"
                               value={filtro} onChange={(e) => setFiltro(e.target.value)} />
                    </div>
                    <Link to="/pos" className="btn btn-primary">
                        <i className="bi bi-plus-lg" aria-hidden="true"></i> Nueva venta
                    </Link>
                </div>
            </div>

            <div className="card panel">
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <caption className="visually-hidden">Historial de ventas registradas</caption>
                        <thead>
                            <tr>
                                <th scope="col">Factura</th>
                                <th scope="col">Fecha</th>
                                <th scope="col">Cliente</th>
                                <th scope="col">Cajero</th>
                                <th scope="col">Método</th>
                                <th scope="col" className="text-end">Total</th>
                                <th scope="col">Estado</th>
                                <th scope="col" className="text-end">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ventas === null && <FilaVacia columnas={8}>Cargando ventas…</FilaVacia>}
                            {ventas !== null && !lista.length && <FilaVacia columnas={8} icono="bi-receipt">No hay ventas que mostrar.</FilaVacia>}
                            {lista.map((v) => {
                                const anulada = v.estado === 'anulada';
                                return (
                                    <tr key={v.id}>
                                        <td className="fw-semibold">#{folio(v.id)}</td>
                                        <td>{fechaCorta(v.fecha)}</td>
                                        <td>{v.cliente || 'Consumidor Final'}</td>
                                        <td>{v.cajero}</td>
                                        <td className="text-capitalize">{v.metodo_pago}</td>
                                        <td className="text-end fw-semibold">{money(v.total)}</td>
                                        <td>
                                            {anulada
                                                ? <span className="pill pill-danger"><i className="bi bi-x-circle" aria-hidden="true"></i> Anulada</span>
                                                : <span className="pill pill-success"><i className="bi bi-check-circle" aria-hidden="true"></i> Completada</span>}
                                        </td>
                                        <td>
                                            <div className="row-actions">
                                                <a className="btn btn-sm btn-outline-primary" href={`/ventas/${v.id}`} target="_blank"
                                                   rel="noopener" aria-label={`Ver factura ${v.id}`} title="Ver factura">
                                                    <i className="bi bi-receipt" aria-hidden="true"></i>
                                                </a>
                                                {esAdmin && !anulada && (
                                                    <button className="btn btn-sm btn-outline-danger" type="button" onClick={() => anular(v.id)}
                                                            aria-label={`Anular la venta ${v.id}`} title="Anular venta">
                                                        <i className="bi bi-x-circle" aria-hidden="true"></i>
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}
