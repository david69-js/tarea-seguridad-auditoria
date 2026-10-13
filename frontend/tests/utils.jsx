import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from '../src/lib/auth';
import { ToastProvider } from '../src/lib/toast';

export const ADMIN  = { id: 1, nombre: 'Administrador', correo: 'admin@tienda.com', rol: 'admin' };
export const CAJERO = { id: 2, nombre: 'Cajero Uno', correo: 'cajero@tienda.com', rol: 'cajero' };

/**
 * Simula la API REST de PHP. `rutas` es un objeto { 'METODO /ruta': respuesta }
 * donde la respuesta es { status, body } o una función (llamada) => {status, body}.
 * La ruta se compara sin la query string. Devuelve el mock para revisar llamadas.
 */
export function mockApi(rutas, { usuario = null } = {}) {
    const todas = {
        'GET /api/auth/me': usuario
            ? { status: 200, body: { ok: true, data: usuario } }
            : { status: 401, body: { ok: false, mensaje: 'No autenticado. Inicie sesion.' } },
        ...rutas,
    };
    const fetchMock = jest.fn(async (url, opts = {}) => {
        const metodo = (opts.method || 'GET').toUpperCase();
        const ruta = String(url).split('?')[0];
        let r = todas[`${metodo} ${ruta}`];
        if (typeof r === 'function') {
            r = r({ url: String(url), metodo, body: opts.body ? safeJson(opts.body) : null, opts });
        }
        if (!r) r = { status: 404, body: { ok: false, mensaje: `Sin mock para ${metodo} ${ruta}` } };
        return { status: r.status ?? 200, json: async () => r.body };
    });
    global.fetch = fetchMock;
    return fetchMock;
}

function safeJson(b) {
    try { return JSON.parse(b); } catch { return b; }
}

/**
 * Igual que en App.jsx (RequiereSesion): la pantalla se muestra cuando ya se
 * sabe quién es el usuario, para que el rol esté disponible desde el inicio.
 */
function EsperarSesion({ children }) {
    const { cargando } = useAuth();
    return cargando ? null : children;
}

/** Muestra la ruta actual para comprobar redirecciones. */
function RutaActual() {
    const { pathname } = useLocation();
    return <div data-testid="ruta">{pathname}</div>;
}

/**
 * Renderiza con router en memoria, sesión y toasts, como en main.jsx.
 * `rutas` permite montar pantallas extra (p. ej. el destino de una redirección).
 */
export function renderApp(ui, { en = '/', ruta = '*', extras = {} } = {}) {
    return render(
        <MemoryRouter initialEntries={[en]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <AuthProvider>
                <ToastProvider>
                    <Routes>
                        <Route path={ruta} element={<EsperarSesion>{ui}</EsperarSesion>} />
                        {Object.entries(extras).map(([p, el]) => <Route key={p} path={p} element={<EsperarSesion>{el}</EsperarSesion>} />)}
                    </Routes>
                    <RutaActual />
                </ToastProvider>
            </AuthProvider>
        </MemoryRouter>
    );
}

/** Respuesta estándar de éxito de la API. */
export const ok = (data, mensaje = 'OK', status = 200) => ({ status, body: { ok: true, mensaje, data } });
export const error = (mensaje, status) => ({ status, body: { ok: false, mensaje, detalle: null } });
