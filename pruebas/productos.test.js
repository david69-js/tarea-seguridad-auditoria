/* =====================================================================
 *  Módulo 2: Gestión de Productos (CRUD) — Sistema POS Web, Tienda Bugambilias
 *
 *  Casos planificados en "proyecto_modulos_pruebas_gantt": CP-PROD-001 a 004,
 *  más CP-PROD-005 (permisos por rol).
 *
 *  Tipo de caja:
 *   - Caja negra:  se prueba contra el requerimiento (entrada → salida), sin
 *                  mirar el código de app/controllers/productos.php.
 *   - Caja blanca: los datos se eligieron leyendo el código, para recorrer
 *                  cada rama de validación de api_productos_create().
 *   - Caja gris:   se conoce parte del diseño interno (roles y qué campos
 *                  filtra producto_json()) sin probar línea por línea.
 *
 *  Requisito: la app levantada con Docker (BASE_URL, por defecto :8091).
 * ===================================================================== */

const { iniciarSesion, codigoUnico } = require('./sesion');

let admin;
let cajero;

beforeAll(async () => {
  admin = await iniciarSesion('admin@tienda.com', 'admin123');
  cajero = await iniciarSesion('cajero@tienda.com', 'cajero123');
});

/** Crea un producto válido y devuelve su id. */
async function crearProducto(extra = {}) {
  const r = await admin.post('/api/productos', {
    codigo: codigoUnico('PRD'),
    nombre: 'Producto de prueba',
    precio_compra: 7,
    precio: 10,
    stock: 20,
    id_categoria: 3,
    ...extra,
  });
  expect(r.status).toBe(201);
  return r.data.data.id;
}

describe('Módulo 2 · Gestión de Productos (CRUD)', () => {
  // ---- CP-PROD-001 ----------------------------------------------------
  test('CP-PROD-001 [Caja negra] Registro exitoso de un nuevo producto → 201 y aparece en el listado', async () => {
    const codigo = codigoUnico('ARZ');
    const r = await admin.post('/api/productos', {
      codigo, nombre: 'Arroz Integral 1 lb', precio_compra: 6, precio: 8.5, stock: 40, id_categoria: 2,
    });

    expect(r.status).toBe(201);
    expect(r.data.mensaje).toBe('Producto creado.');

    const lista = await admin.get('/api/productos?q=' + codigo);
    expect(lista.data.data).toHaveLength(1);
    expect(lista.data.data[0]).toMatchObject({ codigo, nombre: 'Arroz Integral 1 lb', precio: 8.5, stock: 40 });
  });

  // ---- CP-PROD-002 ----------------------------------------------------
  test('CP-PROD-002 [Caja negra] Actualización del precio → el nuevo precio se refleja en el listado', async () => {
    const id = await crearProducto({ precio: 10 });

    const r = await admin.put(`/api/productos/${id}`, { precio: 12.5 });
    expect(r.status).toBe(200);

    const detalle = await admin.get(`/api/productos/${id}`);
    expect(detalle.data.data.precio).toBe(12.5);
  });

  // ---- CP-PROD-003 ----------------------------------------------------
  test('CP-PROD-003 [Caja negra] Eliminación → el producto desaparece del listado y de la venta', async () => {
    const codigo = codigoUnico('ELI');
    const id = await crearProducto({ codigo });

    const r = await admin.del(`/api/productos/${id}`);
    expect(r.status).toBe(200);

    const lista = await admin.get('/api/productos?q=' + codigo);
    expect(lista.data.data).toHaveLength(0);

    // Ya no se puede vender (no está disponible para el POS)
    const venta = await admin.post('/api/ventas', { items: [{ id_producto: id, cantidad: 1 }] });
    expect(venta.status).toBe(422);
    expect(venta.data.mensaje).toMatch(/no existe/i);
  });

  // ---- CP-PROD-004 ----------------------------------------------------
  // Caja blanca: un caso por cada rama de validación de api_productos_create()
  // (app/controllers/productos.php). Todas deben rechazar sin guardar nada.
  describe('CP-PROD-004 [Caja blanca] Campos obligatorios vacíos o inválidos → no se guarda', () => {
    const base = { codigo: 'X', nombre: 'Producto', precio_compra: 5, precio: 8 };

    test.each([
      ['rama 1: código vacío', 422, { ...base, codigo: '' }, /codigo y nombre son obligatorios/i],
      ['rama 1: nombre vacío', 422, { ...base, nombre: '   ' }, /codigo y nombre son obligatorios/i],
      ['rama 2: sin precio de compra', 422, { codigo: 'X', nombre: 'P', precio: 8 }, /precio de compra y el precio de venta son obligatorios/i],
      ['rama 2: precio de venta vacío', 422, { ...base, precio: '' }, /precio de compra y el precio de venta son obligatorios/i],
      ['rama 3: precio de compra negativo', 422, { ...base, precio_compra: -1 }, /precio de compra debe ser un numero mayor o igual a 0/i],
      ['rama 3: precio de venta no numérico', 422, { ...base, precio: 'diez' }, /precio de venta debe ser un numero mayor o igual a 0/i],
    ])('%s → %i', async (_rama, estado, datos, mensaje) => {
      const codigo = codigoUnico('INV');
      const r = await admin.post('/api/productos', { ...datos, codigo: datos.codigo === 'X' ? codigo : datos.codigo });
      expect(r.status).toBe(estado);
      expect(r.data.mensaje).toMatch(mensaje);

      // No quedó guardado
      const lista = await admin.get('/api/productos?q=' + codigo);
      expect(lista.data.data).toHaveLength(0);
    });

    test('rama 4: código repetido → 409 (catch del INSERT)', async () => {
      const codigo = codigoUnico('DUP');
      await crearProducto({ codigo });
      const r = await admin.post('/api/productos', { ...base, codigo });
      expect(r.status).toBe(409);
      expect(r.data.mensaje).toMatch(/ya existe un producto con ese codigo/i);
    });
  });

  // ---- CP-PROD-005 ----------------------------------------------------
  describe('CP-PROD-005 [Caja gris] Permisos por rol', () => {
    test('un cajero no puede crear productos ni ve el precio de compra', async () => {
      const r = await cajero.post('/api/productos', { codigo: codigoUnico('CAJ'), nombre: 'X', precio_compra: 1, precio: 2 });
      expect(r.status).toBe(403);

      // producto_json() quita el costo para quien no es admin
      const lista = await cajero.get('/api/productos');
      expect(lista.status).toBe(200);
      lista.data.data.forEach((p) => {
        expect(p).not.toHaveProperty('precio_compra');
        expect(p).not.toHaveProperty('ganancia');
      });
    });
  });
});
