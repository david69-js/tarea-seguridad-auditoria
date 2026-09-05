<?php
/**
 * Controlador del Clima (API REST) - integracion con OpenWeatherMap.
 *
 * La llamada a la API externa se hace desde el servidor, no desde el
 * navegador, por dos motivos:
 *   1. La API key nunca viaja al cliente (no aparece en el HTML ni en la
 *      pestana de red del navegador).
 *   2. Se puede cachear la respuesta y no gastar la cuota gratuita en cada
 *      recarga del dashboard.
 *
 * Variables de entorno:
 *   OPENWEATHER_API_KEY  clave gratuita de https://openweathermap.org/api
 *   OPENWEATHER_CIUDAD   ciudad a consultar (por defecto "Guatemala City,GT")
 */

declare(strict_types=1);

const CLIMA_CACHE_SEGUNDOS = 900;   // 15 minutos

/**
 * GET /api/clima
 * Devuelve el clima actual de la ciudad configurada.
 */
function api_clima(): void
{
    require_api_login();

    // config.php define la funcion env(); se carga aqui porque este endpoint
    // puede resolverse sin haber tocado la base de datos.
    require_once __DIR__ . '/../config.php';

    $apiKey = env('OPENWEATHER_API_KEY');
    $ciudad = env('OPENWEATHER_CIUDAD', 'Guatemala City,GT');

    if ($apiKey === null || $apiKey === '') {
        json_error(
            'El clima no esta configurado.',
            503,
            'Defina OPENWEATHER_API_KEY con una clave gratuita de openweathermap.org.'
        );
    }

    $cacheado = clima_cache_leer($ciudad);
    if ($cacheado !== null) {
        json_ok($cacheado, 'Clima actual (cache).');
    }

    $url = 'https://api.openweathermap.org/data/2.5/weather?' . http_build_query([
        'q'     => $ciudad,
        'appid' => $apiKey,
        'units' => 'metric',
        'lang'  => 'es',
    ]);

    $crudo = clima_http_get($url);
    if ($crudo === null) {
        json_error('No se pudo consultar el servicio de clima.', 502);
    }

    $data = json_decode($crudo, true);
    if (!is_array($data) || (int) ($data['cod'] ?? 0) !== 200) {
        // OpenWeather devuelve el detalle en "message" (clave invalida, ciudad
        // inexistente, cuota agotada...). Se pasa tal cual porque es util y no
        // contiene datos sensibles.
        json_error(
            'El servicio de clima rechazo la consulta.',
            502,
            $data['message'] ?? null
        );
    }

    $clima = [
        'ciudad'      => $data['name'] ?? $ciudad,
        'pais'        => $data['sys']['country'] ?? '',
        'temperatura' => round((float) ($data['main']['temp'] ?? 0), 1),
        'sensacion'   => round((float) ($data['main']['feels_like'] ?? 0), 1),
        'humedad'     => (int) ($data['main']['humidity'] ?? 0),
        'viento'      => round((float) ($data['wind']['speed'] ?? 0) * 3.6, 1), // m/s -> km/h
        'descripcion' => ucfirst((string) ($data['weather'][0]['description'] ?? '')),
        'icono'       => (string) ($data['weather'][0]['icon'] ?? '01d'),
        'actualizado' => date('H:i'),
    ];

    clima_cache_guardar($ciudad, $clima);
    json_ok($clima, 'Clima actual.');
}

/**
 * Descarga una URL con cURL y, si no esta disponible, con file_get_contents.
 * Devuelve el cuerpo de la respuesta o null si fallo.
 */
function clima_http_get(string $url): ?string
{
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 6,
            CURLOPT_CONNECTTIMEOUT => 4,
        ]);
        $body = curl_exec($ch);
        curl_close($ch);
        return is_string($body) && $body !== '' ? $body : null;
    }

    $ctx  = stream_context_create(['http' => ['timeout' => 6, 'ignore_errors' => true]]);
    $body = @file_get_contents($url, false, $ctx);
    return is_string($body) && $body !== '' ? $body : null;
}

/** Ruta del archivo de cache para una ciudad. */
function clima_cache_ruta(string $ciudad): string
{
    return sys_get_temp_dir() . '/pos_clima_' . md5($ciudad) . '.json';
}

/** Lee la cache si sigue vigente; null si no hay o ya caduco. */
function clima_cache_leer(string $ciudad): ?array
{
    $archivo = clima_cache_ruta($ciudad);
    if (!is_file($archivo) || (time() - filemtime($archivo)) > CLIMA_CACHE_SEGUNDOS) {
        return null;
    }
    $data = json_decode((string) file_get_contents($archivo), true);
    return is_array($data) ? $data : null;
}

/** Guarda la respuesta en cache (si falla, no pasa nada: se repite la consulta). */
function clima_cache_guardar(string $ciudad, array $clima): void
{
    @file_put_contents(clima_cache_ruta($ciudad), json_encode($clima, JSON_UNESCAPED_UNICODE));
}
