import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import AuthLayout from '../components/AuthLayout';
import Alerta from '../components/Alerta';
import CampoPassword from '../components/CampoPassword';

/**
 * Registro público. Las cuentas creadas aquí son siempre de rol "cajero":
 * el servidor ignora cualquier otro rol si quien llama no es administrador.
 * Estas validaciones son solo para avisar antes; el servidor las repite.
 */
function validar({ nombre, correo, password, password2 }) {
    if (!nombre || !correo || !password) return 'Todos los campos son obligatorios.';
    if (nombre.length < 3) return 'El nombre debe tener al menos 3 caracteres.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) return 'El correo electrónico no tiene un formato válido.';
    if (password.length < 6) return 'La contraseña debe tener al menos 6 caracteres.';
    if (password !== password2) return 'Las contraseñas no coinciden.';
    return null;
}

export default function Registro() {
    const navigate = useNavigate();
    const [form, setForm] = useState({ nombre: '', correo: '', password: '', password2: '' });
    const [error, setError] = useState(null);
    const [enviando, setEnviando] = useState(false);

    const cambiar = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const enviar = async (e) => {
        e.preventDefault();
        const datos = { ...form, nombre: form.nombre.trim(), correo: form.correo.trim() };
        const problema = validar(datos);
        if (problema) { setError(problema); return; }

        setEnviando(true);
        const res = await api('/api/auth/register', {
            method: 'POST',
            body: { nombre: datos.nombre, correo: datos.correo, password: datos.password },
        });
        setEnviando(false);

        if (res.ok) navigate('/login', { state: { registrado: true } });
        else setError(res.mensaje);
    };

    return (
        <AuthLayout icono="bi-person-plus" titulo="Crear cuenta" subtitulo="Acceso de cajero al punto de venta"
                    tituloPestana="Crear cuenta">
            {error && <Alerta>{error}</Alerta>}

            <form onSubmit={enviar} noValidate>
                <div className="mb-3">
                    <label className="form-label" htmlFor="nombre">Nombre completo</label>
                    <div className="input-group">
                        <span className="input-group-text"><i className="bi bi-person" aria-hidden="true"></i></span>
                        <input type="text" id="nombre" name="nombre" className="form-control" required
                               minLength={3} autoComplete="name" placeholder="Nombre y apellido"
                               value={form.nombre} onChange={cambiar} />
                    </div>
                </div>

                <div className="mb-3">
                    <label className="form-label" htmlFor="correo">Correo electrónico</label>
                    <div className="input-group">
                        <span className="input-group-text"><i className="bi bi-envelope" aria-hidden="true"></i></span>
                        <input type="email" id="correo" name="correo" className="form-control" required
                               autoComplete="email" placeholder="usuario@tienda.com"
                               value={form.correo} onChange={cambiar} />
                    </div>
                </div>

                <div className="mb-3">
                    <label className="form-label" htmlFor="password">Contraseña</label>
                    <CampoPassword icono="bi-lock" id="password" name="password" required minLength={6}
                                   autoComplete="new-password" aria-describedby="ayudaPass"
                                   value={form.password} onChange={cambiar} />
                    <p className="form-hint" id="ayudaPass">Mínimo 6 caracteres.</p>
                </div>

                <div className="mb-4">
                    <label className="form-label" htmlFor="password2">Repetir contraseña</label>
                    <CampoPassword icono="bi-shield-check" id="password2" name="password2" required minLength={6}
                                   autoComplete="new-password"
                                   value={form.password2} onChange={cambiar} />
                </div>

                <button className="btn btn-primary w-100 auth-submit" type="submit" disabled={enviando}>
                    <i className="bi bi-check2-circle" aria-hidden="true"></i> Crear cuenta
                </button>
            </form>

            <p className="auth-alt">
                ¿Ya tiene cuenta? <Link to="/login">Iniciar sesión</Link>
            </p>
        </AuthLayout>
    );
}
