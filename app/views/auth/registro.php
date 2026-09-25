<?php
/**
 * Registro de nuevo usuario (sin layout).
 * Espera: $error (opcional), $old (valores previos para no perderlos).
 *
 * Las cuentas creadas aquí son siempre de rol "cajero"; ascender a
 * administrador es una acción del módulo de Usuarios.
 */
$old = $old ?? [];
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="theme-color" content="#4f46e5">
    <title>Crear cuenta · POS Librería</title>
    <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 32 32%27%3E%3Crect width=%2732%27 height=%2732%27 rx=%277%27 fill=%27%234f46e5%27/%3E%3Ctext x=%2716%27 y=%2723%27 font-size=%2719%27 text-anchor=%27middle%27 fill=%27white%27 font-family=%27sans-serif%27%3E%F0%9F%93%9A%3C/text%3E%3C/svg%3E">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" rel="stylesheet">
    <link href="<?= asset_url('/assets/css/styles.css') ?>" rel="stylesheet">
</head>
<body class="auth-page">
    <main class="auth-card">
        <div class="auth-brand">
            <div class="auth-logo"><i class="bi bi-person-plus" aria-hidden="true"></i></div>
            <h1>Crear cuenta</h1>
            <p>Acceso de cajero al punto de venta</p>
        </div>

        <?php if (!empty($error)): ?>
            <div class="alert alert-danger py-2 d-flex gap-2" role="alert">
                <i class="bi bi-exclamation-triangle-fill" aria-hidden="true"></i>
                <span><?= e($error) ?></span>
            </div>
        <?php endif; ?>

        <form method="post" action="<?= base_url('/registro') ?>" novalidate>
            <div class="mb-3">
                <label class="form-label" for="nombre">Nombre completo</label>
                <div class="input-group">
                    <span class="input-group-text"><i class="bi bi-person" aria-hidden="true"></i></span>
                    <input type="text" id="nombre" name="nombre" class="form-control" required
                           minlength="3" autocomplete="name" placeholder="Nombre y apellido"
                           value="<?= e($old['nombre'] ?? '') ?>">
                </div>
            </div>

            <div class="mb-3">
                <label class="form-label" for="correo">Correo electrónico</label>
                <div class="input-group">
                    <span class="input-group-text"><i class="bi bi-envelope" aria-hidden="true"></i></span>
                    <input type="email" id="correo" name="correo" class="form-control" required
                           autocomplete="email" placeholder="usuario@libreria.com"
                           value="<?= e($old['correo'] ?? '') ?>">
                </div>
            </div>

            <div class="mb-3">
                <label class="form-label" for="password">Contraseña</label>
                <div class="input-group">
                    <span class="input-group-text"><i class="bi bi-lock" aria-hidden="true"></i></span>
                    <input type="password" id="password" name="password" class="form-control" required
                           minlength="6" autocomplete="new-password" aria-describedby="ayudaPass">
                    <button class="btn-toggle-pass" type="button" data-toggle-pass="password"
                            aria-label="Mostrar contraseña" aria-pressed="false">
                        <i class="bi bi-eye" aria-hidden="true"></i>
                    </button>
                </div>
                <p class="form-hint" id="ayudaPass">Mínimo 6 caracteres.</p>
            </div>

            <div class="mb-4">
                <label class="form-label" for="password2">Repetir contraseña</label>
                <div class="input-group">
                    <span class="input-group-text"><i class="bi bi-shield-check" aria-hidden="true"></i></span>
                    <input type="password" id="password2" name="password2" class="form-control" required
                           minlength="6" autocomplete="new-password">
                    <button class="btn-toggle-pass" type="button" data-toggle-pass="password2"
                            aria-label="Mostrar contraseña" aria-pressed="false">
                        <i class="bi bi-eye" aria-hidden="true"></i>
                    </button>
                </div>
            </div>

            <button class="btn btn-primary w-100 auth-submit" type="submit">
                <i class="bi bi-check2-circle" aria-hidden="true"></i> Crear cuenta
            </button>
        </form>

        <p class="auth-alt">
            ¿Ya tiene cuenta? <a href="<?= base_url('/login') ?>">Iniciar sesión</a>
        </p>
    </main>

    <p class="auth-foot">© <?= date('Y') ?> Librería y Papelería El Estudiante · Guatemala</p>

    <script src="<?= asset_url('/assets/js/auth.js') ?>"></script>
</body>
</html>
