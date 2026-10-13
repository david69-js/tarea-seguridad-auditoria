<?php
/**
 * Controlador de Clientes (API REST) - CRUD completo.
 */

declare(strict_types=1);

function api_clientes_list(): void
{
    require_api_login();
    $q = trim($_GET['q'] ?? '');
    if ($q !== '') {
        $stmt = db()->prepare(
            'SELECT * FROM clientes WHERE nombre LIKE ? OR telefono LIKE ? ORDER BY nombre'
        );
        $stmt->execute(["%$q%", "%$q%"]);
    } else {
        $stmt = db()->query('SELECT * FROM clientes ORDER BY nombre');
    }
    json_ok($stmt->fetchAll(), 'Listado de clientes.');
}

function api_clientes_create(): void
{
    require_api_login();
    $in = body_json();
    $nombre = trim($in['nombre'] ?? '');
    if ($nombre === '') {
        json_error('El nombre del cliente es obligatorio.', 422);
    }
    $stmt = db()->prepare(
        'INSERT INTO clientes (nombre, correo, telefono, direccion) VALUES (?, ?, ?, ?)'
    );
    $stmt->execute([
        $nombre,
        trim($in['correo'] ?? '') ?: null,
        trim($in['telefono'] ?? '') ?: null,
        trim($in['direccion'] ?? '') ?: null,
    ]);
    json_ok(['id' => (int) db()->lastInsertId()], 'Cliente creado.', 201);
}

function api_clientes_update(string $id): void
{
    require_api_login();
    $in = body_json();
    $nombre = trim($in['nombre'] ?? '');
    if ($nombre === '') {
        json_error('El nombre del cliente es obligatorio.', 422);
    }
    $stmt = db()->prepare(
        'UPDATE clientes SET nombre = ?, correo = ?, telefono = ?, direccion = ? WHERE id = ?'
    );
    $stmt->execute([
        $nombre,
        trim($in['correo'] ?? '') ?: null,
        trim($in['telefono'] ?? '') ?: null,
        trim($in['direccion'] ?? '') ?: null,
        (int) $id,
    ]);
    json_ok(null, 'Cliente actualizado.');
}

function api_clientes_delete(string $id): void
{
    require_api_admin();
    try {
        $stmt = db()->prepare('DELETE FROM clientes WHERE id = ?');
        $stmt->execute([(int) $id]);
    } catch (PDOException $e) {
        json_error('No se puede eliminar: el cliente tiene ventas registradas.', 409);
    }
    if ($stmt->rowCount() === 0) {
        json_error('Cliente no encontrado.', 404);
    }
    json_ok(null, 'Cliente eliminado.');
}
