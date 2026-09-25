<?php
/**
 * Carga inicial del esquema.
 *
 * Se ejecuta al arrancar el contenedor. Solo hace algo si la base esta
 * vacia: si la tabla `usuarios` ya existe, no toca nada. Esa comprobacion
 * es importante porque el .sql empieza con DROP TABLE y volver a aplicarlo
 * sobre una base con datos los borraria.
 *
 * Nunca aborta el arranque: si la base no responde, se registra el motivo
 * y Apache levanta igualmente para poder diagnosticar por HTTP.
 */

declare(strict_types=1);

const INTENTOS = 10;
const ESPERA_SEGUNDOS = 3;

function log_mig(string $mensaje): void
{
    fwrite(STDERR, '[migrate] ' . $mensaje . PHP_EOL);
}

if (getenv('SKIP_DB_BOOTSTRAP') === '1') {
    log_mig('SKIP_DB_BOOTSTRAP=1, no se toca la base.');
    exit(0);
}

$config = require __DIR__ . '/../app/config.php';
$db = $config['db'];

if (empty($db['from_env'])) {
    log_mig('Sin variables de base de datos; no se intenta la carga inicial.');
    exit(0);
}

$dsn = sprintf(
    'mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4',
    $db['host'],
    $db['port'],
    $db['name']
);

// La red privada de Railway tarda unos segundos en estar lista tras el
// arranque del contenedor, de ahi los reintentos.
$pdo = null;
for ($intento = 1; $intento <= INTENTOS; $intento++) {
    try {
        $pdo = new PDO($dsn, $db['user'], $db['password'], [
            PDO::ATTR_ERRMODE                  => PDO::ERRMODE_EXCEPTION,
            PDO::MYSQL_ATTR_MULTI_STATEMENTS   => true,
        ]);
        break;
    } catch (PDOException $e) {
        log_mig(sprintf('intento %d/%d sin conexion: %s', $intento, INTENTOS, $e->getMessage()));
        if ($intento < INTENTOS) {
            sleep(ESPERA_SEGUNDOS);
        }
    }
}

if (!$pdo instanceof PDO) {
    log_mig('No se pudo conectar; Apache arranca igual.');
    exit(0);
}

try {
    $stmt = $pdo->prepare(
        'SELECT COUNT(*) FROM information_schema.tables
          WHERE table_schema = ? AND table_name = ?'
    );
    $stmt->execute([$db['name'], 'usuarios']);

    if ((int) $stmt->fetchColumn() > 0) {
        log_mig('La tabla usuarios ya existe; no se carga nada.');
        exit(0);
    }

    $ruta = __DIR__ . '/../database/pos_libreria.sql';
    $sql = file_get_contents($ruta);
    if ($sql === false || trim($sql) === '') {
        log_mig('No se pudo leer ' . $ruta);
        exit(0);
    }

    log_mig('Base vacia: cargando el esquema inicial...');
    $pdo->exec($sql);

    $tablas = (int) $pdo->query(
        'SELECT COUNT(*) FROM information_schema.tables
          WHERE table_schema = DATABASE()'
    )->fetchColumn();

    log_mig(sprintf('Esquema cargado correctamente (%d tablas).', $tablas));
} catch (PDOException $e) {
    log_mig('Fallo la carga inicial: ' . $e->getMessage());
}

exit(0);
