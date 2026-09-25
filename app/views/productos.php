<?php /** Inventario de productos: CRUD, búsqueda, alerta de stock, imagen. */ ?>
<div class="page-head">
    <p class="page-sub">Catálogo de la librería. Los productos con menos de 5 unidades se marcan en rojo.</p>
    <div class="toolbar">
        <label class="visually-hidden" for="buscador">Buscar producto por nombre o código</label>
        <div class="input-group" style="max-width: 320px;">
            <span class="input-group-text"><i class="bi bi-search" aria-hidden="true"></i></span>
            <input id="buscador" type="search" class="form-control" placeholder="Buscar por nombre o código…">
        </div>

        <label class="visually-hidden" for="filtroCategoria">Filtrar por categoría</label>
        <select id="filtroCategoria" class="form-select" style="min-width: 190px;"></select>

        <label class="visually-hidden" for="filtroStock">Filtrar por stock</label>
        <select id="filtroStock" class="form-select" style="min-width: 160px;">
            <option value="">Todo el stock</option>
            <option value="1">Solo stock bajo</option>
        </select>

        <button class="btn btn-primary" id="btnNuevo" type="button" data-admin-only>
            <i class="bi bi-plus-lg" aria-hidden="true"></i> Nuevo producto
        </button>
    </div>
</div>

<div class="card panel">
    <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
            <caption class="visually-hidden">Listado de productos del inventario</caption>
            <thead>
                <tr>
                    <th scope="col"><span class="visually-hidden">Imagen</span></th>
                    <th scope="col">Código</th>
                    <th scope="col">Producto</th>
                    <th scope="col">Categoría</th>
                    <th scope="col" class="text-end">Precio</th>
                    <th scope="col" class="text-center">Stock</th>
                    <th scope="col" class="text-end">Acciones</th>
                </tr>
            </thead>
            <tbody id="tablaProductos">
                <tr><td colspan="7" class="empty-state">Cargando inventario…</td></tr>
            </tbody>
        </table>
    </div>
</div>

<!-- Modal Producto -->
<div class="modal fade" id="modalProducto" tabindex="-1" aria-labelledby="modalTituloProducto" aria-hidden="true">
  <div class="modal-dialog modal-lg modal-dialog-centered">
    <form class="modal-content" id="formProducto" enctype="multipart/form-data" novalidate>
      <div class="modal-header">
        <h2 class="modal-title h5" id="modalTituloProducto">
            <i class="bi bi-box-seam" aria-hidden="true"></i>
            <span id="modalTitulo">Nuevo producto</span>
        </h2>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
      </div>
      <div class="modal-body">
        <input type="hidden" name="id" id="prodId">
        <div class="row g-3">
          <div class="col-md-4">
            <label class="form-label" for="prodCodigo">Código *</label>
            <input name="codigo" id="prodCodigo" class="form-control" required placeholder="LIB-001">
          </div>
          <div class="col-md-8">
            <label class="form-label" for="prodNombre">Nombre *</label>
            <input name="nombre" id="prodNombre" class="form-control" required>
          </div>
          <div class="col-12">
            <label class="form-label" for="prodDescripcion">Descripción</label>
            <textarea name="descripcion" id="prodDescripcion" class="form-control" rows="2"></textarea>
          </div>
          <div class="col-md-4">
            <label class="form-label" for="prodPrecio">Precio (Q) *</label>
            <input name="precio" id="prodPrecio" type="number" step="0.01" min="0" class="form-control" required>
          </div>
          <div class="col-md-4">
            <label class="form-label" for="prodStock">Stock</label>
            <input name="stock" id="prodStock" type="number" min="0" class="form-control" value="0">
          </div>
          <div class="col-md-4">
            <label class="form-label" for="prodCategoria">Categoría</label>
            <select name="id_categoria" id="prodCategoria" class="form-select"></select>
          </div>
          <div class="col-12">
            <label class="form-label" for="prodImagen">Imagen del producto</label>
            <input name="imagen" id="prodImagen" type="file" accept="image/*" class="form-control"
                   aria-describedby="ayudaImagen">
            <p class="form-hint" id="ayudaImagen">JPG, PNG, WEBP o GIF · máximo 2 MB.</p>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
        <button type="submit" class="btn btn-primary" id="btnGuardarProducto">
            <i class="bi bi-save" aria-hidden="true"></i> Guardar
        </button>
      </div>
    </form>
  </div>
</div>

<script>
let categorias = [];
const modal = () => bootstrap.Modal.getOrCreateInstance('#modalProducto');

async function cargarCategorias() {
    const res = await api('/api/categorias');
    categorias = res.ok ? res.data : [];
    const opciones = categorias.map(c => `<option value="${c.id}">${escapeHtml(c.nombre)}</option>`).join('');
    document.getElementById('prodCategoria').innerHTML = '<option value="">— Sin categoría —</option>' + opciones;
    document.getElementById('filtroCategoria').innerHTML = '<option value="">Todas las categorías</option>' + opciones;
}

