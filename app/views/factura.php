<?php
/**
 * Factura / recibo imprimible.  Espera: $venta (array con detalle).
 * Integra la API externa de códigos QR: https://api.qrserver.com
 * El QR codifica los datos de la factura (verificable con cualquier lector).
 */
$config  = require __DIR__ . '/../config.php';
$empresa = $config['app']['empresa'];
$folio   = str_pad((string) $venta['id'], 6, '0', STR_PAD_LEFT);

$qrData = "Factura POS Libreria\n"
        . "No: " . $folio . "\n"
        . "Fecha: " . $venta['fecha'] . "\n"
        . "Total: Q " . number_format($venta['total'], 2) . "\n"
        . "NIT: " . ($venta['cliente_nit'] ?? 'CF');
$qrUrl = $config['app']['qr_api'] . '?size=160x160&data=' . urlencode($qrData);
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Factura #<?= $folio ?> · POS Librería</title>
    <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 32 32%27%3E%3Crect width=%2732%27 height=%2732%27 rx=%277%27 fill=%27%234f46e5%27/%3E%3Ctext x=%2716%27 y=%2723%27 font-size=%2719%27 text-anchor=%27middle%27 fill=%27white%27 font-family=%27sans-serif%27%3E%F0%9F%93%9A%3C/text%3E%3C/svg%3E">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" rel="stylesheet">
    <style>
        /* La factura no carga styles.css (es una vista independiente para
           imprimir), así que aquí se fija el color de marca de los botones. */
        :root { --bs-primary: #4f46e5; --bs-primary-rgb: 79, 70, 229; }
        .btn-primary { background: #4f46e5; border-color: #4f46e5; }
        .btn-primary:hover { background: #4338ca; border-color: #4338ca; }
        body { font-family: 'Inter', system-ui, sans-serif; background: #eef1f7; color: #0f172a; margin: 0; padding: 1.5rem 1rem; }
        .factura {
            max-width: 480px; margin: 0 auto; background: #fff; padding: 30px;
            border-radius: 16px; box-shadow: 0 10px 34px rgba(15, 23, 42, .12);
        }
        .factura h1 { font-size: 1.15rem; font-weight: 700; margin: .4rem 0 0; }
        .muted { color: #5b6b82; font-size: .84rem; }
        .linea { border-top: 1px dashed #cbd5e1; margin: 14px 0; }
        table { width: 100%; border-collapse: collapse; }
        table td, table th { padding: 5px 0; vertical-align: top; }
        thead th { font-size: .72rem; text-transform: uppercase; letter-spacing: .05em; color: #5b6b82; font-weight: 600; text-align: left; }
        .total-final { font-size: 1.35rem; font-weight: 700; }
        .logo {
            width: 48px; height: 48px; margin: 0 auto; border-radius: 13px;
            display: grid; place-items: center; font-size: 1.4rem; color: #fff;
            background: linear-gradient(135deg, #6366f1, #4f46e5);
        }
        .estado { display: inline-block; padding: .2rem .6rem; border-radius: 999px; font-size: .74rem; font-weight: 600; }
        .estado-pagada { background: #ecfdf5; color: #047857; }
        .estado-anulada { background: #fef2f2; color: #b91c1c; }
        .qr-box { text-align: center; }
        .qr-box img { border: 1px solid #e2e8f0; border-radius: 10px; padding: 6px; background: #fff; }
        .acciones { display: flex; gap: .6rem; justify-content: center; margin-top: 1.5rem; }
        a, button { font-family: inherit; }
        :focus-visible { outline: 3px solid #4f46e5; outline-offset: 2px; }
        @media print {
            body { background: #fff; padding: 0; }
            .no-print { display: none !important; }
            .factura { box-shadow: none; margin: 0; max-width: none; padding: 0; border-radius: 0; }
        }
    </style>
</head>
<body>
<main class="factura">
    <div class="text-center">
        <div class="logo" aria-hidden="true"><i class="bi bi-book-half"></i></div>
        <h1><?= e($empresa) ?></h1>
        <div class="muted">Punto de Venta · Guatemala</div>
    </div>

    <div class="linea"></div>

    <div class="d-flex justify-content-between">
        <div>
            <div><strong>Factura No.</strong> <?= $folio ?></div>
            <div class="muted"><?= e($venta['fecha']) ?></div>
        </div>
        <div class="text-end">
            <?php if ($venta['estado'] === 'anulada'): ?>
                <span class="estado estado-anulada">ANULADA</span>
            <?php else: ?>
                <span class="estado estado-pagada">PAGADA</span>
            <?php endif; ?>
            <div class="muted text-capitalize mt-1"><?= e($venta['metodo_pago']) ?></div>
        </div>
    </div>

    <div class="mt-2">
        <div><strong>Cliente:</strong> <?= e($venta['cliente_nombre'] ?? 'Consumidor Final') ?></div>
        <div class="muted">NIT: <?= e($venta['cliente_nit'] ?? 'CF') ?> · Atendió: <?= e($venta['cajero']) ?></div>
    </div>

    <div class="linea"></div>

    <table>
        <caption class="visually-hidden">Detalle de los productos facturados</caption>
        <thead>
            <tr>
                <th scope="col">Cant</th>
                <th scope="col">Descripción</th>
                <th scope="col" class="text-end">Subtotal</th>
            </tr>
        </thead>
        <tbody>
        <?php foreach ($venta['detalle'] as $d): ?>
            <tr>
                <td><?= (int) $d['cantidad'] ?></td>
                <td><?= e($d['producto']) ?><br><span class="muted"><?= money($d['precio_unitario']) ?> c/u</span></td>
                <td class="text-end"><?= money($d['subtotal']) ?></td>
            </tr>
        <?php endforeach; ?>
        </tbody>
    </table>

    <div class="linea"></div>

    <table>
        <tr><td>Subtotal</td><td class="text-end"><?= money($venta['subtotal']) ?></td></tr>
        <?php if ($venta['descuento'] > 0): ?>
        <tr><td>Descuento</td><td class="text-end" style="color:#b91c1c">− <?= money($venta['descuento']) ?></td></tr>
        <?php endif; ?>
        <tr><td>IVA (12%)</td><td class="text-end"><?= money($venta['iva']) ?></td></tr>
        <tr>
            <td class="total-final pt-2">TOTAL</td>
            <td class="text-end total-final pt-2"><?= money($venta['total']) ?></td>
        </tr>
    </table>

    <div class="linea"></div>

    <div class="qr-box">
        <img src="<?= e($qrUrl) ?>" width="160" height="160"
             alt="Código QR con los datos de la factura <?= $folio ?>">
        <div class="muted mt-2">Escanee el código QR para verificar su factura</div>
    </div>

    <p class="text-center muted mt-3 mb-0">¡Gracias por su compra!</p>

    <div class="acciones no-print">
        <button class="btn btn-primary" onclick="window.print()">
            <i class="bi bi-printer" aria-hidden="true"></i> Imprimir / PDF
        </button>
        <a class="btn btn-outline-secondary" href="<?= base_url('/pos') ?>">
            <i class="bi bi-arrow-left" aria-hidden="true"></i> Volver al POS
        </a>
    </div>
</main>
</body>
</html>
