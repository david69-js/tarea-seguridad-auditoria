<?php
/**
 * Controlador de Reportes (API REST).
 * Alimenta el dashboard (Chart.js) y los reportes por rango de fechas.
 */

declare(strict_types=1);

/**
 * Resumen para el dashboard: totales del dia, ventas por dia (ultimos 7),
 * por mes (ultimos 6) y KPIs generales.
 */
function api_reportes_dashboard(): void
{
    require_api_login();
    $pdo = db();

    // KPIs
    $hoy = $pdo->query(
        "SELECT COALESCE(SUM(total),0) AS total, COUNT(*) AS num
         FROM ventas WHERE estado='completada' AND DATE(fecha) = CURDATE()"
    )->fetch();

    $mes = $pdo->query(
        "SELECT COALESCE(SUM(total),0) AS total, COUNT(*) AS num
         FROM ventas WHERE estado='completada'
           AND YEAR(fecha)=YEAR(CURDATE()) AND MONTH(fecha)=MONTH(CURDATE())"
    )->fetch();

    $totalProductos = (int) $pdo->query('SELECT COUNT(*) FROM productos WHERE activo=1')->fetchColumn();
    $stockBajo      = (int) $pdo->query('SELECT COUNT(*) FROM productos WHERE activo=1 AND stock < 5')->fetchColumn();
    $totalClientes  = (int) $pdo->query('SELECT COUNT(*) FROM clientes')->fetchColumn();

    // Ventas por dia (ultimos 7 dias)
    $porDia = $pdo->query(
        "SELECT DATE(fecha) AS dia, SUM(total) AS total
         FROM ventas WHERE estado='completada' AND fecha >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
         GROUP BY DATE(fecha) ORDER BY dia"
    )->fetchAll();

    // Ventas por mes (ultimos 6 meses)
    $porMes = $pdo->query(
        "SELECT DATE_FORMAT(fecha, '%Y-%m') AS mes, SUM(total) AS total
         FROM ventas WHERE estado='completada' AND fecha >= DATE_SUB(CURDATE(), INTERVAL 5 MONTH)
         GROUP BY mes ORDER BY mes"
    )->fetchAll();

    // Productos mas vendidos (top 5)
    $topProductos = $pdo->query(
        "SELECT p.nombre, SUM(d.cantidad) AS unidades, SUM(d.subtotal) AS ingresos
         FROM detalle_ventas d
         JOIN productos p ON p.id = d.id_producto
         JOIN ventas v ON v.id = d.id_venta AND v.estado='completada'
         GROUP BY p.id, p.nombre ORDER BY unidades DESC LIMIT 5"
    )->fetchAll();

    json_ok([
        'kpis' => [
            'ventas_hoy'      => (float) $hoy['total'],
            'num_ventas_hoy'  => (int) $hoy['num'],
            'ventas_mes'      => (float) $mes['total'],
            'num_ventas_mes'  => (int) $mes['num'],
            'total_productos' => $totalProductos,
            'stock_bajo'      => $stockBajo,
            'total_clientes'  => $totalClientes,
        ],
        'ventas_por_dia'  => $porDia,
        'ventas_por_mes'  => $porMes,
        'top_productos'   => $topProductos,
    ], 'Datos del dashboard.');
}

/**
 * GET /api/reportes/ventas?desde=YYYY-MM-DD&hasta=YYYY-MM-DD
 * Reporte de ventas por rango de fechas.
 */
function api_reportes_ventas(): void
{
    require_api_login();
    $desde = $_GET['desde'] ?? date('Y-m-01');
    $hasta = $_GET['hasta'] ?? date('Y-m-d');

    $stmt = db()->prepare(
        "SELECT v.id, v.fecha, v.subtotal, v.descuento, v.total, v.estado,
                u.nombre AS cajero, cl.nombre AS cliente
         FROM ventas v
         JOIN usuarios u ON u.id = v.id_usuario
         LEFT JOIN clientes cl ON cl.id = v.id_cliente
         WHERE DATE(v.fecha) BETWEEN ? AND ?
         ORDER BY v.fecha DESC"
    );
    $stmt->execute([$desde, $hasta]);
    $ventas = $stmt->fetchAll();

    $resumen = db()->prepare(
        "SELECT COUNT(*) AS num, COALESCE(SUM(total),0) AS total,
                COALESCE(SUM(descuento),0) AS descuento
         FROM ventas WHERE estado='completada' AND DATE(fecha) BETWEEN ? AND ?"
    );
    $resumen->execute([$desde, $hasta]);

    json_ok([
        'desde'   => $desde,
        'hasta'   => $hasta,
        'resumen' => $resumen->fetch(),
        'ventas'  => $ventas,
    ], 'Reporte de ventas por rango de fechas.');
}

