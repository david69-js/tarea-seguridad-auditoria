import { useState } from 'react';

/**
 * Campo de contraseña con botón "mostrar/ocultar". La contraseña nunca se
 * muestra por defecto; es el usuario quien decide revelarla.
 */
export default function CampoPassword({ icono, botonClase = 'btn-toggle-pass', ...props }) {
    const [visible, setVisible] = useState(false);

    return (
        <div className="input-group">
            {icono && <span className="input-group-text"><i className={`bi ${icono}`} aria-hidden="true"></i></span>}
            <input {...props} type={visible ? 'text' : 'password'} className="form-control" />
            <button className={botonClase} type="button" aria-pressed={visible}
                    aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    onClick={() => setVisible((v) => !v)}>
                <i className={visible ? 'bi bi-eye-slash' : 'bi bi-eye'} aria-hidden="true"></i>
            </button>
        </div>
    );
}
