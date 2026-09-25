<?php
/**
 * Funciones de apoyo de la API: respuestas JSON, lectura del cuerpo,
 * sesion, autenticacion y roles.
 */

declare(strict_types=1);

/* ------------------------------------------------------------------ */
/*  Respuestas JSON para la API REST                                   */
/* ------------------------------------------------------------------ */

/**
 * Envia una respuesta JSON con el codigo HTTP indicado y termina.
 */
function json_response($data, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

/** Respuesta de exito estandar. */
function json_ok($data = null, string $mensaje = 'OK', int $status = 200): void
{
    json_response(['ok' => true, 'mensaje' => $mensaje, 'data' => $data], $status);
}

/** Respuesta de error estandar. */
function json_error(string $mensaje, int $status = 400, $detalle = null): void
{
    json_response(['ok' => false, 'mensaje' => $mensaje, 'detalle' => $detalle], $status);
}

/** Lee y decodifica el cuerpo JSON de la peticion (para POST/PUT). */
function body_json(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === '' || $raw === false) {
        return $_POST ?: [];
    }
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

/* ------------------------------------------------------------------ */
/*  Sesion, autenticacion y roles                                      */
/* ------------------------------------------------------------------ */

function start_session(): void
{
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
}

/** Devuelve el usuario autenticado (array) o null. */
function current_user(): ?array
{
    start_session();
    return $_SESSION['user'] ?? null;
}

function is_logged_in(): bool
{
    return current_user() !== null;
}

function is_admin(): bool
{
    $u = current_user();
    return $u !== null && $u['rol'] === 'admin';
}

/**
 * Protege un endpoint de la API: si no hay sesion, responde 401 JSON.
 */
function require_api_login(): void
{
    if (!is_logged_in()) {
        json_error('No autenticado. Inicie sesion.', 401);
    }
}

/**
 * Exige rol de administrador en la API (responde 403 si no lo es).
 */
function require_api_admin(): void
{
    require_api_login();
    if (!is_admin()) {
        json_error('Acceso denegado. Se requiere rol de administrador.', 403);
    }
}
