import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import { money } from '../lib/formato';
import { useDebounce } from '../lib/useDebounce';
import { useToast } from '../lib/toast';
import FilaVacia from '../components/FilaVacia';

/* Punto de Venta (POS): búsqueda, carrito, descuento y cobro.
   Los precios son finales (sin IVA), el cobro es siempre en efectivo y no
   se emite factura. */

export default function Pos() {
    const toast = useToast();
    const buscador = useRef(null);

    const [busqueda, setBusqueda] = useState('');
    const q = useDebounce(busqueda);
    const [productos, setProductos] = useState(null);
    const [clientes, setClientes] = useState([]);

    const [carrito, setCarrito] = useState([]);   // { id, nombre, precio, cantidad, stock }
    const [idCliente, setIdCliente] = useState('');
    const [descuento, setDescuento] = useState('0');
    const [cobrando, setCobrando] = useState(false);
    const [aviso, setAviso] = useState('');

    /* ---------------- Catálogo ---------------- */
    const cargarProductos = useCallback(async () => {
        const res = await api('/api/productos?q=' + encodeURIComponent(q));
        setProductos(res.ok ? res.data : []);
    }, [q]);

    useEffect(() => { cargarProductos(); }, [cargarProductos]);

    useEffect(() => {
        api('/api/clientes').then((res) => {
            const lista = res.ok ? res.data : [];
            setClientes(lista);
            // Por defecto, el cliente genérico para ventas rápidas (la lista
            // viene en orden alfabético, así que no suele ser el primero).
            const general = lista.find((c) => c.nombre === 'Cliente General') ?? lista[0];
            if (general) setIdCliente(String(general.id));
        });
    }, []);

    /* ---------------- Carrito ---------------- */
    const agregar = (p) => {
        const item = carrito.find((x) => x.id === p.id);
        const enCarrito = item ? item.cantidad : 0;
        if (enCarrito + 1 > p.stock) { toast('No hay más stock disponible.', false); return; }
        setCarrito(item
            ? carrito.map((x) => (x.id === p.id ? { ...x, cantidad: x.cantidad + 1 } : x))
            : [...carrito, { id: p.id, nombre: p.nombre, precio: p.precio, cantidad: 1, stock: p.stock }]);
        setAviso(`${p.nombre} agregado al carrito.`);
    };

    const cambiarCantidad = (id, delta) => {
        const item = carrito.find((x) => x.id === id);
        if (!item) return;
        const nueva = item.cantidad + delta;
        if (nueva <= 0) setCarrito(carrito.filter((x) => x.id !== id));
        else if (nueva > item.stock) toast('La cantidad supera el stock disponible.', false);
        else setCarrito(carrito.map((x) => (x.id === id ? { ...x, cantidad: nueva } : x)));
    };

    const vaciar = () => { setCarrito([]); setDescuento('0'); };

    /* ---------------- Totales ---------------- */
    const subtotal = carrito.reduce((s, i) => s + i.precio * i.cantidad, 0);
    const desc = Math.min(parseFloat(descuento) || 0, subtotal);
    const total = subtotal - desc;
    const unidades = carrito.reduce((s, i) => s + i.cantidad, 0);

    // El descuento no puede superar el subtotal (el servidor también lo rechaza).
    useEffect(() => {
        if ((parseFloat(descuento) || 0) > subtotal) setDescuento(subtotal.toFixed(2));
    }, [descuento, subtotal]);

    /* ---------------- Cobro ---------------- */
    const cobrar = async () => {
        if (!carrito.length) return;
        setCobrando(true);
        const res = await api('/api/ventas', {
            method: 'POST',
            body: {
                id_cliente: idCliente || null,
                descuento: desc,
                items: carrito.map((i) => ({ id_producto: i.id, cantidad: i.cantidad })),
            },
        });
        setCobrando(false);

        if (res.ok) {
            vaciar();
            cargarProductos();
            toast(`Venta #${res.data.id} registrada: ${money(res.data.total)} en efectivo.`, true);
            buscador.current?.focus();
        } else {
            toast(res.mensaje, false);
        }
    };

    return (
        <div className="row g-3 pos-layout">
            {/* Panel de productos */}
            <div className="col-lg-7">
                <section className="card panel pos-panel" aria-label="Catálogo de productos">
                    <div className="card-header d-block">
                        <label className="visually-hidden" htmlFor="posBuscar">Buscar producto por nombre o código</label>
                        <div className="input-group input-group-lg">
                            <span className="input-group-text"><i className="bi bi-upc-scan" aria-hidden="true"></i></span>
                            <input id="posBuscar" ref={buscador} type="search" className="form-control"
                                   placeholder="Buscar o escanear producto…" autoFocus autoComplete="off"
                                   value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
                        </div>
                    </div>
                    <div className="pos-scroll">
                        <div className="pos-grid">
                            {productos === null && <p className="text-muted m-0">Cargando productos…</p>}
                            {productos?.length === 0 && <p className="text-muted m-0">Sin resultados para esa búsqueda.</p>}
                            {productos?.map((p) => (
                                <button key={p.id} type="button" className="pos-item" disabled={p.stock <= 0}
                                        onClick={() => agregar(p)}
                                        aria-label={`Agregar ${p.nombre}, ${money(p.precio)}, ${p.stock} en existencia`}>
                                    <span className="pos-item-nombre">{p.nombre}</span>
                                    <span className="pos-item-codigo">{p.codigo}</span>
                                    <span className="pos-item-precio">{money(p.precio)}</span>
                                    <span className={`pos-item-stock ${p.stock_bajo ? 'text-danger' : 'text-muted'}`}>
                                        {p.stock <= 0 ? 'Agotado' : 'Stock: ' + p.stock}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </section>
            </div>

            {/* Panel del carrito */}
            <div className="col-lg-5">
                <section className="card panel pos-panel" aria-label="Carrito de la venta">
                    <div className="card-header justify-content-between">
                        <span><i className="bi bi-cart3" aria-hidden="true"></i> Carrito
                            <span className="pill pill-neutral ms-1">{unidades}</span></span>
                        <button className="btn btn-sm btn-outline-danger" type="button" onClick={vaciar}>
                            <i className="bi bi-trash" aria-hidden="true"></i> Vaciar
                        </button>
                    </div>

                    <div className="pos-scroll">
                        <table className="table table-sm cart-table align-middle mb-0">
                            <caption className="visually-hidden">Productos agregados a la venta actual</caption>
                            <thead>
                                <tr>
                                    <th scope="col">Producto</th>
                                    <th scope="col" className="text-center">Cantidad</th>
                                    <th scope="col" className="text-end">Subtotal</th>
                                    <th scope="col"><span className="visually-hidden">Quitar</span></th>
                                </tr>
                            </thead>
                            <tbody>
                                {!carrito.length && <FilaVacia columnas={4} icono="bi-cart">El carrito está vacío</FilaVacia>}
                                {carrito.map((i) => (
                                    <tr key={i.id}>
                                        <td>
                                            <div className="fw-semibold">{i.nombre}</div>
                                            <small className="text-muted">{money(i.precio)} c/u</small>
                                        </td>
                                        <td className="text-center">
                                            <span className="qty-group">
                                                <button type="button" onClick={() => cambiarCantidad(i.id, -1)}
                                                        aria-label={`Quitar una unidad de ${i.nombre}`}>−</button>
                                                <span className="qty">{i.cantidad}</span>
                                                <button type="button" onClick={() => cambiarCantidad(i.id, 1)}
                                                        aria-label={`Agregar una unidad de ${i.nombre}`}>+</button>
                                            </span>
                                        </td>
                                        <td className="text-end fw-semibold">{money(i.precio * i.cantidad)}</td>
                                        <td className="text-end">
                                            <button className="btn btn-sm btn-link text-danger p-1" type="button"
                                                    onClick={() => cambiarCantidad(i.id, -i.cantidad)}
                                                    aria-label={`Quitar ${i.nombre} del carrito`}>
                                                <i className="bi bi-x-lg" aria-hidden="true"></i>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="card-footer bg-white">
                        <div className="d-flex gap-2 align-items-center mb-3">
                            <label className="visually-hidden" htmlFor="posCliente">Cliente</label>
                            <select id="posCliente" className="form-select form-select-sm"
                                    value={idCliente} onChange={(e) => setIdCliente(e.target.value)}>
                                {clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                            </select>
                            <span className="pill pill-success text-nowrap">
                                <i className="bi bi-cash" aria-hidden="true"></i> Efectivo
                            </span>
                        </div>

                        <div className="totales">
                            <div className="fila"><span>Subtotal</span><span>{money(subtotal)}</span></div>
                            <div className="fila">
                                <label htmlFor="tDescuento" className="mb-0">Descuento</label>
                                <div className="input-group input-group-sm" style={{ width: 135 }}>
                                    <span className="input-group-text">Q</span>
                                    <input id="tDescuento" type="number" min="0" step="0.01" className="form-control text-end"
                                           value={descuento} onChange={(e) => setDescuento(e.target.value)} />
                                </div>
                            </div>
                            <hr className="my-2" />
                            <div className="fila total-grande"><span>TOTAL</span><span>{money(total)}</span></div>
                        </div>

                        <button className="btn btn-success w-100 btn-cobrar mt-3" type="button"
                                disabled={!carrito.length || cobrando} onClick={cobrar}>
                            {cobrando
                                ? <><span className="spinner-border spinner-border-sm" aria-hidden="true"></span> Procesando…</>
                                : <><i className="bi bi-check2-circle" aria-hidden="true"></i> Cobrar</>}
                        </button>
                        <p className="visually-hidden" role="status">{aviso}</p>
                    </div>
                </section>
            </div>
        </div>
    );
}
