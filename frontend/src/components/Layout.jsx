import { Fragment, useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useTitulo } from '../lib/useTitulo';

const MENU = [
    { ruta: '/dashboard', icono: 'bi-speedometer2', texto: 'Dashboard',      titulo: 'Dashboard' },
    { ruta: '/pos',       icono: 'bi-cart3',        texto: 'Punto de Venta', titulo: 'Punto de Venta' },
    { ruta: '/productos', icono: 'bi-box-seam',     texto: 'Inventario',     titulo: 'Inventario de Productos' },
    { ruta: '/ventas',    icono: 'bi-receipt',      texto: 'Ventas',         titulo: 'Historial de Ventas' },
    { ruta: '/clientes',  icono: 'bi-people',       texto: 'Clientes',       titulo: 'Clientes' },
    { ruta: '/reportes',  icono: 'bi-graph-up',     texto: 'Reportes',       titulo: 'Reportes de Ventas' },
    { ruta: '/usuarios',  icono: 'bi-shield-lock',  texto: 'Usuarios',       titulo: 'Usuarios del Sistema', soloAdmin: true },
];

/** Iniciales del usuario para el avatar del menú lateral. */
function iniciales(nombre = '') {
    const ini = nombre.trim().split(/\s+/).slice(0, 2).map((p) => p.charAt(0).toUpperCase()).join('');
    return ini || '?';
}

function Reloj() {
    const [ahora, setAhora] = useState(new Date());
    useEffect(() => {
        const t = setInterval(() => setAhora(new Date()), 30000);
        return () => clearInterval(t);
    }, []);
    return (
        <span className="topbar-meta">
            <i className="bi bi-clock" aria-hidden="true"></i>{' '}
            <span>{ahora.toLocaleString('es-GT', { dateStyle: 'medium', timeStyle: 'short' })}</span>
        </span>
    );
}

export default function Layout() {
    const { user, esAdmin, logout } = useAuth();
    const { pathname } = useLocation();
    const navigate = useNavigate();
    const [menuAbierto, setMenuAbierto] = useState(false);
    const sidebar = useRef(null);
    const hamburguesa = useRef(null);

    const actual = MENU.find((m) => pathname.startsWith(m.ruta));
    const titulo = actual?.titulo ?? 'POS Librería';
    useTitulo(titulo);

    // Navegar cierra el menú (en móvil queda encima del contenido).
    useEffect(() => { setMenuAbierto(false); }, [pathname]);

    // Menú lateral en móvil: Escape lo cierra; al abrir, el foco entra al
    // menú y al cerrar vuelve al botón.
    const abrirMenu = (si) => {
        setMenuAbierto(si);
        if (si) setTimeout(() => sidebar.current?.querySelector('.nav-link')?.focus());
        else hamburguesa.current?.focus();
    };
    useEffect(() => {
        if (!menuAbierto) return;
        const tecla = (e) => { if (e.key === 'Escape') abrirMenu(false); };
        document.addEventListener('keydown', tecla);
        return () => document.removeEventListener('keydown', tecla);
    }, [menuAbierto]);

    const salir = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <>
            <a className="skip-link" href="#contenido">Saltar al contenido principal</a>

            <div className="app-shell">
                <aside className={`sidebar ${menuAbierto ? 'open' : ''}`} id="sidebar" ref={sidebar} aria-label="Menú principal">
                    <Link className="sidebar-brand" to="/dashboard">
                        <i className="bi bi-book-half" aria-hidden="true"></i>
                        <span>POS Librería<small>El Estudiante</small></span>
                    </Link>

                    <nav className="sidebar-nav" aria-label="Secciones del sistema">
                        <span className="sidebar-heading">Operación</span>
                        {MENU.filter((m) => !m.soloAdmin || esAdmin).map((m) => (
                            <Fragment key={m.ruta}>
                                {m.soloAdmin && <span className="sidebar-heading">Administración</span>}
                                <NavLink className="nav-link" to={m.ruta}>
                                    <i className={`bi ${m.icono}`} aria-hidden="true"></i> {m.texto}
                                </NavLink>
                            </Fragment>
                        ))}
                    </nav>

                    <div className="sidebar-footer">
                        <div className="user-badge">
                            <span className="user-avatar" aria-hidden="true">{iniciales(user?.nombre)}</span>
                            <span className="user-info">
                                <strong>{user?.nombre}</strong>
                                <small className="d-block">{esAdmin ? 'Administrador' : 'Cajero'}</small>
                            </span>
                        </div>
                        <button type="button" className="btn-logout" onClick={salir}>
                            <i className="bi bi-box-arrow-right" aria-hidden="true"></i> Cerrar sesión
                        </button>
                    </div>
                </aside>

                <button type="button" className={`sidebar-backdrop ${menuAbierto ? 'show' : ''}`}
                        tabIndex={-1} aria-hidden="true" onClick={() => abrirMenu(false)}></button>

                <div className="main-area">
                    <header className="topbar">
                        <button className="btn-hamburger" type="button" ref={hamburguesa}
                                aria-controls="sidebar" aria-expanded={menuAbierto} aria-label="Abrir menú de navegación"
                                onClick={() => abrirMenu(!menuAbierto)}>
                            <i className="bi bi-list" aria-hidden="true"></i>
                        </button>
                        <h1 className="topbar-title">{titulo}</h1>
                        <Reloj />
                    </header>

                    <main className="content" id="contenido" tabIndex={-1}>
                        <Outlet />
                    </main>
                </div>
            </div>
        </>
    );
}
