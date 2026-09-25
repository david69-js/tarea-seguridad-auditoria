<?php /** Punto de Venta (POS): búsqueda, carrito, IVA 12%, descuento, cobro. */ ?>
<div class="row g-3 pos-layout">
    <!-- Panel de productos -->
    <div class="col-lg-7">
        <section class="card panel pos-panel" aria-label="Catálogo de productos">
            <div class="card-header d-block">
                <label class="visually-hidden" for="posBuscar">Buscar producto por nombre o código</label>
                <div class="input-group input-group-lg">
                    <span class="input-group-text"><i class="bi bi-upc-scan" aria-hidden="true"></i></span>
                    <input id="posBuscar" type="search" class="form-control"
                           placeholder="Buscar o escanear producto…" autofocus autocomplete="off">
                </div>
            </div>
            <div class="pos-scroll">
                <div class="pos-grid" id="posProductos">
                    <p class="text-muted m-0">Cargando productos…</p>
                </div>
            </div>
        </section>
    </div>

    <!-- Panel del carrito -->
    <div class="col-lg-5">
        <section class="card panel pos-panel" aria-label="Carrito de la venta">
            <div class="card-header justify-content-between">
                <span><i class="bi bi-cart3" aria-hidden="true"></i> Carrito
                    <span class="pill pill-neutral ms-1" id="contadorItems">0</span></span>
                <button class="btn btn-sm btn-outline-danger" id="btnVaciar" type="button">
                    <i class="bi bi-trash" aria-hidden="true"></i> Vaciar
                </button>
            </div>

            <div class="pos-scroll">
                <table class="table table-sm cart-table align-middle mb-0">
                    <caption class="visually-hidden">Productos agregados a la venta actual</caption>
                    <thead>
                        <tr>
                            <th scope="col">Producto</th>
                            <th scope="col" class="text-center">Cantidad</th>
                            <th scope="col" class="text-end">Subtotal</th>
                            <th scope="col"><span class="visually-hidden">Quitar</span></th>
                        </tr>
                    </thead>
                    <tbody id="carritoBody">
                        <tr><td colspan="4" class="empty-state">
                            <i class="bi bi-cart" aria-hidden="true"></i> El carrito está vacío</td></tr>
                    </tbody>
                </table>
            </div>

            <div class="card-footer bg-white">
                <div class="row g-2 mb-3">
                    <div class="col-7">
                        <label class="visually-hidden" for="posCliente">Cliente</label>
                        <select id="posCliente" class="form-select form-select-sm"></select>
                    </div>
                    <div class="col-5">
                        <label class="visually-hidden" for="posMetodo">Método de pago</label>
                        <select id="posMetodo" class="form-select form-select-sm">
                            <option value="efectivo">Efectivo</option>
                            <option value="tarjeta">Tarjeta</option>
                            <option value="QR">Pago QR</option>
                        </select>
                    </div>
                </div>

                <div class="totales">
                    <div class="fila"><span>Subtotal</span><span id="tSubtotal">Q 0.00</span></div>
                    <div class="fila">
                        <label for="tDescuento" class="mb-0">Descuento</label>
                        <div class="input-group input-group-sm" style="width:135px;">
                            <span class="input-group-text">Q</span>
                            <input id="tDescuento" type="number" min="0" step="0.01" value="0"
                                   class="form-control text-end">
                        </div>
                    </div>
                    <div class="fila"><span>IVA (12%)</span><span id="tIva">Q 0.00</span></div>
                    <hr class="my-2">
                    <div class="fila total-grande"><span>TOTAL</span><span id="tTotal">Q 0.00</span></div>
                </div>

                <button class="btn btn-success w-100 btn-cobrar mt-3" id="btnCobrar" type="button" disabled>
                    <i class="bi bi-check2-circle" aria-hidden="true"></i> Cobrar
                </button>
                <p class="visually-hidden" role="status" id="avisoCarrito"></p>
            </div>
        </section>
    </div>
</div>

<script>
const IVA = 0.12;
let carrito = [];   // { id, nombre, precio, cantidad, stock }
let productos = [];

/* ------------------------------------------------------------------ */
/*  Catálogo                                                           */
/* ------------------------------------------------------------------ */
async function posCargarProductos() {
    const q = document.getElementById('posBuscar').value;
    const res = await api('/api/productos?q=' + encodeURIComponent(q));
    productos = res.ok ? res.data : [];
    const cont = document.getElementById('posProductos');

    if (!productos.length) {
        cont.innerHTML = '<p class="text-muted m-0">Sin resultados para esa búsqueda.</p>';
        return;
    }

    cont.innerHTML = productos.map(p => `
        <button type="button" class="pos-item" ${p.stock <= 0 ? 'disabled' : ''}
                onclick="agregar(${p.id})"
                aria-label="Agregar ${escapeHtml(p.nombre)}, ${money(p.precio)}, ${p.stock} en existencia">
            <span class="pos-item-nombre">${escapeHtml(p.nombre)}</span>
            <span class="pos-item-codigo">${escapeHtml(p.codigo)}</span>
            <span class="pos-item-precio">${money(p.precio)}</span>
            <span class="pos-item-stock ${p.stock_bajo ? 'text-danger' : 'text-muted'}">
                ${p.stock <= 0 ? 'Agotado' : 'Stock: ' + p.stock}</span>
        </button>`).join('');
}

