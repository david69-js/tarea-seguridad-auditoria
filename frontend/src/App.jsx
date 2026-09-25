import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './lib/auth';
import Layout from './components/Layout';

import Login from './pages/Login';
import Registro from './pages/Registro';
import Dashboard from './pages/Dashboard';
import Pos from './pages/Pos';
import Productos from './pages/Productos';
import Ventas from './pages/Ventas';
import Factura from './pages/Factura';
import Clientes from './pages/Clientes';
import Reportes from './pages/Reportes';
import Usuarios from './pages/Usuarios';
import { NoEncontrado, SinPermiso } from './pages/Errores';

/** Pantalla neutra mientras se consulta /api/auth/me. */
function Cargando() {
    return (
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
            <span className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Cargando…</span>
            </span>
        </div>
    );
}

/** Rutas que exigen sesión: sin ella, al login. */
function RequiereSesion() {
    const { user, cargando } = useAuth();
    const location = useLocation();
    if (cargando) return <Cargando />;
    if (!user) return <Navigate to="/login" replace state={{ desde: location.pathname }} />;
    return <Outlet />;
}

/** Login y registro: con sesión abierta no tiene sentido verlos. */
function SoloInvitados() {
    const { user, cargando } = useAuth();
    if (cargando) return <Cargando />;
    if (user) return <Navigate to="/dashboard" replace />;
    return <Outlet />;
}

/** Secciones de administración (el servidor también lo comprueba: 403). */
function SoloAdmin({ children }) {
    const { esAdmin } = useAuth();
    return esAdmin ? children : <SinPermiso />;
}

export default function App() {
    return (
        <Routes>
            <Route element={<SoloInvitados />}>
                <Route path="/login" element={<Login />} />
                <Route path="/registro" element={<Registro />} />
            </Route>

            <Route element={<RequiereSesion />}>
                {/* Factura imprimible: pantalla completa, sin menú lateral */}
                <Route path="/ventas/:id" element={<Factura />} />

                <Route element={<Layout />}>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/pos" element={<Pos />} />
                    <Route path="/productos" element={<Productos />} />
                    <Route path="/ventas" element={<Ventas />} />
                    <Route path="/clientes" element={<Clientes />} />
                    <Route path="/reportes" element={<Reportes />} />
                    <Route path="/usuarios" element={<SoloAdmin><Usuarios /></SoloAdmin>} />
                    <Route path="*" element={<NoEncontrado />} />
                </Route>
            </Route>
        </Routes>
    );
}