async function cargarProductos() {
    const q    = document.getElementById('buscador').value;
    const cat  = document.getElementById('filtroCategoria').value;
    const bajo = document.getElementById('filtroStock').value;
    const res  = await api(`/api/productos?q=${encodeURIComponent(q)}&categoria=${cat}&stock_bajo=${bajo}`);
    const tbody = document.getElementById('tablaProductos');

    if (!res.ok || !res.data.length) {
        tbody.innerHTML = `<tr><td colspan="7" class="empty-state">
            <i class="bi bi-inbox" aria-hidden="true"></i> No hay productos que coincidan con la búsqueda.</td></tr>`;
        return;
    }

    tbody.innerHTML = res.data.map(p => {
        const img = p.imagen_url
            ? `<img src="${BASE_URL}/${escapeHtml(p.imagen_url)}" class="prod-thumb" alt="">`
            : `<div class="prod-thumb placeholder-thumb" aria-hidden="true"><i class="bi bi-image"></i></div>`;
        const badge = p.stock_bajo
            ? `<span class="pill pill-danger"><i class="bi bi-exclamation-triangle" aria-hidden="true"></i> ${p.stock}</span>
               <span class="visually-hidden">unidades, stock bajo</span>`
            : `<span class="pill pill-success">${p.stock}</span>`;
        const desc = p.descripcion
            ? `<div class="prod-desc">${escapeHtml(p.descripcion)}</div>` : '';

        return `<tr>
            <td>${img}</td>
            <td><code>${escapeHtml(p.codigo)}</code></td>
            <td><div class="prod-nombre">${escapeHtml(p.nombre)}</div>${desc}</td>
            <td>${escapeHtml(p.categoria || '—')}</td>
            <td class="text-end fw-semibold">${money(p.precio)}</td>
            <td class="text-center">${badge}</td>
            <td>
                <div class="row-actions" data-admin-only>
                    <button class="btn btn-sm btn-outline-primary" type="button" onclick="editar(${p.id})"
                            aria-label="Editar ${escapeHtml(p.nombre)}" title="Editar">
                        <i class="bi bi-pencil" aria-hidden="true"></i></button>
                    <button class="btn btn-sm btn-outline-danger" type="button"
                            onclick='eliminar(${p.id}, ${JSON.stringify(p.nombre)})'
                            aria-label="Eliminar ${escapeHtml(p.nombre)}" title="Eliminar">
                        <i class="bi bi-trash" aria-hidden="true"></i></button>
                </div>
            </td></tr>`;
    }).join('');
    aplicarPermisos();
}

document.getElementById('btnNuevo').addEventListener('click', () => {
    document.getElementById('formProducto').reset();
    document.getElementById('prodId').value = '';
    document.getElementById('modalTitulo').textContent = 'Nuevo producto';
    modal().show();
});

async function editar(id) {
    const res = await api('/api/productos/' + id);
    if (!res.ok) { toast(res.mensaje, false); return; }
    const p = res.data;
    document.getElementById('formProducto').reset();
    document.getElementById('prodId').value = p.id;
    document.getElementById('prodCodigo').value = p.codigo;
    document.getElementById('prodNombre').value = p.nombre;
    document.getElementById('prodDescripcion').value = p.descripcion || '';
    document.getElementById('prodPrecio').value = p.precio;
    document.getElementById('prodStock').value = p.stock;
    document.getElementById('prodCategoria').value = p.id_categoria || '';
    document.getElementById('modalTitulo').textContent = 'Editar producto';
    modal().show();
}

async function eliminar(id, nombre) {
    if (!confirm(`¿Eliminar el producto "${nombre}"?\n\nSe da de baja del catálogo, pero se conserva en el historial de ventas.`)) return;
    const res = await api('/api/productos/' + id, { method: 'DELETE' });
    toast(res.mensaje, res.ok);
    if (res.ok) cargarProductos();
}

document.getElementById('formProducto').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!e.target.checkValidity()) { e.target.reportValidity(); return; }

    const id  = document.getElementById('prodId').value;
    const btn = document.getElementById('btnGuardarProducto');
    const fd  = new FormData(e.target);

    // multipart para permitir la imagen; el backend acepta PUT vía _method o POST
    btn.disabled = true;
    const res = await apiForm(id ? '/api/productos/' + id : '/api/productos', fd, id ? 'PUT' : 'POST');
    btn.disabled = false;

    toast(res.mensaje, res.ok);
    if (res.ok) { modal().hide(); cargarProductos(); }
});

let debounce;
document.getElementById('buscador').addEventListener('input', () => {
    clearTimeout(debounce); debounce = setTimeout(cargarProductos, 300);
});
document.getElementById('filtroCategoria').addEventListener('change', cargarProductos);
document.getElementById('filtroStock').addEventListener('change', cargarProductos);

(async () => { await cargarCategorias(); await cargarProductos(); })();
</script>
