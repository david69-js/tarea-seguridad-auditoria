<?php
/**
 * Configuracion central de la aplicacion.
 *
 * Lee la configuracion de la base de datos desde variables de entorno
 * (asi funciona igual en local con Docker y en Railway.app), con valores
 * por defecto para desarrollo local.
 */

declare(strict_types=1);

// Zona horaria de Guatemala
date_default_timezone_set('America/Guatemala');

/**
 * Devuelve una variable de entorno o un valor por defecto.
 * (config.php puede incluirse varias veces por petición para leer $config,
 *  por eso protegemos la declaración de la función.)
 */
if (!function_exists('env')) {
    function env(string $key, ?string $default = null): ?string
    {
        // Se consultan las tres fuentes porque, segun el SAPI y el
        // variables_order del php.ini, una variable inyectada por Docker
        // puede aparecer en $_ENV, en $_SERVER o solo en getenv().
        foreach ([$_ENV, $_SERVER] as $source) {
            if (isset($source[$key]) && $source[$key] !== '') {
                return (string) $source[$key];
            }
        }

        $value = getenv($key);
        if ($value === false || $value === '') {
            return $default;
        }
        return $value;
    }
}

// -----------------------------------------------------------------
// Configuracion de base de datos
// Railway (plugin MySQL) expone: MYSQLHOST, MYSQLPORT, MYSQLUSER,
// MYSQLPASSWORD, MYSQLDATABASE  (o la URL completa en MYSQL_URL).
// -----------------------------------------------------------------
$config = [
    'db' => [
        'host'     => env('MYSQLHOST', env('DB_HOST', '127.0.0.1')),
        'port'     => env('MYSQLPORT', env('DB_PORT', '3306')),
        'name'     => env('MYSQLDATABASE', env('DB_NAME', 'pos_libreria')),
        'user'     => env('MYSQLUSER', env('DB_USER', 'root')),
        'password' => env('MYSQLPASSWORD', env('DB_PASSWORD', 'root')),
    ],
    'app' => [
        'name'     => 'POS Tienda',
        'iva'      => 0.12,          // IVA 12%
        'moneda'   => 'GTQ',
        'empresa'  => 'Tienda El Estudiante',
        // API externa de codigos QR (funcionalidad visible en cada factura)
        'qr_api'   => 'https://api.qrserver.com/v1/create-qr-code/',
    ],
];

// Se recuerda si la configuracion viene de variables de entorno reales o de
// los valores por defecto de desarrollo, para poder dar un error util cuando
// el despliegue no tiene las variables enlazadas.
$config['db']['from_env'] = env('MYSQLHOST') !== null
    || env('DB_HOST') !== null
    || env('MYSQL_URL') !== null
    || env('DATABASE_URL') !== null;

// Que variable aporto la configuracion, para poder decirlo en los errores
// sin tener que exponer host ni credenciales.
$config['db']['origen'] = 'valores por defecto de desarrollo';
foreach (['MYSQLHOST', 'DB_HOST', 'DATABASE_URL', 'MYSQL_URL'] as $candidata) {
    if (env($candidata) !== null) {
        $config['db']['origen'] = $candidata;
    }
}

// Si Railway entrega una sola URL de conexion, la parseamos.
$mysqlUrl = env('MYSQL_URL') ?? env('DATABASE_URL');
if ($mysqlUrl) {
    $parts = parse_url($mysqlUrl);

    // Una referencia de Railway sin resolver (`${{MySQL.MYSQL_URL}}`) llega
    // como texto literal: parse_url no le encuentra host y la conexion acaba
    // yendo al 127.0.0.1 por defecto. Se marca para poder avisarlo.
    if ($parts === false || empty($parts['host'])) {
        $config['db']['url_sin_host'] = true;
    }

    if ($parts !== false) {
        $config['db']['host']     = $parts['host'] ?? $config['db']['host'];
        $config['db']['port']     = isset($parts['port']) ? (string) $parts['port'] : $config['db']['port'];
        $config['db']['user']     = $parts['user'] ?? $config['db']['user'];
        $config['db']['password'] = $parts['pass'] ?? $config['db']['password'];
        $config['db']['name']     = isset($parts['path']) ? ltrim($parts['path'], '/') : $config['db']['name'];
    }
}

return $config;
