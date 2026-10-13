/** Tarjeta de indicador (KPI) del dashboard y de los reportes. */
export default function Kpi({ tono, icono, valor, children }) {
    return (
        <div className={`kpi-card kpi-${tono}`}>
            <div className="kpi-icon" aria-hidden="true"><i className={`bi ${icono}`}></i></div>
            <div>
                <div className="kpi-value">{valor}</div>
                <div className="kpi-label">{children}</div>
            </div>
        </div>
    );
}