async function cargarClientesPOS() {
    const res = await api('/api/clientes');
    const sel = document.getElementById('posCliente');
    sel.innerHTML = (res.ok ? res.data : []).map(c =>
        `<option value="${c.id}">${escapeHtml(c.nombre)} (${escapeHtml(c.nit)})</option>`).join('');
}

/* ------------------------------------------------------------------ */
/*  Carrito                                                            */
/* ------------------------------------------------------------------ */
function agregar(id) {
    const p = productos.find(x => x.id === id);
    if (!p) return;
    const item = carrito.find(x => x.id === id);
    const enCarrito = item ? item.cantidad : 0;
    if (enCarrito + 1 > p.stock) { toast('No hay más stock disponible.', false); return; }
    if (item) item.cantidad++;
    else carrito.push({ id: p.id, nombre: p.nombre, precio: p.precio, cantidad: 1, stock: p.stock });
    renderCarrito();
    document.getElementById('avisoCarrito').textContent = `${p.nombre} agregado al carrito.`;
}

function cambiarCantidad(id, delta) {
    const item = carrito.find(x => x.id === id);
    if (!item) return;
    const nueva = item.cantidad + delta;
    if (nueva <= 0) { carrito = carrito.filter(x => x.id !== id); }
    else if (nueva > item.stock) { toast('La cantidad supera el stock disponible.', false); return; }
    else item.cantidad = nueva;
    renderCarrito();
}

function renderCarrito() {
    const tbody = document.getElementById('carritoBody');
    if (!carrito.length) {
        tbody.innerHTML = `<tr><td colspan="4" class="empty-state">
            <i class="bi bi-cart" aria-hidden="true"></i> El carrito está vacío</td></tr>`;
    } else {
        tbody.innerHTML = carrito.map(i => `
            <tr>
                <td>
                    <div class="fw-semibold">${escapeHtml(i.nombre)}</div>
                    <small class="text-muted">${money(i.precio)} c/u</small>
                </td>
                <td class="text-center">
                    <span class="qty-group">
                        <button type="button" onclick="cambiarCantidad(${i.id},-1)"
                                aria-label="Quitar una unidad de ${escapeHtml(i.nombre)}">−</button>
                        <span class="qty">${i.cantidad}</span>
                        <button type="button" onclick="cambiarCantidad(${i.id},1)"
                                aria-label="Agregar una unidad de ${escapeHtml(i.nombre)}">+</button>
                    </span>
                </td>
                <td class="text-end fw-semibold">${money(i.precio * i.cantidad)}</td>
                <td class="text-end">
                    <button class="btn btn-sm btn-link text-danger p-1" type="button"
                            onclick="cambiarCantidad(${i.id},-999)"
                            aria-label="Quitar ${escapeHtml(i.nombre)} del carrito">
                        <i class="bi bi-x-lg" aria-hidden="true"></i></button>
                </td>
            </tr>`).join('');
    }
    document.getElementById('contadorItems').textContent =
        carrito.reduce((s, i) => s + i.cantidad, 0);
    recalcular();
}

function recalcular() {
    const subtotal = carrito.reduce((s, i) => s + i.precio * i.cantidad, 0);
    let desc = parseFloat(document.getElementById('tDescuento').value) || 0;
    if (desc > subtotal) { desc = subtotal; document.getElementById('tDescuento').value = desc.toFixed(2); }
    const base  = subtotal - desc;
    const iva   = base * IVA;
    document.getElementById('tSubtotal').textContent = money(subtotal);
    document.getElementById('tIva').textContent   = money(iva);
    document.getElementById('tTotal').textContent = money(base + iva);
    document.getElementById('btnCobrar').disabled = carrito.length === 0;
}

/* ------------------------------------------------------------------ */
/*  Cobro                                                              */
/* ------------------------------------------------------------------ */
document.getElementById('tDescuento').addEventListener('input', recalcular);
document.getElementById('btnVaciar').addEventListener('click', () => {
    carrito = [];
    document.getElementById('tDescuento').value = 0;
    renderCarrito();
});

document.getElementById('btnCobrar').addEventListener('click', async () => {
    if (!carrito.length) return;
    const btn = document.getElementById('btnCobrar');
    const payload = {
        id_cliente:  document.getElementById('posCliente').value || null,
        metodo_pago: document.getElementById('posMetodo').value,
        descuento:   parseFloat(document.getElementById('tDescuento').value) || 0,
        items: carrito.map(i => ({ id_producto: i.id, cantidad: i.cantidad })),
    };

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm" aria-hidden="true"></span> Procesando…';
    const res = await api('/api/ventas', { method: 'POST', body: payload });
    btn.innerHTML = '<i class="bi bi-check2-circle" aria-hidden="true"></i> Cobrar';

    if (res.ok) {
        carrito = [];
        document.getElementById('tDescuento').value = 0;
        renderCarrito();
        posCargarProductos();
        // Abre la factura imprimible (incluye el código QR de la API externa)
        window.open(`${BASE_URL}/ventas/${res.data.id}`, '_blank');
        toast('Venta #' + res.data.id + ' registrada correctamente.', true);
        document.getElementById('posBuscar').focus();
    } else {
        btn.disabled = false;
        toast(res.mensaje, false);
    }
});

let posDebounce;
document.getElementById('posBuscar').addEventListener('input', () => {
    clearTimeout(posDebounce); posDebounce = setTimeout(posCargarProductos, 300);
});

(async () => { await posCargarProductos(); await cargarClientesPOS(); })();
</script>
