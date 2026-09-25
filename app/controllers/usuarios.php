<?php
/**
 * Controlador de Usuarios (API REST) - gestion completa para el admin.
 *
 * El alta de usuarios vive en auth.php (POST /api/auth/register), porque
 * tambien la usa el registro publico. Aqui estan la consulta, la edicion
 * y la baja, todas restringidas al rol administrador.
 *
 * Reglas de negocio que se protegen en el servidor (no solo en la UI):
 *   - Un admin no puede quitarse a si mismo el rol ni desactivarse.
 *   - Siempre debe quedar al menos un administrador activo.
 *   - La baja es logica (activo = 0): las ventas conservan su cajero.
 */

declare(strict_types=1);

/** GET /api/usuarios  - listado con filtro opcional ?q= */
function api_usuarios_list(): void
{
    require_api_admin();

    $q = trim($_GET['q'] ?? '');
    $sql = 'SELECT u.id, u.nombre, u.correo, u.rol, u.activo, u.created_at,
                   (SELECT COUNT(*) FROM ventas v WHERE v.id_usuario = u.id) AS ventas
            FROM usuarios u';
    $params = [];

    if ($q !== '') {
        $sql .= ' WHERE u.nombre LIKE ? OR u.correo LIKE ?';
        $params[] = "%$q%";
        $params[] = "%$q%";
    }
    $sql .= ' ORDER BY u.activo DESC, u.nombre';

    $stmt = db()->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll();

    foreach ($rows as &$r) {
        $r['id']     = (int) $r['id'];
        $r['activo'] = (bool) $r['activo'];
        $r['ventas'] = (int) $r['ventas'];
    }

    json_ok($rows, 'Listado de usuarios.');
}

/** GET /api/usuarios/{id} */
function api_usuarios_get(string $id): void
{
    require_api_admin();

    $stmt = db()->prepare(
        'SELECT id, nombre, correo, rol, activo, created_at FROM usuarios WHERE id = ?'
    );
    $stmt->execute([(int) $id]);
    $row = $stmt->fetch();

    if (!$row) {
        json_error('Usuario no encontrado.', 404);
    }

    $row['id']     = (int) $row['id'];
    $row['activo'] = (bool) $row['activo'];
    json_ok($row, 'Detalle del usuario.');
}

/**
 * PUT /api/usuarios/{id}
 * Body: {nombre, correo, rol, activo, password?}
 * La contrasena solo se cambia si viene en el cuerpo y no esta vacia.
 */
function api_usuarios_update(string $id): void
{
    require_api_admin();

    $id  = (int) $id;
    $in  = body_json();
    $yo  = current_user();

    $stmt = db()->prepare('SELECT * FROM usuarios WHERE id = ?');
    $stmt->execute([$id]);
    $actual = $stmt->fetch();
    if (!$actual) {
        json_error('Usuario no encontrado.', 404);
    }

    $nombre = trim($in['nombre'] ?? $actual['nombre']);
    $correo = trim($in['correo'] ?? $actual['correo']);
    $rol    = ($in['rol'] ?? $actual['rol']) === 'admin' ? 'admin' : 'cajero';
    $activo = array_key_exists('activo', $in)
        ? (int) filter_var($in['activo'], FILTER_VALIDATE_BOOLEAN)
        : (int) $actual['activo'];
    $pass   = (string) ($in['password'] ?? '');

    // --- Validaciones de formato ---
    if ($nombre === '' || $correo === '') {
        json_error('Nombre y correo son obligatorios.', 422);
    }
    if (!filter_var($correo, FILTER_VALIDATE_EMAIL)) {
        json_error('El correo no tiene un formato valido.', 422);
    }
    if ($pass !== '' && strlen($pass) < 6) {
        json_error('La contrasena debe tener al menos 6 caracteres.', 422);
    }

    // --- Reglas para no dejar el sistema sin administrador ---
    if ($id === (int) $yo['id'] && $rol !== 'admin') {
        json_error('No puede quitarse a si mismo el rol de administrador.', 409);
    }
    if ($id === (int) $yo['id'] && $activo === 0) {
        json_error('No puede desactivar su propio usuario.', 409);
    }
    if ($actual['rol'] === 'admin' && ($rol !== 'admin' || $activo === 0)) {
        $otros = (int) db()->query(
            "SELECT COUNT(*) FROM usuarios WHERE rol = 'admin' AND activo = 1 AND id <> " . $id
        )->fetchColumn();
        if ($otros === 0) {
            json_error('Debe existir al menos un administrador activo.', 409);
        }
    }

    // --- Correo unico ---
    $dup = db()->prepare('SELECT id FROM usuarios WHERE correo = ? AND id <> ?');
    $dup->execute([$correo, $id]);
    if ($dup->fetch()) {
        json_error('Ya existe otro usuario con ese correo.', 409);
    }

    if ($pass !== '') {
        $stmt = db()->prepare(
            'UPDATE usuarios SET nombre = ?, correo = ?, rol = ?, activo = ?, password_hash = ?
             WHERE id = ?'
        );
        $stmt->execute([$nombre, $correo, $rol, $activo, password_hash($pass, PASSWORD_BCRYPT), $id]);
    } else {
        $stmt = db()->prepare(
            'UPDATE usuarios SET nombre = ?, correo = ?, rol = ?, activo = ? WHERE id = ?'
        );
        $stmt->execute([$nombre, $correo, $rol, $activo, $id]);
    }

    // Si el admin se edito a si mismo, la sesion debe reflejar los datos nuevos.
    if ($id === (int) $yo['id']) {
        start_session();
        $_SESSION['user']['nombre'] = $nombre;
        $_SESSION['user']['correo'] = $correo;
        $_SESSION['user']['rol']    = $rol;
    }

    json_ok(null, 'Usuario actualizado.');
}

/**
 * DELETE /api/usuarios/{id}
 * Baja logica: el usuario deja de poder entrar, pero sus ventas siguen
 * teniendo cajero. Si nunca vendio nada, se borra de verdad.
 */
function api_usuarios_delete(string $id): void
{
    require_api_admin();

    $id = (int) $id;
    $yo = current_user();

    if ($id === (int) $yo['id']) {
        json_error('No puede eliminar su propio usuario.', 409);
    }

    $stmt = db()->prepare('SELECT rol, activo FROM usuarios WHERE id = ?');
    $stmt->execute([$id]);
    $usuario = $stmt->fetch();
    if (!$usuario) {
        json_error('Usuario no encontrado.', 404);
    }

    if ($usuario['rol'] === 'admin') {
        $otros = (int) db()->query(
            "SELECT COUNT(*) FROM usuarios WHERE rol = 'admin' AND activo = 1 AND id <> " . $id
        )->fetchColumn();
        if ($otros === 0) {
            json_error('Debe existir al menos un administrador activo.', 409);
        }
    }

    $ventas = db()->prepare('SELECT COUNT(*) FROM ventas WHERE id_usuario = ?');
    $ventas->execute([$id]);

    if ((int) $ventas->fetchColumn() > 0) {
        db()->prepare('UPDATE usuarios SET activo = 0 WHERE id = ?')->execute([$id]);
        json_ok(null, 'Usuario desactivado (tiene ventas registradas).');
    }

    db()->prepare('DELETE FROM usuarios WHERE id = ?')->execute([$id]);
    json_ok(null, 'Usuario eliminado.');
}
