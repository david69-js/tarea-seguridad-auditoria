/* =====================================================================
 *  Pruebas de caja negra (Jest) — Modulo Autenticacion (Login/Registro)
 *  Proyecto: Sistema POS Web — Tienda El Estudiante (pos_libreria)
 *
 *  Ejecuta los 5 casos documentados en "Formato_Casos_Prueba_POS_Web.docx"
 *  contra la API REST corriendo (POST /api/auth/login y /api/auth/register).
 *
 *  Requisito: la app debe estar levantada (docker compose up) en:
 *      BASE_URL  (por defecto http://localhost:8091)
 *
 *  Uso:
 *      cd pruebas && npm install && npm test
 *      BASE_URL=http://localhost:8091 npm test
 * ===================================================================== */

const BASE_URL = process.env.BASE_URL || 'http://localhost:8091';

/** POST JSON a la API y devuelve { status, data }. */
async function apiPost(path, body) {
  const res = await fetch(BASE_URL + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let data = null;
  try {
    data = await res.json();
  } catch (_) {
    /* respuesta sin cuerpo JSON */
  }
  return { status: res.status, data };
}

describe('Modulo Autenticacion — pruebas de caja negra sobre la API REST', () => {
  // ---- CP-LOGIN-001 -------------------------------------------------
  test('CP-LOGIN-001 · Login exitoso con credenciales correctas → 200', async () => {
    const { status, data } = await apiPost('/api/auth/login', {
      correo: 'admin@libreria.com',
      password: 'admin123',
    });
    expect(status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.data).toMatchObject({ correo: 'admin@libreria.com', rol: 'admin' });
  });

  // ---- CP-LOGIN-002 -------------------------------------------------
  test('CP-LOGIN-002 · Contrasena incorrecta → 401 Credenciales invalidas', async () => {
    const { status, data } = await apiPost('/api/auth/login', {
      correo: 'admin@libreria.com',
      password: 'clave_incorrecta123',
    });
    expect(status).toBe(401);
    expect(data.ok).toBe(false);
    expect(data.mensaje).toMatch(/credenciales/i);
  });

  // ---- CP-LOGIN-003 -------------------------------------------------
  test('CP-LOGIN-003 · Campos vacios → 422 error de validacion', async () => {
    const { status, data } = await apiPost('/api/auth/login', {
      correo: '',
      password: '',
    });
    expect(status).toBe(422);
    expect(data.ok).toBe(false);
    expect(data.mensaje).toMatch(/obligatori/i);
  });

  // ---- CP-REG-001 ---------------------------------------------------
  test('CP-REG-001 · Registro exitoso de un nuevo usuario → 201', async () => {
    // Correo unico por corrida para que la prueba sea repetible.
    const correo = `cajero_nuevo_${Date.now()}@libreria.com`;
    const { status, data } = await apiPost('/api/auth/register', {
      nombre: 'Cajero Nuevo',
      correo,
      password: 'cajero123',
    });
    expect(status).toBe(201);
    expect(data.ok).toBe(true);
    expect(data.data).toHaveProperty('id');
  });

  // ---- CP-REG-002 ---------------------------------------------------
  test('CP-REG-002 · Correo ya registrado → 409 rechazo', async () => {
    const { status, data } = await apiPost('/api/auth/register', {
      nombre: 'Usuario Prueba 2',
      correo: 'admin@libreria.com', // ya existe en el seed
      password: 'cajero123',
    });
    expect(status).toBe(409);
    expect(data.ok).toBe(false);
    expect(data.mensaje).toMatch(/ya existe/i);
  });
});
