/** Aviso de Bootstrap con icono (éxito o error). */
export default function Alerta({ ok = false, children }) {
    return (
        <div className={`alert ${ok ? 'alert-success' : 'alert-danger'} py-2 d-flex gap-2`} role={ok ? 'status' : 'alert'}>
            <i className={`bi ${ok ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'}`} aria-hidden="true"></i>
            <span>{children}</span>
        </div>
    );
}
