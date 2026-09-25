import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Pos from './Pos';
import { CAJERO, error, mockApi, ok, renderApp } from '../test/utils';

const PRODUCTOS = [
    { id: 1, codigo: 'BEB-001', nombre: 'Agua Pura 600 ml', precio: 5, stock: 120, stock_bajo: false },
    { id: 8, codigo: 'ABA-001', nombre: 'Aceite Vegetal 1 L', precio: 28, stock: 2, stock_bajo: true },
    { id: 20, codigo: 'LIM-003', nombre: 'Cloro 1 L', precio: 9.5, stock: 0, stock_bajo: true },
];
// La API devuelve los clientes en orden alfabético: "Cliente General" no es el primero.
const CLIENTES = [
    { id: 4, nombre: 'Carlos Ramirez' },
    { id: 1, nombre: 'Cliente General' },
];

function abrirPos(extra = {}) {
    const fetch = mockApi({
        'GET /api/productos': ok(PRODUCTOS),
        'GET /api/clientes': ok(CLIENTES),
        ...extra,
    }, { usuario: CAJERO });
    renderApp(<Pos />, { en: '/pos', ruta: '/pos' });
    return fetch;
}

const total = () => screen.getByText('TOTAL').nextSibling.textContent;
const agregar = async (nombre) => userEvent.click(await screen.findByRole('button', { name: new RegExp(`^Agregar ${nombre}`) }));

describe('Punto de venta', () => {
    test('preselecciona "Cliente General" y el pago es solo en efectivo', async () => {
        abrirPos();
        await screen.findByRole('button', { name: /^Agregar Agua/ });

        expect(screen.getByLabelText('Cliente')).toHaveDisplayValue('Cliente General');
        expect(screen.getByText('Efectivo')).toBeInTheDocument();
        expect(screen.queryByLabelText(/método de pago/i)).not.toBeInTheDocument();
    });

    test('total = subtotal − descuento, sin IVA', async () => {
        abrirPos();
        await agregar('Agua');
        await agregar('Agua');
        await agregar('Aceite');   // 2×5 + 28 = 38

        expect(screen.queryByText(/IVA/)).not.toBeInTheDocument();
        expect(total()).toBe('Q 38.00');

        const descuento = screen.getByLabelText('Descuento');
        await userEvent.clear(descuento);
        await userEvent.type(descuento, '3');
        expect(total()).toBe('Q 35.00');
    });

    test('el descuento no puede superar el subtotal', async () => {
        abrirPos();
        await agregar('Agua');   // subtotal 5
        const descuento = screen.getByLabelText('Descuento');
        await userEvent.clear(descuento);
        await userEvent.type(descuento, '50');

        expect(descuento).toHaveValue(5);
        expect(total()).toBe('Q 0.00');
    });

    test('no deja vender más que el stock y deshabilita los agotados', async () => {
        abrirPos();
        await agregar('Aceite');
        await agregar('Aceite');
        await agregar('Aceite');   // stock 2

        expect(await screen.findByText('No hay más stock disponible.')).toBeInTheDocument();
        const fila = screen.getAllByText('Aceite Vegetal 1 L').at(-1).closest('tr');
        expect(within(fila).getByText('2')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /^Agregar Cloro/ })).toBeDisabled();
    });

    test('cobrar envía la venta sin método de pago y avisa el monto en efectivo', async () => {
        const fetch = abrirPos({
            'POST /api/ventas': ok({ id: 12, total: 10 }, 'Venta registrada correctamente.', 201),
        });
        const abrirVentana = jest.spyOn(window, 'open').mockImplementation(() => null);
        await agregar('Agua');
        await agregar('Agua');

        await userEvent.click(screen.getByRole('button', { name: /cobrar/i }));

        expect(await screen.findByText('Venta #12 registrada: Q 10.00 en efectivo.')).toBeInTheDocument();
        const [, opts] = fetch.mock.calls.find(([u, o]) => u === '/api/ventas' && o?.method === 'POST');
        expect(JSON.parse(opts.body)).toEqual({ id_cliente: '1', descuento: 0, items: [{ id_producto: 1, cantidad: 2 }] });
        expect(abrirVentana).not.toHaveBeenCalled();          // no se abre ninguna factura
        expect(total()).toBe('Q 0.00');                      // carrito vaciado
    });

    test('si el servidor rechaza la venta, muestra el motivo y conserva el carrito', async () => {
        abrirPos({ 'POST /api/ventas': error("No se pudo registrar la venta: Stock insuficiente para 'Agua Pura 600 ml'.", 422) });
        await agregar('Agua');
        await userEvent.click(screen.getByRole('button', { name: /cobrar/i }));

        expect(await screen.findByText(/Stock insuficiente/)).toBeInTheDocument();
        expect(total()).toBe('Q 5.00');
    });
});
