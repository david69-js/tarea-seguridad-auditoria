/* =====================================================================
 *  Módulo 4: Cálculo de Ganancias — Sistema POS Web, Tienda Bugambilias
 *
 *  Casos planificados en "proyecto_modulos_pruebas_gantt": CP-GAN-001 a 003,
 *  más CP-GAN-004 (la ganancia histórica usa el costo del momento de la venta).
 *
 *  Fórmulas del código (app/controllers/productos.php, producto_json()):
 *     ganancia = precio de venta − precio de compra          (2 decimales)
 *     margen   = ganancia / precio de venta × 100            (1 decimal)
 *  Reporte (app/controllers/reportes.php, api_reportes_rentabilidad()):
 *     ganancia generada = Σ cantidad × (precio_unitario − costo_unitario)
 * ===================================================================== */

const { iniciarSesion, codigoUnico } = require('./sesion');

let admin;

beforeAll(async () => {
  admin = await iniciarSesion('admin@tienda.com', 'admin123');
});

async function crear(precio_compra, precio, extra = {}) {
  const r = await admin.post('/api/productos', {
    codigo: codigoUnico('GAN'), nombre: 'Producto ganancia', precio_compra, precio, stock: 50, id_categoria: 3, ...extra,
  });
  expect(r.status).toBe(201);
  return r.data.data.id;
}

const rentabilidad = async (id) => {
  const r = await admin.get('/api/reportes/rentabilidad?desde=2000-01-01&hasta=2100-12-31');
  expect(r.status).toBe(200);
  return { reporte: r.data.data, fila: r.data.data.productos.find((p) => p.id === id) };
};

describe('Módulo 4 · Cálculo de Ganancias', () => {
  // ---- CP-GAN-001 -----------------------------------------------------
  test('CP-GAN-001 [Caja blanca] Compra Q10 y venta Q15 → ganancia Q5 y margen 33.3 %', async () => {
    const id = await crear(10, 15);

    const { data } = await admin.get(`/api/productos/${id}`);
    expect(data.data.precio_compra).toBe(10);
    expect(data.data.precio).toBe(15);
    expect(data.data.ganancia).toBe(5);        // 15 − 10
    expect(data.data.margen).toBe(33.3);       // 5 / 15 × 100, redondeado a 1 decimal
  });

  // ---- CP-GAN-002 -----------------------------------------------------
  test('CP-GAN-002 [Caja negra] El reporte ordena del más al menos rentable', async () => {
    const alta = await crear(10, 40);    // gana Q30 por unidad
    const baja = await crear(10, 11);    // gana Q1 por unidad
    const venta = await admin.post('/api/ventas', {
      items: [{ id_producto: alta, cantidad: 2 }, { id_producto: baja, cantidad: 2 }],
    });
    expect(venta.status).toBe(201);

    const { reporte } = await rentabilidad(alta);
    const pos = (id) => reporte.productos.findIndex((p) => p.id === id);
    const filaAlta = reporte.productos[pos(alta)];
    const filaBaja = reporte.productos[pos(baja)];

    expect(filaAlta.ganancia_total).toBe(60);  // 2 × 30
    expect(filaBaja.ganancia_total).toBe(2);   // 2 × 1
    expect(pos(alta)).toBeLessThan(pos(baja)); // el más rentable aparece antes
  });

  // ---- CP-GAN-003 -----------------------------------------------------
  test('CP-GAN-003 [Caja blanca] Compra Q20 y venta Q18 → ganancia negativa −Q2', async () => {
    const id = await crear(20, 18);

    const { data } = await admin.get(`/api/productos/${id}`);
    expect(data.data.ganancia).toBe(-2);
    expect(data.data.margen).toBe(-11.1);      // −2 / 18 × 100
  });

  // ---- CP-GAN-004 -----------------------------------------------------
  test('CP-GAN-004 [Caja gris] Cambiar el precio de compra no altera la ganancia de ventas pasadas', async () => {
    // Caja gris: se sabe que cada línea de venta guarda costo_unitario en la
    // base de datos, y se verifica ese diseño solo a través de la API.
    const id = await crear(5, 9);
    const venta = await admin.post('/api/ventas', { items: [{ id_producto: id, cantidad: 3 }] });
    expect(venta.status).toBe(201);

    let { fila } = await rentabilidad(id);
    expect(fila.ganancia_total).toBe(12);      // 3 × (9 − 5)

    await admin.put(`/api/productos/${id}`, { precio_compra: 8 });

    ({ fila } = await rentabilidad(id));
    expect(fila.ganancia).toBe(1);             // la ganancia unitaria actual sí cambia (9 − 8)
    expect(fila.ganancia_total).toBe(12);      // la de la venta ya hecha, no
  });
});
