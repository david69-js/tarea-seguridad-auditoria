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