/**
 * GET /api/reportes/productos-vendidos
 * Ranking de productos mas vendidos.
 */
function api_reportes_productos_vendidos(): void
{
    require_api_login();
    $rows = db()->query(
        "SELECT p.codigo, p.nombre, c.nombre AS categoria,
                SUM(d.cantidad) AS unidades, SUM(d.subtotal) AS ingresos
         FROM detalle_ventas d
         JOIN productos p ON p.id = d.id_producto
         LEFT JOIN categorias c ON c.id = p.id_categoria
         JOIN ventas v ON v.id = d.id_venta AND v.estado='completada'
         GROUP BY p.id, p.codigo, p.nombre, c.nombre
         ORDER BY unidades DESC LIMIT 20"
    )->fetchAll();
    json_ok($rows, 'Productos mas vendidos.');
}

/**
 * GET /api/reportes/rentabilidad?desde=YYYY-MM-DD&hasta=YYYY-MM-DD  (solo admin)
 * Rentabilidad por producto: ganancia unitaria actual (precio de venta -
 * precio de compra) y ganancia generada por las ventas del periodo, calculada
 * con el costo guardado en cada linea de venta. Incluye los productos que no
 * se vendieron (ganancia 0), para poder ver tambien los menos rentables.
 *
 * La ganancia por producto es bruta: los descuentos se aplican a la venta
 * completa, no a un producto, asi que se restan al final (ganancia_neta).
 */
function api_reportes_rentabilidad(): void
{
    require_api_admin();
    $desde = $_GET['desde'] ?? date('Y-m-01');
    $hasta = $_GET['hasta'] ?? date('Y-m-d');

    $stmt = db()->prepare(
        "SELECT p.id, p.codigo, p.nombre, c.nombre AS categoria,
                p.precio_compra, p.precio,
                COALESCE(SUM(d.cantidad), 0) AS unidades,
                COALESCE(SUM(d.subtotal), 0) AS ingresos,
                COALESCE(SUM(d.cantidad * (d.precio_unitario - d.costo_unitario)), 0) AS ganancia_total
         FROM productos p
         LEFT JOIN categorias c ON c.id = p.id_categoria
         LEFT JOIN (
             SELECT dv.* FROM detalle_ventas dv
             JOIN ventas v ON v.id = dv.id_venta
             WHERE v.estado = 'completada' AND DATE(v.fecha) BETWEEN ? AND ?
         ) d ON d.id_producto = p.id
         WHERE p.activo = 1
         GROUP BY p.id, p.codigo, p.nombre, c.nombre, p.precio_compra, p.precio
         ORDER BY ganancia_total DESC, (p.precio - p.precio_compra) DESC"
    );
    $stmt->execute([$desde, $hasta]);

    $rows = array_map(static function (array $r): array {
        $r['id']             = (int) $r['id'];
        $r['precio_compra']  = (float) $r['precio_compra'];
        $r['precio']         = (float) $r['precio'];
        $r['ganancia']       = round($r['precio'] - $r['precio_compra'], 2);
        $r['margen']         = $r['precio'] > 0 ? round($r['ganancia'] / $r['precio'] * 100, 1) : 0.0;
        $r['unidades']       = (int) $r['unidades'];
        $r['ingresos']       = round((float) $r['ingresos'], 2);
        $r['ganancia_total'] = round((float) $r['ganancia_total'], 2);
        return $r;
    }, $stmt->fetchAll());

    $desc = db()->prepare(
        "SELECT COALESCE(SUM(descuento), 0) FROM ventas
         WHERE estado = 'completada' AND DATE(fecha) BETWEEN ? AND ?"
    );
    $desc->execute([$desde, $hasta]);
    $descuentos = round((float) $desc->fetchColumn(), 2);
    $bruta      = round(array_sum(array_column($rows, 'ganancia_total')), 2);

    json_ok([
        'desde'          => $desde,
        'hasta'          => $hasta,
        'ganancia_bruta' => $bruta,
        'descuentos'     => $descuentos,
        'ganancia_neta'  => round($bruta - $descuentos, 2),
        'productos'      => $rows,
    ], 'Rentabilidad por producto.');
}
