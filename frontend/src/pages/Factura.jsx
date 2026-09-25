import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { EMPRESA, QR_API } from '../lib/config';
import { folio, money } from '../lib/formato';
import { NoEncontrado } from './Errores';
import './Factura.css';

/**
 * Factura / recibo imprimible (pantalla completa, sin menú).
 * Integra la API externa de códigos QR: https://api.qrserver.com
 * El QR codifica los datos de la factura (verificable con cualquier lector).
 */
export default function Factura() {
    const { id } = useParams();
    const [venta, setVenta] = useState(undefined);   // undefined = cargando, null = no existe

    useEffect(() => {
        document.body.classList.add('factura-body');
        return () => document.body.classList.remove('factura-body');
    }, []);

    useEffect(() => {
        api('/api/ventas/' + encodeURIComponent(id)).then((res) => setVenta(res.ok ? res.data : null));
    }, [id]);

    useEffect(() => {
        if (venta) document.title = `Factura #${folio(venta.id)} · POS Librería`;
    }, [venta]);

    if (venta === undefined) return <p className="text-center text-muted">Cargando factura…</p>;
    if (venta === null) return <NoEncontrado />;

    const numero = folio(venta.id);
    const qrData = 'Factura POS Libreria\n'
        + `No: ${numero}\n`
        + `Fecha: ${venta.fecha}\n`
        + `Total: Q ${venta.total.toFixed(2)}\n`
        + `NIT: ${venta.cliente_nit ?? 'CF'}`;
    const qrUrl = `${QR_API}?size=160x160&data=${encodeURIComponent(qrData)}`;

    return (
        <main className="factura">
            <div className="text-center">
                <div className="logo" aria-hidden="true"><i className="bi bi-book-half"></i></div>
                <h1>{EMPRESA}</h1>
                <div className="muted">Punto de Venta · Guatemala</div>
            </div>

            <div className="linea"></div>

            <div className="d-flex justify-content-between">
                <div>
                    <div><strong>Factura No.</strong> {numero}</div>
                    <div className="muted">{venta.fecha}</div>
                </div>
                <div className="text-end">
                    {venta.estado === 'anulada'
                        ? <span className="estado estado-anulada">ANULADA</span>
                        : <span className="estado estado-pagada">PAGADA</span>}
                    <div className="muted text-capitalize mt-1">{venta.metodo_pago}</div>
                </div>
            </div>

            <div className="mt-2">
                <div><strong>Cliente:</strong> {venta.cliente_nombre ?? 'Consumidor Final'}</div>
                <div className="muted">NIT: {venta.cliente_nit ?? 'CF'} · Atendió: {venta.cajero}</div>
            </div>

            <div className="linea"></div>

            <table>
                <caption className="visually-hidden">Detalle de los productos facturados</caption>
                <thead>
                    <tr>
                        <th scope="col">Cant</th>
                        <th scope="col">Descripción</th>
                        <th scope="col" className="text-end">Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    {venta.detalle.map((d) => (
                        <tr key={d.id ?? d.id_producto}>
                            <td>{d.cantidad}</td>
                            <td>{d.producto}<br /><span className="muted">{money(d.precio_unitario)} c/u</span></td>
                            <td className="text-end">{money(d.subtotal)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="linea"></div>

            <table>
                <tbody>
                    <tr><td>Subtotal</td><td className="text-end">{money(venta.subtotal)}</td></tr>
                    {venta.descuento > 0 && (
                        <tr><td>Descuento</td><td className="text-end" style={{ color: '#b91c1c' }}>− {money(venta.descuento)}</td></tr>
                    )}
                    <tr><td>IVA (12%)</td><td className="text-end">{money(venta.iva)}</td></tr>
                    <tr>
                        <td className="total-final pt-2">TOTAL</td>
                        <td className="text-end total-final pt-2">{money(venta.total)}</td>
                    </tr>
                </tbody>
            </table>

            <div className="linea"></div>

            <div className="qr-box">
                <img src={qrUrl} width="160" height="160" alt={`Código QR con los datos de la factura ${numero}`} />
                <div className="muted mt-2">Escanee el código QR para verificar su factura</div>
            </div>

            <p className="text-center muted mt-3 mb-0">¡Gracias por su compra!</p>

            <div className="acciones no-print">
                <button className="btn btn-primary" type="button" onClick={() => window.print()}>
                    <i className="bi bi-printer" aria-hidden="true"></i> Imprimir / PDF
                </button>
                <Link className="btn btn-outline-secondary" to="/pos">
                    <i className="bi bi-arrow-left" aria-hidden="true"></i> Volver al POS
                </Link>
            </div>
        </main>
    );
}
