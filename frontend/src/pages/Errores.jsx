import { Link } from 'react-router-dom';

export function SinPermiso() {
    return (
        <div className="text-center py-5">
            <i className="bi bi-shield-lock" style={{ fontSize: '3rem', color: '#ef4444' }} aria-hidden="true"></i>
            <h2 className="mt-3">403 · Acceso denegado</h2>
            <p className="text-muted">No tiene permisos para ver esta sección (requiere rol de administrador).</p>
            <Link to="/dashboard" className="btn btn-primary"><i className="bi bi-house" aria-hidden="true"></i> Volver al dashboard</Link>
        </div>
    );
}

export function NoEncontrado() {
    return (
        <div className="text-center py-5">
            <i className="bi bi-compass" style={{ fontSize: '3rem', color: '#94a3b8' }} aria-hidden="true"></i>
            <h2 className="mt-3">404 · Página no encontrada</h2>
            <p className="text-muted">La ruta solicitada no existe.</p>
            <Link to="/dashboard" className="btn btn-primary"><i className="bi bi-house" aria-hidden="true"></i> Ir al inicio</Link>
        </div>
    );
}
