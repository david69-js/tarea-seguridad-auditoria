import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Productos from '../../src/pages/Productos';
import { ADMIN, CAJERO, mockApi, ok, renderApp } from '../utils';

const CATEGORIAS = [{ id: 1, nombre: 'Bebidas' }];
// Lo que la API manda a un admin (con costo) y a un cajero (sin costo).
const AGUA_ADMIN  = { id: 1, codigo: 'BEB-001', nombre: 'Agua Pura 600 ml', categoria: 'Bebidas', id_categoria: 1,
                      precio_compra: 3.25, precio: 5, ganancia: 1.75, margen: 35, stock: 120, stock_bajo: false };
const AGUA_CAJERO = { id: 1, codigo: 'BEB-001', nombre: 'Agua Pura 600 ml', categoria: 'Bebidas', precio: 5, stock: 120, stock_bajo: false };
const CLORO = { id: 20, codigo: 'LIM-003', nombre: 'Cloro 1 L', categoria: 'Limpieza', precio: 9.5, stock: 2, stock_bajo: true };

const encabezados = () => screen.getAllByRole('columnheader').map((th) => th.textContent);

describe('Inventario', () => {
    test('admin: ve precio de compra, de venta y ganancia con margen', async () => {
        mockApi({ 'GET /api/categorias': ok(CATEGORIAS), 'GET /api/productos': ok([AGUA_ADMIN]) }, { usuario: ADMIN });
        renderApp(<Productos />);

        const fila = (await screen.findByText('Agua Pura 600 ml')).closest('tr');
        expect(encabezados()).toEqual(expect.arrayContaining(['Compra', 'Venta', 'Ganancia']));
        expect(within(fila).getByText('Q 3.25')).toBeInTheDocument();
        expect(within(fila).getByText('Q 5.00')).toBeInTheDocument();
        expect(within(fila).getByText('Q 1.75')).toBeInTheDocument();
        expect(within(fila).getByText('35%')).toBeInTheDocument();
        expect(within(fila).getByRole('button', { name: 'Editar Agua Pura 600 ml' })).toBeInTheDocument();
    });

    test('cajero: solo ve precio y stock, sin costo, ganancia ni acciones', async () => {
        mockApi({ 'GET /api/categorias': ok(CATEGORIAS), 'GET /api/productos': ok([AGUA_CAJERO, CLORO]) }, { usuario: CAJERO });
        renderApp(<Productos />);

        await screen.findByText('Agua Pura 600 ml');
        expect(encabezados()).toContain('Precio');
        expect(encabezados()).not.toContain('Compra');
        expect(encabezados()).not.toContain('Ganancia');
        expect(screen.queryByRole('button', { name: /nuevo producto/i })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /editar/i })).not.toBeInTheDocument();
    });

    test('marca en rojo el stock bajo (menos de 5)', async () => {
        mockApi({ 'GET /api/categorias': ok(CATEGORIAS), 'GET /api/productos': ok([CLORO]) }, { usuario: CAJERO });
        renderApp(<Productos />);

        const fila = (await screen.findByText('Cloro 1 L')).closest('tr');
        expect(within(fila).getByText('unidades, stock bajo')).toBeInTheDocument();
        expect(fila.querySelector('.pill-danger')).toHaveTextContent('2');
    });

    test('la búsqueda consulta la API por nombre', async () => {
        const fetch = mockApi({ 'GET /api/categorias': ok(CATEGORIAS), 'GET /api/productos': ok([]) }, { usuario: CAJERO });
        renderApp(<Productos />);

        await userEvent.type(await screen.findByLabelText(/buscar producto/i), 'arroz');

        // La búsqueda espera 300 ms a que se deje de escribir (debounce)
        await waitFor(() => expect(fetch.mock.calls.some(([u]) => u.startsWith('/api/productos?q=arroz'))).toBe(true));
        expect(await screen.findByText(/No hay productos que coincidan/)).toBeInTheDocument();
    });

    test('nuevo producto: calcula la ganancia al escribir y envía precio de compra y de venta', async () => {
        const fetch = mockApi({
            'GET /api/categorias': ok(CATEGORIAS),
            'GET /api/productos': ok([]),
            'POST /api/productos': ok({ id: 30 }, 'Producto creado.', 201),
        }, { usuario: ADMIN });
        renderApp(<Productos />);

        await userEvent.click(await screen.findByRole('button', { name: /nuevo producto/i }));
        const modal = screen.getByRole('dialog');
        await userEvent.type(within(modal).getByLabelText('Código *'), 'GRA-009');
        await userEvent.type(within(modal).getByLabelText('Nombre *'), 'Maíz 1 lb');
        await userEvent.type(within(modal).getByLabelText('Precio de compra (Q) *'), '7');
        await userEvent.type(within(modal).getByLabelText('Precio de venta (Q) *'), '10');
        expect(within(modal).getByText('Q 3.00')).toBeInTheDocument();

        await userEvent.click(within(modal).getByRole('button', { name: /guardar/i }));

        expect(await screen.findByText('Producto creado.')).toBeInTheDocument();
        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
        const [, opts] = fetch.mock.calls.find(([u, o]) => u === '/api/productos' && o?.method === 'POST');
        expect(opts.body.get('precio_compra')).toBe('7');
        expect(opts.body.get('precio')).toBe('10');
        expect(opts.body.get('nombre')).toBe('Maíz 1 lb');
    });

    test('avisa cuando el precio de venta no deja ganancia', async () => {
        mockApi({ 'GET /api/categorias': ok(CATEGORIAS), 'GET /api/productos': ok([]) }, { usuario: ADMIN });
        renderApp(<Productos />);

        await userEvent.click(await screen.findByRole('button', { name: /nuevo producto/i }));
        const modal = screen.getByRole('dialog');
        await userEvent.type(within(modal).getByLabelText('Precio de compra (Q) *'), '10');
        await userEvent.type(within(modal).getByLabelText('Precio de venta (Q) *'), '8');

        expect(within(modal).getByText('Se vende sin ganancia')).toBeInTheDocument();
    });
});
