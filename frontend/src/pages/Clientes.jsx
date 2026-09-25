import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useDebounce } from '../lib/useDebounce';
import { useToast } from '../lib/toast';
import FilaVacia from '../components/FilaVacia';
import Modal from '../components/Modal';

/* CRUD de clientes. */

const VACIO = { id: '', nombre: '', correo: '', telefono: '', direccion: '' };

export default function Clientes() {
    const { esAdmin } = useAuth();
    const toast = useToast();

    const [clientes, setClientes] = useState(null);
    const [busqueda, setBusqueda] = useState('');
    const q = useDebounce(busqueda);

    const [modal, setModal] = useState(false);
    const [form, setForm] = useState(VACIO);
    const [guardando, setGuardando] = useState(false);

    const cargar = useCallback(async () => {
        const res = await api('/api/clientes?q=' + encodeURIComponent(q));
        setClientes(res.ok ? res.data : []);
    }, [q]);

    useEffect(() => { cargar(); }, [cargar]);

    const cerrar = useCallback(() => setModal(false), []);

    const abrir = (c = null) => {
        setForm(c
            ? { id: c.id, nombre: c.nombre, correo: c.correo || '', telefono: c.telefono || '', direccion: c.direccion || '' }
            : VACIO);
        setModal(true);
    };

    const eliminar = async (c) => {
        if (!confirm(`¿Eliminar al cliente "${c.nombre}"?`)) return;
        const res = await api('/api/clientes/' + c.id, { method: 'DELETE' });
        toast(res.mensaje, res.ok);
        if (res.ok) cargar();
    };

    const guardar = async () => {
        const body = {
            nombre: form.nombre.trim(),
            correo: form.correo.trim(),
            telefono: form.telefono.trim(),
            direccion: form.direccion.trim(),
        };
        setGuardando(true);
        const res = await api(form.id ? '/api/clientes/' + form.id : '/api/clientes',
                              { method: form.id ? 'PUT' : 'POST', body });
        setGuardando(false);

        toast(res.mensaje, res.ok);
        if (res.ok) { setModal(false); cargar(); }
    };

    const campo = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    return (
        <>
            <div className="page-head">
                <p className="page-sub">Clientes frecuentes de la tienda. Asignar un cliente a la venta es opcional.</p>
                <div className="toolbar">
                    <label className="visually-hidden" htmlFor="buscarCliente">Buscar cliente por nombre o teléfono</label>
                    <div className="input-group" style={{ maxWidth: 320 }}>
                        <span className="input-group-text"><i className="bi bi-search" aria-hidden="true"></i></span>
                        <input id="buscarCliente" type="search" className="form-control" placeholder="Buscar por nombre o teléfono…"
                               value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
                    </div>
                    <button className="btn btn-primary" type="button" onClick={() => abrir()}>
                        <i className="bi bi-person-plus" aria-hidden="true"></i> Nuevo cliente
                    </button>
                </div>
            </div>

            <div className="card panel">
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <caption className="visually-hidden">Listado de clientes</caption>
                        <thead>
                            <tr>
                                <th scope="col">Nombre</th>
                                <th scope="col">Correo</th>
                                <th scope="col">Teléfono</th>
                                <th scope="col">Dirección</th>
                                <th scope="col" className="text-end">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {clientes === null && <FilaVacia columnas={5}>Cargando clientes…</FilaVacia>}
                            {clientes?.length === 0 && <FilaVacia columnas={5} icono="bi-people">No hay clientes que coincidan.</FilaVacia>}
                            {clientes?.map((c) => (
                                <tr key={c.id}>
                                    <td className="fw-semibold">{c.nombre}</td>
                                    <td>{c.correo || '—'}</td>
                                    <td>{c.telefono || '—'}</td>
                                    <td className="text-muted">{c.direccion || '—'}</td>
                                    <td>
                                        <div className="row-actions">
                                            <button className="btn btn-sm btn-outline-primary" type="button" onClick={() => abrir(c)}
                                                    aria-label={`Editar a ${c.nombre}`} title="Editar">
                                                <i className="bi bi-pencil" aria-hidden="true"></i>
                                            </button>
                                            {esAdmin && (
                                                <button className="btn btn-sm btn-outline-danger" type="button" onClick={() => eliminar(c)}
                                                        aria-label={`Eliminar a ${c.nombre}`} title="Eliminar">
                                                    <i className="bi bi-trash" aria-hidden="true"></i>
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal abierto={modal} onCerrar={cerrar} onSubmit={guardar} icono="bi-person"
                   titulo={form.id ? 'Editar cliente' : 'Nuevo cliente'}
                   pie={<>
                       <button type="button" className="btn btn-secondary" onClick={cerrar}>Cancelar</button>
                       <button type="submit" className="btn btn-primary" disabled={guardando}>
                           <i className="bi bi-save" aria-hidden="true"></i> Guardar
                       </button>
                   </>}>
                <div className="mb-3">
                    <label className="form-label" htmlFor="cliNombre">Nombre *</label>
                    <input id="cliNombre" name="nombre" className="form-control" required autoComplete="name"
                           value={form.nombre} onChange={campo} />
                </div>
                <div>
                    <label className="form-label" htmlFor="cliTelefono">Teléfono</label>
                    <input id="cliTelefono" name="telefono" type="tel" className="form-control" autoComplete="tel"
                           value={form.telefono} onChange={campo} />
                </div>
                <div className="mt-3">
                    <label className="form-label" htmlFor="cliCorreo">Correo</label>
                    <input id="cliCorreo" name="correo" type="email" className="form-control" autoComplete="email"
                           value={form.correo} onChange={campo} />
                </div>
                <div className="mt-3">
                    <label className="form-label" htmlFor="cliDireccion">Dirección</label>
                    <input id="cliDireccion" name="direccion" className="form-control" value={form.direccion} onChange={campo} />
                </div>
            </Modal>
        </>
    );
}
