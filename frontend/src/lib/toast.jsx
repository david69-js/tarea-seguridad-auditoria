import { createContext, useCallback, useContext, useState } from 'react';

/* Notificaciones flotantes. El contenedor es una región "live": los
   lectores de pantalla anuncian el mensaje sin que el usuario tenga que
   buscarlo en la página. */

const ToastContext = createContext(() => {});
let siguienteId = 1;

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const cerrar = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

    const toast = useCallback((mensaje, ok = true) => {
        const id = siguienteId++;
        setToasts((t) => [...t, { id, mensaje, ok }]);
        setTimeout(() => cerrar(id), 4000);
    }, [cerrar]);

    return (
        <ToastContext.Provider value={toast}>
            {children}
            <div className="toast-container position-fixed top-0 end-0 p-3" style={{ zIndex: 1090 }}
                 role="status" aria-live="polite" aria-atomic="true">
                {toasts.map((t) => (
                    <div key={t.id}
                         className={`toast align-items-center text-white border-0 show ${t.ok ? 'bg-success' : 'bg-danger'}`}>
                        <div className="d-flex">
                            <div className="toast-body">
                                <i className={`bi bi-${t.ok ? 'check-circle' : 'exclamation-triangle'}`} aria-hidden="true"></i>{' '}
                                {t.mensaje}
                            </div>
                            <button type="button" className="btn-close btn-close-white me-2 m-auto"
                                    aria-label="Cerrar notificación" onClick={() => cerrar(t.id)}></button>
                        </div>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    return useContext(ToastContext);
}
