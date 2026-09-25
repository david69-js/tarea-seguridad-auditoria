import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Login from '../../src/pages/Login';
import { ADMIN, error, mockApi, ok, renderApp } from '../utils';

const Dashboard = () => <h1>Pantalla dashboard</h1>;

describe('Login', () => {
    test('los campos llegan vacíos (no se muestran credenciales de ejemplo)', async () => {
        mockApi({});
        renderApp(<Login />, { en: '/login', ruta: '/login' });

        expect(await screen.findByLabelText('Correo electrónico')).toHaveValue('');
        expect(screen.getByLabelText('Contraseña')).toHaveValue('');
        expect(screen.getByLabelText('Contraseña')).toHaveAttribute('type', 'password');
    });

    test('contraseña incorrecta: muestra el aviso y se queda en el login', async () => {
        mockApi({ 'POST /api/auth/login': error('Credenciales invalidas.', 401) });
        renderApp(<Login />, { en: '/login', ruta: '/login' });

        await userEvent.type(await screen.findByLabelText('Correo electrónico'), 'admin@tienda.com');
        await userEvent.type(screen.getByLabelText('Contraseña'), 'mala');
        await userEvent.click(screen.getByRole('button', { name: /ingresar/i }));

        expect(await screen.findByRole('alert')).toHaveTextContent('Correo o contraseña incorrectos');
        expect(screen.getByTestId('ruta')).toHaveTextContent('/login');
    });

    test('credenciales correctas: envía correo y contraseña y entra al dashboard', async () => {
        const fetch = mockApi({ 'POST /api/auth/login': ok(ADMIN) });
        renderApp(<Login />, { en: '/login', ruta: '/login', extras: { '/dashboard': <Dashboard /> } });

        await userEvent.type(await screen.findByLabelText('Correo electrónico'), ' admin@tienda.com ');
        await userEvent.type(screen.getByLabelText('Contraseña'), 'admin123');
        await userEvent.click(screen.getByRole('button', { name: /ingresar/i }));

        expect(await screen.findByText('Pantalla dashboard')).toBeInTheDocument();
        const login = fetch.mock.calls.find(([u]) => u === '/api/auth/login');
        expect(JSON.parse(login[1].body)).toEqual({ correo: 'admin@tienda.com', password: 'admin123' });
    });

    test('el botón del ojo muestra y oculta la contraseña', async () => {
        mockApi({});
        renderApp(<Login />, { en: '/login', ruta: '/login' });
        const campo = await screen.findByLabelText('Contraseña');

        await userEvent.click(screen.getByRole('button', { name: 'Mostrar contraseña' }));
        expect(campo).toHaveAttribute('type', 'text');
        await userEvent.click(screen.getByRole('button', { name: 'Ocultar contraseña' }));
        expect(campo).toHaveAttribute('type', 'password');
    });
});
