import { api, apiForm } from '../../src/lib/api';

const respuesta = (status, body) => ({ status, json: async () => body });

describe('cliente de la API', () => {
    test('envía JSON con la cookie de sesión y devuelve el cuerpo', async () => {
        global.fetch = jest.fn().mockResolvedValue(respuesta(201, { ok: true, data: { id: 3 } }));

        const res = await api('/api/clientes', { method: 'POST', body: { nombre: 'Ana' } });

        expect(res).toEqual({ ok: true, data: { id: 3 } });
        const [url, opts] = global.fetch.mock.calls[0];
        expect(url).toBe('/api/clientes');
        expect(opts.method).toBe('POST');
        expect(opts.credentials).toBe('same-origin');
        expect(opts.headers['Content-Type']).toBe('application/json');
        expect(JSON.parse(opts.body)).toEqual({ nombre: 'Ana' });
    });

    test('un 401 fuera de /api/auth avisa que la sesión expiró', async () => {
        global.fetch = jest.fn().mockResolvedValue(respuesta(401, { ok: false }));
        const escucha = jest.fn();
        window.addEventListener('sesion-expirada', escucha);

        await api('/api/productos');

        expect(escucha).toHaveBeenCalledTimes(1);
        window.removeEventListener('sesion-expirada', escucha);
    });

    test('un 401 del login es "credenciales inválidas", no sesión expirada', async () => {
        global.fetch = jest.fn().mockResolvedValue(respuesta(401, { ok: false, mensaje: 'Credenciales invalidas.' }));
        const escucha = jest.fn();
        window.addEventListener('sesion-expirada', escucha);

        const res = await api('/api/auth/login', { method: 'POST', body: {} });

        expect(res.mensaje).toBe('Credenciales invalidas.');
        expect(escucha).not.toHaveBeenCalled();
        window.removeEventListener('sesion-expirada', escucha);
    });

    test('un error de red no lanza: devuelve ok=false con el mensaje', async () => {
        global.fetch = jest.fn().mockRejectedValue(new Error('sin conexión'));
        await expect(api('/api/ventas')).resolves.toEqual({ ok: false, mensaje: 'Error de red: sin conexión' });
    });

    test('una respuesta que no es JSON se reporta como inesperada', async () => {
        global.fetch = jest.fn().mockResolvedValue({ status: 500, json: async () => { throw new Error('html'); } });
        const res = await api('/api/ventas');
        expect(res.ok).toBe(false);
        expect(res.mensaje).toMatch(/500/);
    });

    test('apiForm usa POST con _method=PUT para poder subir archivos', async () => {
        global.fetch = jest.fn().mockResolvedValue(respuesta(200, { ok: true }));
        const fd = new FormData();
        fd.append('nombre', 'Arroz');

        await apiForm('/api/productos/5', fd, 'PUT');

        const [, opts] = global.fetch.mock.calls[0];
        expect(opts.method).toBe('POST');
        expect(opts.body.get('_method')).toBe('PUT');
        expect(opts.body.get('nombre')).toBe('Arroz');
    });
});
