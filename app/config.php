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

// Si Railway entrega una sola URL de conexion, la parseamos.
$mysqlUrl = env('MYSQL_URL') ?? env('DATABASE_URL');
if ($mysqlUrl) {
    $parts = parse_url($mysqlUrl);
    if ($parts !== false) {
        $config['db']['host']     = $parts['host'] ?? $config['db']['host'];
        $config['db']['port']     = isset($parts['port']) ? (string) $parts['port'] : $config['db']['port'];
        $config['db']['user']     = $parts['user'] ?? $config['db']['user'];
        $config['db']['password'] = $parts['pass'] ?? $config['db']['password'];
        $config['db']['name']     = isset($parts['path']) ? ltrim($parts['path'], '/') : $config['db']['name'];
    }
}

return $config;
