import { fechaCorta, fechaISO, folio, money } from './formato';

describe('formato', () => {
    test('money: formatea en quetzales con 2 decimales', () => {
        expect(money(1234.5)).toBe('Q 1,234.50');
        expect(money(0)).toBe('Q 0.00');
        expect(money(null)).toBe('Q 0.00');
        expect(money('7.1')).toBe('Q 7.10');
    });

    test('folio: número de venta con 6 dígitos', () => {
        expect(folio(7)).toBe('000007');
        expect(folio(123456)).toBe('123456');
    });

    test('fechaISO: fecha local en formato YYYY-MM-DD', () => {
        expect(fechaISO(new Date(2026, 0, 5))).toBe('2026-01-05');
    });

    test('fechaCorta: convierte un TIMESTAMP de MySQL y deja intacto un valor inválido', () => {
        expect(fechaCorta('2026-09-04 14:03:00')).toMatch(/2026/);
        expect(fechaCorta('no es fecha')).toBe('no es fecha');
    });
});
