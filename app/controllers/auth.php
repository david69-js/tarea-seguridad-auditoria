<?php
/**
 * Controlador de Autenticacion (API REST).
 * Login / registro / logout / usuario actual.
 * Contrasenas verificadas con bcrypt (password_verify).
 */

declare(strict_types=1);

function api_auth_login(): void
{
    $in = body_json();
    $correo = trim($in['correo'] ?? '');
    $pass   = (string) ($in['password'] ?? '');

    if ($correo === '' || $pass === '') {
        json_error('Correo y contrasena son obligatorios.', 422);
    }

    $stmt = db()->prepare('SELECT * FROM usuarios WHERE correo = ? AND activo = 1 LIMIT 1');
    $stmt->execute([$correo]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($pass, $user['password_hash'])) {
        json_error('Credenciales invalidas.', 401);
    }

    start_session();
    session_regenerate_id(true);
    $_SESSION['user'] = [
        'id'     => (int) $user['id'],
        'nombre' => $user['nombre'],
        'correo' => $user['correo'],
        'rol'    => $user['rol'],
    ];

    json_ok($_SESSION['user'], 'Sesion iniciada correctamente.');
}

function api_auth_register(): void
{
    $in = body_json();
    $nombre = trim($in['nombre'] ?? '');
    $correo = trim($in['correo'] ?? '');
    $pass   = (string) ($in['password'] ?? '');
    $rol    = ($in['rol'] ?? 'cajero') === 'admin' ? 'admin' : 'cajero';

    if ($nombre === '' || $correo === '' || strlen($pass) < 6) {
        json_error('Nombre, correo y contrasena (min 6 caracteres) son obligatorios.', 422);
    }
    if (mb_strlen($nombre) < 3) {
        json_error('El nombre debe tener al menos 3 caracteres.', 422);
    }
    if (!filter_var($correo, FILTER_VALIDATE_EMAIL)) {
        json_error('El correo no tiene un formato valido.', 422);
    }

    // Solo un admin puede crear otros admin; el registro publico crea cajeros.
    if ($rol === 'admin' && !is_admin()) {
        $rol = 'cajero';
    }

    $exists = db()->prepare('SELECT id FROM usuarios WHERE correo = ?');
    $exists->execute([$correo]);
    if ($exists->fetch()) {
        json_error('Ya existe un usuario con ese correo.', 409);
    }

    $hash = password_hash($pass, PASSWORD_BCRYPT);
    $stmt = db()->prepare(
        'INSERT INTO usuarios (nombre, correo, password_hash, rol) VALUES (?, ?, ?, ?)'
    );
    $stmt->execute([$nombre, $correo, $hash, $rol]);

    json_ok(['id' => (int) db()->lastInsertId()], 'Usuario registrado correctamente.', 201);
}

function api_auth_logout(): void
{
    start_session();
    $_SESSION = [];
    session_destroy();
    json_ok(null, 'Sesion cerrada.');
}

function api_auth_me(): void
{
    require_api_login();
    json_ok(current_user(), 'Usuario autenticado.');
}
