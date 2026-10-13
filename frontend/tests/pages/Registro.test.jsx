import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Registro from '../../src/pages/Registro';
import Login from '../../src/pages/Login';
import { error, mockApi, ok, renderApp } from '../utils';

async function llenar({ nombre = 'Ana López', correo = 'ana@tienda.com', pass = 'secreto1', pass2 = 'secreto1' } = {}) {
    await userEvent.type(await screen.findByLabelText('Nombre completo'), nombre);
    await userEvent.type(screen.getByLabelText('Correo electrónico'), correo);
    await userEvent.type(screen.getByLabelText('Contraseña'), pass);
    await userEvent.type(screen.getByLabelText('Repetir contraseña'), pass2);
    await userEvent.click(screen.getByRole('button', { name: /crear cuenta/i }));
}

describe('Registro', () => {
    test.each([
        [{ nombre: 'Al' }, 'El nombre debe tener al menos 3 caracteres.'],
        [{ correo: 'no-es-correo' }, 'El correo electrónico no tiene un formato válido.'],
        [{ pass: '123', pass2: '123' }, 'La contraseña debe tener al menos 6 caracteres.'],
        [{ pass2: 'distinta' }, 'Las contraseñas no coinciden.'],
    ])('valida antes de llamar a la API: %o', async (datos, mensaje) => {
        const fetch = mockApi({});
        renderApp(<Registro />, { en: '/registro', ruta: '/registro' });

        await llenar(datos);

        expect(await screen.findByRole('alert')).toHaveTextContent(mensaje);
        expect(fetch.mock.calls.some(([u]) => u === '/api/auth/register')).toBe(false);
    });

    test('registro correcto: no envía rol ni la confirmación y vuelve al login con aviso', async () => {
        const fetch = mockApi({ 'POST /api/auth/register': ok({ id: 9 }, 'Usuario registrado correctamente.', 201) });
        renderApp(<Registro />, { en: '/registro', ruta: '/registro', extras: { '/login': <Login /> } });

        await llenar();

        expect(await screen.findByText(/Cuenta creada correctamente/)).toBeInTheDocument();
        const [, opts] = fetch.mock.calls.find(([u]) => u === '/api/auth/register');
        expect(JSON.parse(opts.body)).toEqual({ nombre: 'Ana López', correo: 'ana@tienda.com', password: 'secreto1' });
    });

    test('correo ya registrado: muestra el mensaje del servidor', async () => {
        mockApi({ 'POST /api/auth/register': error('Ya existe un usuario con ese correo.', 409) });
        renderApp(<Registro />, { en: '/registro', ruta: '/registro' });

        await llenar();

        expect(await screen.findByRole('alert')).toHaveTextContent('Ya existe un usuario con ese correo.');
    });
});
