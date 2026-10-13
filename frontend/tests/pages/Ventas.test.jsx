import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Ventas from '../../src/pages/Ventas';
import { ADMIN, CAJERO, mockApi, ok, renderApp } from '../utils';

const VENTAS = [
    { id: 3, fecha: '2026-09-20 10:00:00', subtotal: 216, descuento: 10, total: 206, estado: 'completada', cajero: 'Administrador', cliente: 'Comedor Dona Rosa' },
    { id: 2, fecha: '2026-09-13 09:00:00', subtotal: 28, descuento: 0, total: 28, estado: 'anulada', cajero: 'Cajero Uno', cliente: null },
];
const DETALLE_3 = {
    id: 3, fecha: '2026-09-20 10:00:00', subtotal: 216, descuento: 10, total: 206, estado: 'completada',
    cajero: 'Administrador', cliente_nombre: 'Comedor Dona Rosa',
    detalle: [
        { id: 4, producto: 'Huevos (carton 30)', cantidad: 2, precio_unitario: 42, subtotal: 84 },
        { id: 5, producto: 'Aceite Vegetal 1 L', cantidad: 3, precio_unitario: 28, subtotal: 84 },
    ],
};

describe('Historial de ventas', () => {
    test('lista las ventas sin columna de método de pago', async () => {
        mockApi({ 'GET /api/ventas': ok(VENTAS) }, { usuario: CAJERO });
        renderApp(<Ventas />);

        expect(await screen.findByText('#000003')).toBeInTheDocument();
        expect(screen.getByText('Cliente General')).toBeInTheDocument();     // venta sin cliente
        const cab = screen.getAllByRole('columnheader').map((th) => th.textContent);
        expect(cab).not.toContain('Método');
        expect(screen.queryByText(/factura/i)).not.toBeInTheDocument();
    });

    test('el detalle de la venta muestra productos, descuento y total en efectivo', async () => {
        mockApi({ 'GET /api/ventas': ok(VENTAS), 'GET /api/ventas/3': ok(DETALLE_3) }, { usuario: CAJERO });
        renderApp(<Ventas />);

        await userEvent.click(await screen.findByRole('button', { name: 'Ver detalle de la venta 3' }));

        const modal = await screen.findByRole('dialog');
        expect(within(modal).getByText('Venta #000003')).toBeInTheDocument();
        expect(within(modal).getByText('Huevos (carton 30)')).toBeInTheDocument();
        expect(within(modal).getByText('− Q 10.00')).toBeInTheDocument();
        const fila = within(modal).getByText('Total (efectivo)').closest('tr');
        expect(fila).toHaveTextContent('Q 206.00');
    });

    test('solo el admin puede anular, y solo ventas completadas', async () => {
        mockApi({ 'GET /api/ventas': ok(VENTAS) }, { usuario: ADMIN });
        renderApp(<Ventas />);

        expect(await screen.findByRole('button', { name: 'Anular la venta 3' })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Anular la venta 2' })).not.toBeInTheDocument(); // ya anulada
    });

    test('el cajero no ve el botón de anular', async () => {
        mockApi({ 'GET /api/ventas': ok(VENTAS) }, { usuario: CAJERO });
        renderApp(<Ventas />);

        await screen.findByText('#000003');
        expect(screen.queryByRole('button', { name: /anular/i })).not.toBeInTheDocument();
    });

    test('anular pide confirmación y llama a la API', async () => {
        const fetch = mockApi({
            'GET /api/ventas': ok(VENTAS),
            'POST /api/ventas/3/anular': ok(null, 'Venta anulada y stock restaurado.'),
        }, { usuario: ADMIN });
        const confirmar = jest.spyOn(window, 'confirm').mockReturnValue(true);
        renderApp(<Ventas />);

        await userEvent.click(await screen.findByRole('button', { name: 'Anular la venta 3' }));

        expect(confirmar).toHaveBeenCalled();
        expect(await screen.findByText('Venta anulada y stock restaurado.')).toBeInTheDocument();
        expect(fetch.mock.calls.some(([u, o]) => u === '/api/ventas/3/anular' && o.method === 'POST')).toBe(true);
    });
});
