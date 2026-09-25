import { useEffect } from 'react';
import { EMPRESA } from '../lib/config';

/** Marco común de las pantallas de login y registro (sin menú lateral). */
export default function AuthLayout({ icono, titulo, subtitulo, tituloPestana, children }) {
    useEffect(() => {
        document.title = `${tituloPestana} · ${EMPRESA}`;
        document.body.classList.add('auth-page');
        return () => document.body.classList.remove('auth-page');
    }, [tituloPestana]);

    return (
        <>
            <main className="auth-card">
                <div className="auth-brand">
                    <div className="auth-logo"><i className={`bi ${icono}`} aria-hidden="true"></i></div>
                    <h1>{titulo}</h1>
                    <p>{subtitulo}</p>
                </div>
                {children}
            </main>
            <p className="auth-foot">© {new Date().getFullYear()} {EMPRESA} · Guatemala</p>
        </>
    );
}
