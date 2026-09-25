import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import AuthLayout from '../components/AuthLayout';
import Alerta from '../components/Alerta';
import CampoPassword from '../components/CampoPassword';

/**
 * Nota de seguridad: los campos van vacíos y no se muestran credenciales
 * de ejemplo en pantalla. Las cuentas de prueba están documentadas en el
 * README, no en la interfaz que ve cualquier visitante.
 */
export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [correo, setCorreo] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [enviando, setEnviando] = useState(false);

    const registrado = location.state?.registrado;

    const enviar = async (e) => {
        e.preventDefault();
        setEnviando(true);
        const res = await login(correo.trim(), password);
        setEnviando(false);

        if (res.ok) {
            navigate(location.state?.desde || '/dashboard', { replace: true });
        } else {
            setError(res.mensaje?.startsWith('Credenciales')
                ? 'Correo o contraseña incorrectos. Intente de nuevo.'
                : res.mensaje);
        }
    };

    return (
        <AuthLayout icono="bi-book-half" titulo="Librería El Estudiante" subtitulo="Sistema de Punto de Venta"
                    tituloPestana="Iniciar sesión">
            {registrado && !error && <Alerta ok>Cuenta creada correctamente. Ya puede iniciar sesión.</Alerta>}
            {error && <Alerta>{error}</Alerta>}

            <form onSubmit={enviar} autoComplete="on" noValidate>
                <div className="mb-3">
                    <label className="form-label" htmlFor="correo">Correo electrónico</label>
                    <div className="input-group">
                        <span className="input-group-text"><i className="bi bi-envelope" aria-hidden="true"></i></span>
                        <input type="email" id="correo" name="correo" className="form-control"
                               required autoFocus autoComplete="username" placeholder="usuario@libreria.com"
                               value={correo} onChange={(e) => setCorreo(e.target.value)} />
                    </div>
                </div>

                <div className="mb-4">
                    <label className="form-label" htmlFor="password">Contraseña</label>
                    <CampoPassword icono="bi-lock" id="password" name="password" required
                                   autoComplete="current-password" placeholder="Su contraseña"
                                   value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>

                <button className="btn btn-primary w-100 auth-submit" type="submit" disabled={enviando}>
                    <i className="bi bi-box-arrow-in-right" aria-hidden="true"></i> Ingresar
                </button>
            </form>

            <p className="auth-alt">
                ¿No tiene cuenta? <Link to="/registro">Registrarse</Link>
            </p>
        </AuthLayout>
    );
}
