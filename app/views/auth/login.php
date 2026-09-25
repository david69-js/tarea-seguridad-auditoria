<?php /** Vista de Login (sin layout). Espera: $error (opcional). */ ?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Iniciar sesión · POS Tienda</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Inter:wght@400;500&display=swap" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" rel="stylesheet">
    <link href="<?= base_url('/assets/css/styles.css') ?>" rel="stylesheet">
</head>
<body class="login-page">
    <div class="login-card shadow-lg">
        <div class="login-brand">
            <i class="bi bi-shop"></i>
            <h2>Tiendita Xesic</h2>
            <p>Sistema de Punto de Venta</p>
        </div>

        <?php if (!empty($error)): ?>
            <div class="alert alert-danger py-2">
                <i class="bi bi-exclamation-triangle"></i> Credenciales inválidas. Intente de nuevo.
            </div>
        <?php endif; ?>

        <form method="post" action="<?= base_url('/login') ?>">
            <div class="mb-3">
                <label class="form-label">Correo electrónico</label>
                <div class="input-group">
                    <span class="input-group-text"><i class="bi bi-envelope"></i></span>
                    <input type="email" name="correo" class="form-control" required autofocus
                           placeholder="admin@libreria.com" value="admin@libreria.com">
                </div>
            </div>
            <div class="mb-4">
                <label class="form-label">Contraseña</label>
                <div class="input-group">
                    <span class="input-group-text"><i class="bi bi-lock"></i></span>
                    <input type="password" name="password" class="form-control" required
                           placeholder="••••••••" value="admin123">
                </div>
            </div>
            <button class="btn btn-primary w-100 py-2" type="submit">
                <i class="bi bi-box-arrow-in-right"></i> Ingresar
            </button>
        </form>

        <div class="login-hint">
            <strong>Usuarios de prueba:</strong><br>
            admin@libreria.com / admin123 &nbsp;·&nbsp; cajero@libreria.com / cajero123
        </div>
    </div>
</body>
</html>
