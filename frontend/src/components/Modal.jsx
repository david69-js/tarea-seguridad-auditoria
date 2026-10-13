import { useEffect, useId, useRef } from 'react';

/**
 * Modal con las clases de Bootstrap, controlado por React (sin bootstrap.js).
 * Cierra con Escape o con clic en el fondo, bloquea el scroll de la página
 * y devuelve el foco al elemento que lo abrió.
 */
export default function Modal({ abierto, onCerrar, titulo, icono, tamano = '', onSubmit, children, pie }) {
    const tituloId = useId();
    const dialogo = useRef(null);

    useEffect(() => {
        if (!abierto) return;
        const previo = document.activeElement;
        document.body.classList.add('modal-open');
        dialogo.current?.querySelector('input:not([type=hidden]), select, textarea')?.focus();

        const tecla = (e) => { if (e.key === 'Escape') onCerrar(); };
        document.addEventListener('keydown', tecla);
        return () => {
            document.body.classList.remove('modal-open');
            document.removeEventListener('keydown', tecla);
            previo?.focus?.();
        };
    }, [abierto, onCerrar]);

    if (!abierto) return null;

    const enviar = (e) => {
        e.preventDefault();
        if (!e.currentTarget.checkValidity()) { e.currentTarget.reportValidity(); return; }
        onSubmit?.(e);
    };

    return (
        <>
            <div className="modal fade show d-block" tabIndex={-1} role="dialog" aria-modal="true"
                 aria-labelledby={tituloId} onMouseDown={(e) => { if (e.target === e.currentTarget) onCerrar(); }}>
                <div className={`modal-dialog modal-dialog-centered ${tamano}`} ref={dialogo}>
                    <form className="modal-content" onSubmit={enviar} noValidate>
                        <div className="modal-header">
                            <h2 className="modal-title h5" id={tituloId}>
                                {icono && <><i className={`bi ${icono}`} aria-hidden="true"></i>{' '}</>}
                                {titulo}
                            </h2>
                            <button type="button" className="btn-close" aria-label="Cerrar" onClick={onCerrar}></button>
                        </div>
                        <div className="modal-body">{children}</div>
                        <div className="modal-footer">{pie}</div>
                    </form>
                </div>
            </div>
            <div className="modal-backdrop fade show"></div>
        </>
    );
}
