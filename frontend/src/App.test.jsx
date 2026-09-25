import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './lib/auth';
import { ToastProvider } from './lib/toast';
import { ADMIN, CAJERO, mockApi, ok } from './test/utils';

// Chart.js necesita <canvas>, que jsdom no dibuja: las gráficas se reemplazan.
jest.mock('react-chartjs-2', () => ({ Line: () => null, Bar: () => null, Doughnut: () => null }));

const vacio = ok([]);
const rutasBase = {
    'GET /api/reportes/dashboard': ok({
        kpis: { ventas_hoy: 0, num_ventas_hoy: 0, ventas_mes: 0, num_ventas_mes: 0, total_productos: 0, stock_bajo: 0, total_clientes: 0 },
        ventas_por_dia: [], ventas_por_mes: [], top_productos: [],
    }),
    'GET /api/productos': vacio,
    'GET /api/clima': { status: 503, body: { ok: false, mensaje: 'El clima no esta configurado.' } },
    'GET /api/usuarios': vacio,
};

function abrir(ruta, usuario) {
    mockApi(rutasBase, { usuario });
    render(
        <MemoryRouter initialEntries={[ruta]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <AuthProvider><ToastProvider><App /></ToastProvider></AuthProvider>
        </MemoryRouter>
    );
}

describe('Rutas y permisos', () => {
    test('sin sesión, una pantalla protegida manda al login', async () => {
        abrir('/pos', null);
        expect(await screen.findByRole('button', { name: /ingresar/i })).toBeInTheDocument();
    });

    test('con sesión, la raíz abre el dashboard con el nombre de la tienda', async () => {
        abrir('/', ADMIN);
        expect(await screen.findByRole('heading', { level: 1, name: 'Dashboard' })).toBeInTheDocument();
        expect(screen.getByText('Bugambilias')).toBeInTheDocument();
        expect(document.title).toBe('Dashboard · Tienda Bugambilias');
    });

    test('el admin ve "Usuarios" en el menú; el cajero no', async () => {
        abrir('/dashboard', ADMIN);
        expect(await screen.findByRole('link', { name: /usuarios/i })).toBeInTheDocument();
    });

    test('el cajero no ve "Usuarios" y si entra por URL recibe 403', async () => {
        abrir('/usuarios', CAJERO);
        expect(await screen.findByText('403 · Acceso denegado')).toBeInTheDocument();
        expect(screen.queryByRole('link', { name: /usuarios/i })).not.toBeInTheDocument();
    });

    test('la antigua ruta de factura ya no existe (404)', async () => {
        abrir('/ventas/1', ADMIN);
        expect(await screen.findByText('404 · Página no encontrada')).toBeInTheDocument();
    });

    test('con sesión abierta, /login redirige al dashboard', async () => {
        abrir('/login', CAJERO);
        expect(await screen.findByRole('heading', { level: 1, name: 'Dashboard' })).toBeInTheDocument();
    });
});
