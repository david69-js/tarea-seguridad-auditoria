import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { fechaCorta } from '../lib/formato';
import { useDebounce } from '../lib/useDebounce';
import { useToast } from '../lib/toast';
import CampoPassword from '../components/CampoPassword';
import FilaVacia from '../components/FilaVacia';
import Modal from '../components/Modal';

/* Gestión de usuarios (solo admin): alta, edición, activación y baja. */

const VACIO = { id: '', nombre: '', correo: '', password: '', rol: 'cajero', activo: '1' };

export default function Usuarios() {
    const { user, setUser } = useAuth();
    const toast = useToast();

    const [usuarios, setUsuarios] = useState(null);
    const [busqueda, setBusqueda] = useState('');
    const q = useDebounce(busqueda);

    const [modal, setModal] = useState(false);
    const [form, setForm] = useState(VACIO);
    const [guardando, setGuardando] = useState(false);

    const cargar = useCallback(async () => {
        const res = await api('/api/usuarios?q=' + encodeURIComponent(q));
        setUsuarios(res.ok ? res.data : []);
    }, [q]);

    useEffect(() => { cargar(); }, [cargar]);

    const cerrar = useCallback(() => setModal(false), []);

    const editando = form.id !== '';
    // Un admin no puede quitarse el rol ni desactivarse (el servidor también lo impide).
    const soyYo = editando && form.id === user.id;

    const abrir = (u = null) => {
        setForm(u
            ? { id: u.id, nombre: u.nombre, correo: u.correo, password: '', rol: u.rol, activo: u.activo ? '1' : '0' }
            : VACIO);
        setModal(true);
    };

    const cambiarEstado = async (u) => {
        const res = await api('/api/usuarios/' + u.id, {
            method: 'PUT',
            body: { nombre: u.nombre, correo: u.correo, rol: u.rol, activo: !u.activo },
        });
        toast(res.mensaje, res.ok);
        if (res.ok) cargar();
    };

    const eliminar = async (u) => {
        if (!confirm(`¿Eliminar al usuario "${u.nombre}"?\n\nSi tiene ventas registradas se desactivará en lugar de borrarse, para no perder el historial.`)) return;
        const res = await api('/api/usuarios/' + u.id, { method: 'DELETE' });
        toast(res.mensaje, res.ok);
        if (res.ok) cargar();
    };

    const guardar = async () => {
        const body = { nombre: form.nombre.trim(), correo: form.correo.trim(), rol: form.rol };
        if (form.password) body.password = form.password;

        setGuardando(true);
        let res;
        if (editando) {
            if (!soyYo) body.activo = form.activo === '1';
            res = await api('/api/usuarios/' + form.id, { method: 'PUT', body });
        } else {
            res = await api('/api/auth/register', { method: 'POST', body });
        }
        setGuardando(false);

        toast(res.mensaje, res.ok);
        if (!res.ok) return;

        setModal(false);
        cargar();
        // Si el admin se editó a sí mismo, el menú lateral debe mostrar el nombre nuevo.
        if (soyYo) api('/api/auth/me').then((me) => me.ok && setUser(me.data));
    };

    const campo = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    return (
        <>
            <div className="page-head">
                <p className="page-sub">Usuarios con acceso al sistema, sus roles y su estado.</p>
                <div className="toolbar">
                    <label className="visually-hidden" htmlFor="buscarUsuario">Buscar usuario</label>
                    <div className="input-group" style={{ maxWidth: 300 }}>
                        <span className="input-group-text"><i className="bi bi-search" aria-hidden="true"></i></span>
                        <input id="buscarUsuario" className="form-control" type="search" placeholder="Buscar por nombre o correo…"
                               value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
                    </div>
                    <button className="btn btn-primary" type="button" onClick={() => abrir()}>
                        <i className="bi bi-person-plus" aria-hidden="true"></i> Nuevo usuario
                    </button>
                </div>
            </div>

            <div className="card panel">
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <caption className="visually-hidden">Listado de usuarios del sistema</caption>
                        <thead>
                            <tr>
                                <th scope="col">Usuario</th>
                                <th scope="col">Correo</th>
                                <th scope="col">Rol</th>
                                <th scope="col" className="text-center">Ventas</th>
                                <th scope="col">Estado</th>
                                <th scope="col">Registrado</th>
                                <th scope="col" className="text-end">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {usuarios === null && <FilaVacia columnas={7}>Cargando usuarios…</FilaVacia>}
                            {usuarios?.length === 0 && <FilaVacia columnas={7} icono="bi-people">Sin usuarios que coincidan.</FilaVacia>}
                            {usuarios?.map((u) => {
                                const esYo = u.id === user.id;
                                return (
                                    <tr key={u.id}>
                                        <td>
                                            <div className="fw-semibold">
                                                {u.nombre}{esYo && <> <span className="pill pill-info">Usted</span></>}
                                            </div>
                                            <small className="text-muted">ID {u.id}</small>
                                        </td>
                                        <td>{u.correo}</td>
                                        <td>
                                            {u.rol === 'admin'
                                                ? <span className="pill pill-primary"><i className="bi bi-shield-lock" aria-hidden="true"></i> Administrador</span>
                                                : <span className="pill pill-neutral"><i className="bi bi-person" aria-hidden="true"></i> Cajero</span>}
                                        </td>
                                        <td className="text-center">{u.ventas}</td>
                                        <td>
                                            {u.activo
                                                ? <span className="pill pill-success"><i className="bi bi-check-circle" aria-hidden="true"></i> Activo</span>
                                                : <span className="pill pill-danger"><i className="bi bi-slash-circle" aria-hidden="true"></i> Inactivo</span>}
                                        </td>
                                        <td className="text-muted">{fechaCorta(u.created_at)}</td>
                                        <td>
                                            <div className="row-actions">
                                                <button className="btn btn-sm btn-outline-primary" type="button" onClick={() => abrir(u)}
                                                        aria-label={`Editar a ${u.nombre}`} title="Editar">
                                                    <i className="bi bi-pencil" aria-hidden="true"></i>
                                                </button>
                                                <button className="btn btn-sm btn-outline-secondary" type="button" disabled={esYo}
                                                        onClick={() => cambiarEstado(u)}
                                                        aria-label={`${u.activo ? 'Desactivar' : 'Activar'} a ${u.nombre}`}
                                                        title={u.activo ? 'Desactivar' : 'Activar'}>
                                                    <i className={`bi bi-${u.activo ? 'toggle-on' : 'toggle-off'}`} aria-hidden="true"></i>
                                                </button>
                                                <button className="btn btn-sm btn-outline-danger" type="button" disabled={esYo}
                                                        onClick={() => eliminar(u)}
                                                        aria-label={`Eliminar a ${u.nombre}`} title="Eliminar">
                                                    <i className="bi bi-trash" aria-hidden="true"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal abierto={modal} onCerrar={cerrar} onSubmit={guardar} icono="bi-person-plus"
                   titulo={editando ? 'Editar usuario' : 'Nuevo usuario'}
                   pie={<>
                       <button type="button" className="btn btn-secondary" onClick={cerrar}>Cancelar</button>
                       <button type="submit" className="btn btn-primary" disabled={guardando}>
                           <i className="bi bi-save" aria-hidden="true"></i> Guardar
                       </button>
                   </>}>
                <div className="mb-3">
                    <label className="form-label" htmlFor="usNombre">Nombre completo *</label>
                    <input id="usNombre" name="nombre" className="form-control" required minLength={3} autoComplete="name"
                           value={form.nombre} onChange={campo} />
                </div>

                <div className="mb-3">
                    <label className="form-label" htmlFor="usCorreo">Correo electrónico *</label>
                    <input id="usCorreo" name="correo" type="email" className="form-control" required autoComplete="email"
                           value={form.correo} onChange={campo} />
                </div>

                <div className="mb-3">
                    <label className="form-label" htmlFor="usPass">
                        Contraseña {!editando && <span>*</span>}
                    </label>
                    {/* Al editar, la contraseña es opcional: vacía = se conserva la actual. */}
                    <CampoPassword id="usPass" name="password" minLength={6} required={!editando}
                                   autoComplete="new-password" aria-describedby="usPassAyuda"
                                   botonClase="btn btn-outline-secondary"
                                   value={form.password} onChange={campo} />
                    <p className="form-hint" id="usPassAyuda">
                        {editando ? 'Déjela vacía para conservar la contraseña actual.' : 'Mínimo 6 caracteres.'}
                    </p>
                </div>

                <div className="row g-3">
                    <div className="col-sm-6">
                        <label className="form-label" htmlFor="usRol">Rol</label>
                        <select id="usRol" name="rol" className="form-select" disabled={soyYo} value={form.rol} onChange={campo}>
                            <option value="cajero">Cajero</option>
                            <option value="admin">Administrador</option>
                        </select>
                    </div>
                    {editando && !soyYo && (
                        <div className="col-sm-6">
                            <label className="form-label" htmlFor="usActivo">Estado</label>
                            <select id="usActivo" name="activo" className="form-select" value={form.activo} onChange={campo}>
                                <option value="1">Activo</option>
                                <option value="0">Inactivo</option>
                            </select>
                        </div>
                    )}
                </div>

                {soyYo && (
                    <p className="form-hint mt-3">
                        <i className="bi bi-info-circle" aria-hidden="true"></i>{' '}
                        Está editando su propia cuenta: no puede cambiar su rol ni desactivarse.
                    </p>
                )}
            </Modal>
        </>
    );
}
