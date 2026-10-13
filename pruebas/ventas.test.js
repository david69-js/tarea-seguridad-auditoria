/* =====================================================================
 *  Módulo: Ventas (POS) — Sistema POS Web, Tienda Bugambilias (pos_tienda)
 *
 *  Prueba el registro de ventas contra la API REST real
 *  (POST /api/ventas, GET /api/ventas/{id}), definida en
 *  app/controllers/ventas.php.
 *
 *  Reglas del negocio verificadas:
 *   - La venta es atómica: cabecera + detalle + pago y descuento de stock.
 *   - total = subtotal − descuento  (precios finales, sin IVA, pago en efectivo).
 *   - Cada línea guarda costo_unitario (el precio de compra del momento), para
 *     que la ganancia histórica no cambie si luego se edita el costo.
 *   - No se puede vender más de lo que hay en stock.
 *
 *  Tipo de caja:
 *   - Caja negra: CP-VENTA-001, 002 y 003 (entrada → salida por la API).
 *   - Caja gris:  CP-VENTA-004 (se conoce que detalle_ventas guarda
 *                 costo_unitario y se verifica solo desde la API).
 *
 *  Requisito: la app levantada con Docker (BASE_URL, por defecto :8091).
 * ===================================================================== */

const { iniciarSesion, codigoUnico } = require('./sesion');

let admin;

beforeAll(async () => {
  admin = await iniciarSesion('admin@tienda.com', 'admin123');
});

/** Crea un producto válido y devuelve { id, ...datos }. */
async function crearProducto(extra = {}) {
  const datos = {
    codigo: codigoUnico('VEN'),
    nombre: 'Producto para venta',
    precio_compra: 10,
    precio: 14,
    stock: 20,
    id_categoria: 1,
    ...extra,
  };
  const r = await admin.post('/api/productos', datos);
  expect(r.status).toBe(201);
  return { id: r.data.data.id, ...datos };
}

/** Devuelve el stock actual de un producto. */
async function stockDe(id) {
  const r = await admin.get(`/api/productos/${id}`);
  return r.data.data.stock;
}

describe('Módulo · Ventas (POS)', () => {
  // ---- CP-VENTA-001 ---------------------------------------------------
  test('CP-VENTA-001 [Caja negra] Registrar una venta correctamente → 201, total correcto y descuenta stock', async () => {
    const prod = await crearProducto({ precio: 14, stock: 20 });

    const r = await admin.post('/api/ventas', {
      items: [{ id_producto: prod.id, cantidad: 2 }],
    });

    expect(r.status).toBe(201);
    expect(r.data.mensaje).toBe('Venta registrada correctamente.');
    expect(r.data.data.total).toBe(28);      // 2 × Q14.00
    expect(r.data.data.estado).toBe('completada');

    // El stock bajó de 20 a 18
    expect(await stockDe(prod.id)).toBe(18);
  });

  // ---- CP-VENTA-002 ---------------------------------------------------
  test('CP-VENTA-002 [Caja negra] Venta con descuento → total = subtotal − descuento', async () => {
    const prod = await crearProducto({ precio: 14, stock: 20 });

    const r = await admin.post('/api/ventas', {
      descuento: 5,
      items: [{ id_producto: prod.id, cantidad: 2 }],
    });

    expect(r.status).toBe(201);
    expect(r.data.data.subtotal).toBe(28);   // 2 × Q14.00
    expect(r.data.data.descuento).toBe(5);
    expect(r.data.data.total).toBe(23);      // 28 − 5
  });

  // ---- CP-VENTA-003 ---------------------------------------------------
  test('CP-VENTA-003 [Caja negra] Stock insuficiente → 422 y no descuenta stock', async () => {
    const prod = await crearProducto({ stock: 3 });

    const r = await admin.post('/api/ventas', {
      items: [{ id_producto: prod.id, cantidad: 10 }],
    });

    expect(r.status).toBe(422);
    expect(r.data.mensaje).toMatch(/stock insuficiente/i);

    // La transacción se revierte: el stock sigue en 3
    expect(await stockDe(prod.id)).toBe(3);
  });

  // ---- CP-VENTA-004 ---------------------------------------------------
  test('CP-VENTA-004 [Caja gris] La venta guarda el costo del momento (costo_unitario)', async () => {
    const prod = await crearProducto({ precio_compra: 10, precio: 14, stock: 20 });

    const venta = await admin.post('/api/ventas', {
      items: [{ id_producto: prod.id, cantidad: 2 }],
    });
    expect(venta.status).toBe(201);
    const idVenta = venta.data.data.id;

    // Se consulta la venta y se revisa la línea de detalle
    const r = await admin.get(`/api/ventas/${idVenta}`);
    expect(r.status).toBe(200);
    const linea = r.data.data.detalle.find((d) => Number(d.id_producto) === prod.id);
    expect(linea).toBeDefined();
    expect(Number(linea.cantidad)).toBe(2);
    expect(Number(linea.precio_unitario)).toBe(14); // precio de venta
    expect(Number(linea.costo_unitario)).toBe(10);  // precio de compra del momento
  });
});
