<?php
/** Layout principal. Espera: $content, $titulo (opcional). */
$user   = current_user();
$titulo = $titulo ?? 'POS Librería';
$actual = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?? '';

/** Marca el enlace activo del menú (clase + aria-current para lectores). */
function nav_active(string $frag, string $actual): bool
{
    return strpos($actual, $frag) !== false;
}

/** Iniciales del usuario para el avatar del menú lateral. */
function iniciales(string $nombre): string
{
    $partes = preg_split('/\s+/', trim($nombre)) ?: [];
    $ini = '';
    foreach (array_slice($partes, 0, 2) as $p) {
        $ini .= mb_strtoupper(mb_substr($p, 0, 1));
    }
    return $ini !== '' ? $ini : '?';
}

$menu = [
    ['/dashboard', 'bi-speedometer2', 'Dashboard',      false],
    ['/pos',       'bi-cart3',        'Punto de Venta', false],
    ['/productos', 'bi-box-seam',     'Inventario',     false],
    ['/ventas',    'bi-receipt',      'Ventas',         false],
    ['/clientes',  'bi-people',       'Clientes',       false],
    ['/reportes',  'bi-graph-up',     'Reportes',       false],
    ['/usuarios',  'bi-shield-lock',  'Usuarios',       true],   // solo admin
];
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Sistema de punto de venta para librería y papelería escolar.">
    <meta name="theme-color" content="#4f46e5">
    <title><?= e($titulo) ?> · POS Librería</title>

    <!-- API externa: Google Fonts (tipografía profesional) -->
    <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 32 32%27%3E%3Crect width=%2732%27 height=%2732%27 rx=%277%27 fill=%27%234f46e5%27/%3E%3Ctext x=%2716%27 y=%2723%27 font-size=%2719%27 text-anchor=%27middle%27 fill=%27white%27 font-family=%27sans-serif%27%3E%F0%9F%93%9A%3C/text%3E%3C/svg%3E">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">

    <!-- Bootstrap 5 + Iconos -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" rel="stylesheet">

    <link href="<?= asset_url('/assets/css/styles.css') ?>" rel="stylesheet">

    <!-- Variables globales + utilidades (deben cargar ANTES de los scripts
         de cada vista, que usan api(), money(), etc.) -->
    <script>
        window.BASE_URL = "<?= base_url('') ?>".replace(/\/$/, '');
        window.USER_ROL = "<?= e($user['rol'] ?? '') ?>";
        window.USER_ID  = <?= (int) ($user['id'] ?? 0) ?>;
    </script>
    <script src="<?= asset_url('/assets/js/app.js') ?>"></script>
</head>
<body>
<a class="skip-link" href="#contenido">Saltar al contenido principal</a>

<div class="app-shell">
    <!-- Menú lateral -->
    <aside class="sidebar" id="sidebar" aria-label="Menú principal">
        <a class="sidebar-brand" href="<?= base_url('/dashboard') ?>">
            <i class="bi bi-book-half" aria-hidden="true"></i>
            <span>POS Librería<small>El Estudiante</small></span>
        </a>

        <nav class="sidebar-nav" aria-label="Secciones del sistema">
            <span class="sidebar-heading">Operación</span>
            <?php foreach ($menu as [$ruta, $icono, $texto, $soloAdmin]): ?>
                <?php if ($soloAdmin && !is_admin()) { continue; } ?>
                <?php if ($ruta === '/usuarios'): ?>
                    <span class="sidebar-heading">Administración</span>
                <?php endif; ?>
                <a class="nav-link <?= nav_active($ruta, $actual) ? 'active' : '' ?>"
                   href="<?= base_url($ruta) ?>"
                   <?= nav_active($ruta, $actual) ? 'aria-current="page"' : '' ?>>
                    <i class="bi <?= $icono ?>" aria-hidden="true"></i> <?= $texto ?>
                </a>
            <?php endforeach; ?>
        </nav>

        <div class="sidebar-footer">
            <div class="user-badge">
                <span class="user-avatar" aria-hidden="true"><?= e(iniciales((string) ($user['nombre'] ?? ''))) ?></span>
                <span class="user-info">
                    <strong><?= e($user['nombre'] ?? '') ?></strong>
                    <small class="d-block"><?= $user && $user['rol'] === 'admin' ? 'Administrador' : 'Cajero' ?></small>
                </span>
            </div>
            <a href="<?= base_url('/logout') ?>" class="btn-logout">
                <i class="bi bi-box-arrow-right" aria-hidden="true"></i> Cerrar sesión
            </a>
        </div>
    </aside>

    <button type="button" class="sidebar-backdrop" id="sidebarBackdrop" tabindex="-1" aria-hidden="true"></button>

    <!-- Contenido -->
    <div class="main-area">
        <header class="topbar">
            <button class="btn-hamburger" id="btnSidebar" type="button"
                    aria-controls="sidebar" aria-expanded="false" aria-label="Abrir menú de navegación">
                <i class="bi bi-list" aria-hidden="true"></i>
            </button>
            <h1 class="topbar-title"><?= e($titulo) ?></h1>
            <span class="topbar-meta" id="clock">
                <i class="bi bi-clock" aria-hidden="true"></i>
                <span id="clockText"></span>
            </span>
        </header>

        <main class="content" id="contenido" tabindex="-1">
            <?= $content ?>
        </main>
    </div>
</div>

<!-- Bootstrap JS + Chart.js (API externa para gráficas) -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js"></script>
</body>
</html>
