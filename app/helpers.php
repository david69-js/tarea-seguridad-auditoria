<?php
/**
 * Funciones de apoyo: respuestas JSON, autenticacion, roles,
 * renderizado de vistas y utilidades varias.
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
 * Protege una ruta web: si no hay sesion, redirige al login.
 */
function require_login(): void
{
    if (!is_logged_in()) {
        header('Location: ' . base_url('/login'));
        exit;
    }
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

/* ------------------------------------------------------------------ */
/*  Utilidades varias                                                  */
/* ------------------------------------------------------------------ */

/**
 * Construye una URL absoluta respetando el subdirectorio donde corre la app.
 */
function base_url(string $path = ''): string
{
    $base = rtrim(dirname($_SERVER['SCRIPT_NAME'] ?? ''), '/\\');
    if ($base === '.' || $base === '/') {
        $base = '';
    }
    return $base . '/' . ltrim($path, '/');
}

/**
 * URL de un archivo estatico con marca de version.
 *
 * Apache no manda Cache-Control para los estaticos, asi que el navegador
 * aplica cache heuristica y puede seguir usando una copia vieja del CSS o
 * del JS durante horas. Con HTML nuevo y CSS viejo la pagina se ve rota.
 * Anadir ?v=<fecha de modificacion> cambia la URL en cuanto se edita el
 * archivo, de modo que el navegador esta obligado a descargarlo de nuevo.
 */
function asset_url(string $path): string
{
    $rel     = ltrim($path, '/');
    $archivo = __DIR__ . '/../public/' . $rel;
    $url     = base_url('/' . $rel);

    $version = is_file($archivo) ? filemtime($archivo) : false;

    return $version === false ? $url : $url . '?v=' . $version;
}

/** Escapa texto para mostrarlo en HTML (previene XSS). */
function e(?string $text): string
{
    return htmlspecialchars((string) $text, ENT_QUOTES, 'UTF-8');
}

/** Formatea un numero como moneda en Quetzales. */
function money($amount): string
{
    return 'Q ' . number_format((float) $amount, 2);
}

/**
 * Renderiza una vista dentro del layout principal.
 */
function view(string $name, array $data = [], ?string $layout = 'layout/main'): void
{
    extract($data, EXTR_SKIP);
    $viewFile = __DIR__ . '/views/' . $name . '.php';

    if (!file_exists($viewFile)) {
        http_response_code(500);
        echo "Vista no encontrada: {$name}";
        return;
    }

    if ($layout === null) {
        require $viewFile;
        return;
    }

    // Captura el contenido de la vista para inyectarlo en el layout.
    ob_start();
    require $viewFile;
    $content = ob_get_clean();

    require __DIR__ . '/views/' . $layout . '.php';
}
