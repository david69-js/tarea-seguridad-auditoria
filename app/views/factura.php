<?php
/**
 * Factura / recibo imprimible.  Espera: $venta (array con detalle).
 * Integra la API externa de códigos QR: https://api.qrserver.com
 * El QR codifica los datos de la factura (verificable con cualquier lector).
 */
$config = require __DIR__ . '/../config.php';
$empresa = $config['app']['empresa'];

$qrData = "Factura POS Tienda\n"
        . "No: " . str_pad((string) $venta['id'], 6, '0', STR_PAD_LEFT) . "\n"
        . "Fecha: " . $venta['fecha'] . "\n"
        . "Total: Q " . number_format($venta['total'], 2) . "\n"
        . "NIT: " . ($venta['cliente_nit'] ?? 'CF');
$qrUrl = $config['app']['qr_api'] . '?size=150x150&data=' . urlencode($qrData);
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Factura #<?= str_pad((string) $venta['id'], 6, '0', STR_PAD_LEFT) ?></title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; background:#f1f5f9; }
        .factura { max-width: 480px; margin: 24px auto; background:#fff; padding: 28px;
                   border-radius: 12px; box-shadow: 0 6px 24px rgba(0,0,0,.08); }
        .factura h3 { font-weight: 700; margin: 0; }
        .factura .muted { color:#64748b; font-size:.85rem; }
        table td { padding: 4px 0; }
        .linea { border-top: 1px dashed #cbd5e1; margin: 12px 0; }
        .total-final { font-size: 1.4rem; font-weight: 700; color:#0f172a; }
        @media print { body { background:#fff; } .no-print { display:none !important; } .factura { box-shadow:none; margin:0; } }
    </style>
</head>
<body>
<div class="factura">
    <div class="text-center mb-2">
        <i class="bi bi-book-half" style="font-size:2rem;color:#4f46e5;"></i>
        <h3><?= e($empresa) ?></h3>
        <div class="muted">Punto de Venta · Guatemala</div>
    </div>
    <div class="linea"></div>

    <div class="d-flex justify-content-between">
        <div>
            <div><strong>Factura No.</strong> <?= str_pad((string) $venta['id'], 6, '0', STR_PAD_LEFT) ?></div>
            <div class="muted"><?= e($venta['fecha']) ?></div>
        </div>
        <div class="text-end">
            <?php if ($venta['estado'] === 'anulada'): ?>
                <span class="badge bg-danger">ANULADA</span>
            <?php else: ?>
                <span class="badge bg-success">PAGADA</span>
            <?php endif; ?>
            <div class="muted text-capitalize mt-1"><?= e($venta['metodo_pago']) ?></div>
        </div>
    </div>

    <div class="mt-2">
        <div><strong>Cliente:</strong> <?= e($venta['cliente_nombre'] ?? 'Consumidor Final') ?></div>
        <div class="muted">NIT: <?= e($venta['cliente_nit'] ?? 'CF') ?> · Atendió: <?= e($venta['cajero']) ?></div>
    </div>

    <div class="linea"></div>

    <table class="w-100">
        <thead>
            <tr class="muted"><td>Cant</td><td>Descripción</td><td class="text-end">Subtotal</td></tr>
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

    <table class="w-100">
        <tr><td>Subtotal</td><td class="text-end"><?= money($venta['subtotal']) ?></td></tr>
        <?php if ($venta['descuento'] > 0): ?>
        <tr><td>Descuento</td><td class="text-end text-danger">- <?= money($venta['descuento']) ?></td></tr>
        <?php endif; ?>
        <tr><td>IVA (12%)</td><td class="text-end"><?= money($venta['iva']) ?></td></tr>
        <tr><td class="total-final pt-2">TOTAL</td><td class="text-end total-final pt-2"><?= money($venta['total']) ?></td></tr>
    </table>

    <div class="linea"></div>

    <div class="text-center">
        <img src="<?= e($qrUrl) ?>" alt="Código QR de la factura" width="150" height="150">
        <div class="muted mt-1">Escanee el código QR para verificar su factura</div>
    </div>

    <div class="text-center muted mt-3">¡Gracias por su compra!</div>

    <div class="no-print text-center mt-4 d-flex gap-2 justify-content-center">
        <button class="btn btn-primary" onclick="window.print()"><i class="bi bi-printer"></i> Imprimir / PDF</button>
        <a class="btn btn-outline-secondary" href="<?= base_url('/pos') ?>"><i class="bi bi-arrow-left"></i> Volver al POS</a>
    </div>
</div>
</body>
</html>
