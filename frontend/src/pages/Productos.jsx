import { useCallback, useEffect, useState } from 'react';
import { api, apiForm } from '../lib/api';
import { useAuth } from '../lib/auth';
import { money } from '../lib/formato';
import { useDebounce } from '../lib/useDebounce';
import { useToast } from '../lib/toast';
import FilaVacia from '../components/FilaVacia';
import Modal from '../components/Modal';

/* Inventario de productos: CRUD, búsqueda, alerta de stock, imagen. */

const VACIO = { id: '', codigo: '', nombre: '', descripcion: '', precio: '', stock: '0', id_categoria: '' };

export default function Productos() {
    const { esAdmin } = useAuth();
    const toast = useToast();

    const [categorias, setCategorias] = useState([]);
    const [productos, setProductos] = useState(null);
    const [busqueda, setBusqueda] = useState('');
    const q = useDebounce(busqueda);
    const [categoria, setCategoria] = useState('');
    const [soloBajos, setSoloBajos] = useState('');

    const [modal, setModal] = useState(false);
    const [form, setForm] = useState(VACIO);
    const [imagen, setImagen] = useState(null);
    const [guardando, setGuardando] = useState(false);

    useEffect(() => {
        api('/api/categorias').then((res) => setCategorias(res.ok ? res.data : []));
    }, []);

    const cargar = useCallback(async () => {
        const res = await api(`/api/productos?q=${encodeURIComponent(q)}&categoria=${categoria}&stock_bajo=${soloBajos}`);
        setProductos(res.ok ? res.data : []);
    }, [q, categoria, soloBajos]);

    useEffect(() => { cargar(); }, [cargar]);

    const cerrar = useCallback(() => setModal(false), []);

    const nuevo = () => {
        setForm(VACIO);
        setImagen(null);
        setModal(true);
    };

    const editar = async (id) => {
        const res = await api('/api/productos/' + id);
        if (!res.ok) { toast(res.mensaje, false); return; }
        const p = res.data;
        setForm({
            id: p.id, codigo: p.codigo, nombre: p.nombre, descripcion: p.descripcion || '',
            precio: String(p.precio), stock: String(p.stock), id_categoria: p.id_categoria ? String(p.id_categoria) : '',
        });
        setImagen(null);
        setModal(true);
    };

    const eliminar = async (p) => {
        if (!confirm(`¿Eliminar el producto "${p.nombre}"?\n\nSe da de baja del catálogo, pero se conserva en el historial de ventas.`)) return;
        const res = await api('/api/productos/' + p.id, { method: 'DELETE' });
        toast(res.mensaje, res.ok);
        if (res.ok) cargar();
    };

    const guardar = async () => {
        // multipart para permitir la imagen; el backend acepta PUT vía _method
        const fd = new FormData();
        for (const campo of ['codigo', 'nombre', 'descripcion', 'precio', 'stock', 'id_categoria']) {
            fd.append(campo, form[campo]);
        }
        if (imagen) fd.append('imagen', imagen);

        setGuardando(true);
        const res = await apiForm(form.id ? '/api/productos/' + form.id : '/api/productos', fd, form.id ? 'PUT' : 'POST');
        setGuardando(false);

        toast(res.mensaje, res.ok);
        if (res.ok) { setModal(false); cargar(); }
    };

    const campo = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    return (
        <>
            <div className="page-head">
                <p className="page-sub">Catálogo de la tienda. Los productos con menos de 5 unidades se marcan en rojo.</p>
                <div className="toolbar">
                    <label className="visually-hidden" htmlFor="buscador">Buscar producto por nombre o código</label>
                    <div className="input-group" style={{ maxWidth: 320 }}>
                        <span className="input-group-text"><i className="bi bi-search" aria-hidden="true"></i></span>
                        <input id="buscador" type="search" className="form-control" placeholder="Buscar por nombre o código…"
                               value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
                    </div>

                    <label className="visually-hidden" htmlFor="filtroCategoria">Filtrar por categoría</label>
                    <select id="filtroCategoria" className="form-select" style={{ minWidth: 190 }}
                            value={categoria} onChange={(e) => setCategoria(e.target.value)}>
                        <option value="">Todas las categorías</option>
                        {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                    </select>

                    <label className="visually-hidden" htmlFor="filtroStock">Filtrar por stock</label>
                    <select id="filtroStock" className="form-select" style={{ minWidth: 160 }}
                            value={soloBajos} onChange={(e) => setSoloBajos(e.target.value)}>
                        <option value="">Todo el stock</option>
                        <option value="1">Solo stock bajo</option>
                    </select>

                    {esAdmin && (
                        <button className="btn btn-primary" type="button" onClick={nuevo}>
                            <i className="bi bi-plus-lg" aria-hidden="true"></i> Nuevo producto
                        </button>
                    )}
                </div>
            </div>

            <div className="card panel">
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <caption className="visually-hidden">Listado de productos del inventario</caption>
                        <thead>
                            <tr>
                                <th scope="col"><span className="visually-hidden">Imagen</span></th>
                                <th scope="col">Código</th>
                                <th scope="col">Producto</th>
                                <th scope="col">Categoría</th>
                                <th scope="col" className="text-end">Precio</th>
                                <th scope="col" className="text-center">Stock</th>
                                <th scope="col" className="text-end">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {productos === null && <FilaVacia columnas={7}>Cargando inventario…</FilaVacia>}
                            {productos?.length === 0 && (
                                <FilaVacia columnas={7} icono="bi-inbox">No hay productos que coincidan con la búsqueda.</FilaVacia>
                            )}
                            {productos?.map((p) => (
                                <tr key={p.id}>
                                    <td>
                                        {p.imagen_url
                                            ? <img src={`/${p.imagen_url}`} className="prod-thumb" alt="" />
                                            : <div className="prod-thumb placeholder-thumb" aria-hidden="true"><i className="bi bi-image"></i></div>}
                                    </td>
                                    <td><code>{p.codigo}</code></td>
                                    <td>
                                        <div className="prod-nombre">{p.nombre}</div>
                                        {p.descripcion && <div className="prod-desc">{p.descripcion}</div>}
                                    </td>
                                    <td>{p.categoria || '—'}</td>
                                    <td className="text-end fw-semibold">{money(p.precio)}</td>
                                    <td className="text-center">
                                        {p.stock_bajo
                                            ? <><span className="pill pill-danger"><i className="bi bi-exclamation-triangle" aria-hidden="true"></i> {p.stock}</span>
                                                <span className="visually-hidden">unidades, stock bajo</span></>
                                            : <span className="pill pill-success">{p.stock}</span>}
                                    </td>
                                    <td>
                                        {esAdmin && (
                                            <div className="row-actions">
                                                <button className="btn btn-sm btn-outline-primary" type="button" onClick={() => editar(p.id)}
                                                        aria-label={`Editar ${p.nombre}`} title="Editar">
                                                    <i className="bi bi-pencil" aria-hidden="true"></i>
                                                </button>
                                                <button className="btn btn-sm btn-outline-danger" type="button" onClick={() => eliminar(p)}
                                                        aria-label={`Eliminar ${p.nombre}`} title="Eliminar">
                                                    <i className="bi bi-trash" aria-hidden="true"></i>
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal abierto={modal} onCerrar={cerrar} onSubmit={guardar} tamano="modal-lg" icono="bi-box-seam"
                   titulo={form.id ? 'Editar producto' : 'Nuevo producto'}
                   pie={<>
                       <button type="button" className="btn btn-secondary" onClick={cerrar}>Cancelar</button>
                       <button type="submit" className="btn btn-primary" disabled={guardando}>
                           <i className="bi bi-save" aria-hidden="true"></i> Guardar
                       </button>
                   </>}>
                <div className="row g-3">
                    <div className="col-md-4">
                        <label className="form-label" htmlFor="prodCodigo">Código *</label>
                        <input name="codigo" id="prodCodigo" className="form-control" required placeholder="LIB-001"
                               value={form.codigo} onChange={campo} />
                    </div>
                    <div className="col-md-8">
                        <label className="form-label" htmlFor="prodNombre">Nombre *</label>
                        <input name="nombre" id="prodNombre" className="form-control" required
                               value={form.nombre} onChange={campo} />
                    </div>
                    <div className="col-12">
                        <label className="form-label" htmlFor="prodDescripcion">Descripción</label>
                        <textarea name="descripcion" id="prodDescripcion" className="form-control" rows={2}
                                  value={form.descripcion} onChange={campo}></textarea>
                    </div>
                    <div className="col-md-4">
                        <label className="form-label" htmlFor="prodPrecio">Precio (Q) *</label>
                        <input name="precio" id="prodPrecio" type="number" step="0.01" min="0" className="form-control" required
                               value={form.precio} onChange={campo} />
                    </div>
                    <div className="col-md-4">
                        <label className="form-label" htmlFor="prodStock">Stock</label>
                        <input name="stock" id="prodStock" type="number" min="0" className="form-control"
                               value={form.stock} onChange={campo} />
                    </div>
                    <div className="col-md-4">
                        <label className="form-label" htmlFor="prodCategoria">Categoría</label>
                        <select name="id_categoria" id="prodCategoria" className="form-select"
                                value={form.id_categoria} onChange={campo}>
                            <option value="">— Sin categoría —</option>
                            {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                        </select>
                    </div>
                    <div className="col-12">
                        <label className="form-label" htmlFor="prodImagen">Imagen del producto</label>
                        <input name="imagen" id="prodImagen" type="file" accept="image/*" className="form-control"
                               aria-describedby="ayudaImagen" onChange={(e) => setImagen(e.target.files[0] || null)} />
                        <p className="form-hint" id="ayudaImagen">JPG, PNG, WEBP o GIF · máximo 2 MB.</p>
                    </div>
                </div>
            </Modal>
        </>
    );
}
