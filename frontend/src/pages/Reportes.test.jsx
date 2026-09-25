import { screen, within } from '@testing-library/react';
import Reportes from './Reportes';
import { ADMIN, CAJERO, mockApi, ok, renderApp } from '../test/utils';

const REPORTE = {
    desde: '2026-09-01', hasta: '2026-09-25',
    resumen: { num: 4, total: '400.00', descuento: '10.00' },
    ventas: [],
};
const producto = (id, nombre, ganancia_total, unidades) => ({
    id, codigo: `P-${id}`, nombre, categoria: 'X', precio_compra: 1, precio: 2, ganancia: 1, margen: 50, unidades, ingresos: unidades * 2, ganancia_total,
});
const RENTABILIDAD = {
    desde: '2026-09-01', hasta: '2026-09-25', ganancia_bruta: 79.2, descuentos: 10, ganancia_neta: 69.2,
    productos: [
        producto(1, 'Aceite', 20, 4), producto(2, 'Huevos', 12, 2), producto(3, 'Queso', 8, 1),
        producto(4, 'Agua', 5, 3), producto(5, 'Pasta', 0, 0), producto(6, 'Sal', 0, 0), producto(7, 'Cloro', 0, 0),
    ],
};

const rutas = {
    'GET /api/reportes/ventas': ok(REPORTE),
    'GET /api/reportes/productos-vendidos': ok([]),
    'GET /api/reportes/rentabilidad': ok(RENTABILIDAD),
};

describe('Reportes', () => {
    test('muestra el resumen del período sin IVA (promedio por venta)', async () => {
        mockApi(rutas, { usuario: CAJERO });
        renderApp(<Reportes />);

        expect(await screen.findByText('Promedio por venta')).toBeInTheDocument();
        expect(screen.getByText('Q 100.00')).toBeInTheDocument();   // 400 / 4
        expect(screen.queryByText(/IVA/)).not.toBeInTheDocument();
    });

    test('admin: ve la rentabilidad con más y menos rentables y la ganancia neta', async () => {
        mockApi(rutas, { usuario: ADMIN });
        renderApp(<Reportes />);

        const seccion = (await screen.findByText('Productos más y menos rentables')).closest('section');
        expect(within(seccion).getByText('Q 69.20')).toBeInTheDocument();          // ganancia neta
        const filas = within(seccion).getAllByRole('row').slice(1);
        expect(filas[0]).toHaveTextContent('Aceite');
        expect(filas[0]).toHaveTextContent('Más rentable');
        expect(filas[2]).toHaveTextContent('Más rentable');
        expect(filas[3]).not.toHaveTextContent('rentable');
        expect(filas.at(-1)).toHaveTextContent('Menos rentable');
    });

    test('cajero: no ve rentabilidad ni la pide a la API', async () => {
        const fetch = mockApi(rutas, { usuario: CAJERO });
        renderApp(<Reportes />);

        await screen.findByText('Promedio por venta');
        expect(screen.queryByText(/rentables/)).not.toBeInTheDocument();
        expect(fetch.mock.calls.some(([u]) => u.startsWith('/api/reportes/rentabilidad'))).toBe(false);
    });
});
