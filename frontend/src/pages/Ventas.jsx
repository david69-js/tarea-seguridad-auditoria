import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { fechaCorta, folio, money } from '../lib/formato';
import { useToast } from '../lib/toast';
import FilaVacia from '../components/FilaVacia';
import Modal from '../components/Modal';

/* Historial de ventas con su detalle y anulación (admin).
   No se emiten facturas: el detalle solo se consulta en pantalla. */

export default function Ventas() {
    const { esAdmin } = useAuth();
    const toast = useToast();
    const [ventas, setVentas] = useState(null);
    const [filtro, setFiltro] = useState('');
    const [detalle, setDetalle] = useState(null);

    const cargar = useCallback(async () => {
        const res = await api('/api/ventas');
        setVentas(res.ok ? res.data : []);
    }, []);

    useEffect(() => { cargar(); }, [cargar]);

    const verDetalle = async (id) => {
        const res = await api('/api/ventas/' + id);
        if (res.ok) setDetalle(res.data);
        else toast(res.mensaje, false);
    };
    const cerrarDetalle = useCallback(() => setDetalle(null), []);

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
                <p className="page-sub">Últimas 200 ventas registradas, todas cobradas en efectivo.</p>
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
                                <th scope="col">Venta</th>
                                <th scope="col">Fecha</th>
                                <th scope="col">Cliente</th>
                                <th scope="col">Cajero</th>
                                <th scope="col" className="text-end">Total</th>
                                <th scope="col">Estado</th>
                                <th scope="col" className="text-end">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ventas === null && <FilaVacia columnas={7}>Cargando ventas…</FilaVacia>}
                            {ventas !== null && !lista.length && <FilaVacia columnas={7} icono="bi-receipt">No hay ventas que mostrar.</FilaVacia>}
                            {lista.map((v) => {
                                const anulada = v.estado === 'anulada';
                                return (
                                    <tr key={v.id}>
                                        <td className="fw-semibold">#{folio(v.id)}</td>
                                        <td>{fechaCorta(v.fecha)}</td>
                                        <td>{v.cliente || 'Cliente General'}</td>
                                        <td>{v.cajero}</td>
                                        <td className="text-end fw-semibold">{money(v.total)}</td>
                                        <td>
                                            {anulada
                                                ? <span className="pill pill-danger"><i className="bi bi-x-circle" aria-hidden="true"></i> Anulada</span>
                                                : <span className="pill pill-success"><i className="bi bi-check-circle" aria-hidden="true"></i> Completada</span>}
                                        </td>
                                        <td>
                                            <div className="row-actions">
                                                <button className="btn btn-sm btn-outline-primary" type="button" onClick={() => verDetalle(v.id)}
                                                        aria-label={`Ver detalle de la venta ${v.id}`} title="Ver detalle">
                                                    <i className="bi bi-eye" aria-hidden="true"></i>
                                                </button>
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

            <Modal abierto={detalle !== null} onCerrar={cerrarDetalle} icono="bi-receipt"
                   titulo={detalle ? `Venta #${folio(detalle.id)}` : ''}
                   pie={<button type="button" className="btn btn-secondary" onClick={cerrarDetalle}>Cerrar</button>}>
                {detalle && <>
                    <p className="mb-1"><strong>Fecha:</strong> {fechaCorta(detalle.fecha)}</p>
                    <p className="mb-1"><strong>Cliente:</strong> {detalle.cliente_nombre || 'Cliente General'}</p>
                    <p className="mb-3"><strong>Atendió:</strong> {detalle.cajero}
                        {detalle.estado === 'anulada' && <span className="pill pill-danger ms-2">Anulada</span>}</p>
                    <table className="table table-sm align-middle mb-0">
                        <caption className="visually-hidden">Productos vendidos</caption>
                        <thead>
                            <tr>
                                <th scope="col">Producto</th>
                                <th scope="col" className="text-center">Cant.</th>
                                <th scope="col" className="text-end">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            {detalle.detalle.map((d) => (
                                <tr key={d.id}>
                                    <td>{d.producto}<br /><small className="text-muted">{money(d.precio_unitario)} c/u</small></td>
                                    <td className="text-center">{d.cantidad}</td>
                                    <td className="text-end">{money(d.subtotal)}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            {detalle.descuento > 0 && <>
                                <tr><td colSpan={2}>Subtotal</td><td className="text-end">{money(detalle.subtotal)}</td></tr>
                                <tr><td colSpan={2}>Descuento</td><td className="text-end text-danger">− {money(detalle.descuento)}</td></tr>
                            </>}
                            <tr className="fw-bold"><td colSpan={2}>Total (efectivo)</td><td className="text-end">{money(detalle.total)}</td></tr>
                        </tfoot>
                    </table>
                </>}
            </Modal>
        </>
    );
}
