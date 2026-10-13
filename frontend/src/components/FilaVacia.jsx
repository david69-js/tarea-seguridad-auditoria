/** Fila de tabla que ocupa todas las columnas, para "cargando" o "sin datos". */
export default function FilaVacia({ columnas, icono, children }) {
    return (
        <tr>
            <td colSpan={columnas} className="empty-state">
                {icono && <><i className={`bi ${icono}`} aria-hidden="true"></i>{' '}</>}
                {children}
            </td>
        </tr>
    );
}
