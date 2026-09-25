/** Formatea un número como Quetzales. */
export function money(n) {
    return 'Q ' + Number(n || 0).toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Fecha legible a partir de un TIMESTAMP de MySQL ("2026-09-04 14:03:00"). */
export function fechaCorta(valor) {
    const d = new Date(String(valor ?? '').replace(' ', 'T'));
    if (isNaN(d)) return String(valor ?? '');
    return d.toLocaleString('es-GT', { dateStyle: 'medium', timeStyle: 'short' });
}

/** Número de venta con ceros a la izquierda: 7 -> "000007". */
export function folio(id) {
    return String(id).padStart(6, '0');
}

/** Fecha local en formato YYYY-MM-DD (para inputs type="date"). */
export function fechaISO(d = new Date()) {
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
