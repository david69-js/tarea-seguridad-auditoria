<?php
/** Layout principal. Espera: $content, $titulo (opcional). */
$user = current_user();
$titulo = $titulo ?? 'POS Tienda';
$actual = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?? '';
function nav_active(string $frag, string $actual): string
{
    return strpos($actual, $frag) !== false ? 'active' : '';
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= e($titulo) ?> · POS Tienda</title>

    <!-- API externa: Google Fonts (tipografía profesional) -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">

    <!-- Bootstrap 5 + Iconos -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" rel="stylesheet">

    <link href="<?= base_url('/assets/css/styles.css') ?>" rel="stylesheet">

    <!-- Variables globales + utilidades (deben cargar ANTES de los scripts
         de cada vista, que usan api(), money(), etc.) -->
    <script>
        window.BASE_URL = "<?= base_url('') ?>".replace(/\/$/, '');
        window.USER_ROL = "<?= e($user['rol'] ?? '') ?>";
    </script>
    <script src="<?= base_url('/assets/js/app.js') ?>"></script>
</head>
<body>
<div class="app-shell">
    <!-- Sidebar -->
    <aside class="sidebar">
        <div class="sidebar-brand">
            <i class="bi bi-shop"></i>
            <span>POS Tienda</span>
        </div>
        <nav class="sidebar-nav">
            <a class="nav-link <?= nav_active('/dashboard', $actual) ?>" href="<?= base_url('/dashboard') ?>">
                <i class="bi bi-speedometer2"></i> Dashboard</a>
            <a class="nav-link <?= nav_active('/pos', $actual) ?>" href="<?= base_url('/pos') ?>">
                <i class="bi bi-cart3"></i> Punto de Venta</a>
            <a class="nav-link <?= nav_active('/productos', $actual) ?>" href="<?= base_url('/productos') ?>">
                <i class="bi bi-box-seam"></i> Inventario</a>
            <a class="nav-link <?= nav_active('/ventas', $actual) ?>" href="<?= base_url('/ventas') ?>">
                <i class="bi bi-receipt"></i> Ventas</a>
            <?php /* Ocultos temporalmente (solo visual):
            <a class="nav-link <?= nav_active('/clientes', $actual) ?>" href="<?= base_url('/clientes') ?>">
                <i class="bi bi-people"></i> Clientes</a>
            <a class="nav-link <?= nav_active('/reportes', $actual) ?>" href="<?= base_url('/reportes') ?>">
                <i class="bi bi-graph-up"></i> Reportes</a>
            */ ?>
            <?php if (is_admin()): ?>
            <a class="nav-link <?= nav_active('/usuarios', $actual) ?>" href="<?= base_url('/usuarios') ?>">
                <i class="bi bi-shield-lock"></i> Usuarios</a>
            <?php endif; ?>
        </nav>
        <div class="sidebar-footer">
            <div class="user-badge">
                <i class="bi bi-person-circle"></i>
                <div>
                    <strong><?= e($user['nombre'] ?? '') ?></strong>
                    <small class="d-block text-capitalize"><?= e($user['rol'] ?? '') ?></small>
                </div>
            </div>
            <a href="<?= base_url('/logout') ?>" class="btn btn-sm btn-outline-light w-100 mt-2">
                <i class="bi bi-box-arrow-right"></i> Cerrar sesión</a>
        </div>
    </aside>

    <!-- Contenido -->
    <div class="main-area">
        <header class="topbar">
            <button class="btn btn-sm btn-light d-md-none" id="btnSidebar"><i class="bi bi-list"></i></button>
            <h1 class="topbar-title"><?= e($titulo) ?></h1>
            <span class="badge bg-primary-subtle text-primary-emphasis" id="clock"></span>
        </header>
        <main class="content">
            <?= $content ?>
        </main>
    </div>
</div>

<!-- Bootstrap JS + Chart.js (API externa para gráficas) -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js"></script>
</body>
</html>
