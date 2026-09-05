<?php /** Gestión de usuarios (solo admin): alta, edición, activación y baja. */ ?>
<div class="page-head">
    <p class="page-sub">Usuarios con acceso al sistema, sus roles y su estado.</p>
    <div class="toolbar">
        <label class="visually-hidden" for="buscarUsuario">Buscar usuario</label>
        <div class="input-group" style="max-width: 300px;">
            <span class="input-group-text"><i class="bi bi-search" aria-hidden="true"></i></span>
            <input id="buscarUsuario" class="form-control" type="search"
                   placeholder="Buscar por nombre o correo…">
        </div>
        <button class="btn btn-primary" id="btnNuevoUsuario" type="button">
            <i class="bi bi-person-plus" aria-hidden="true"></i> Nuevo usuario
        </button>
    </div>
</div>

<div class="card panel">
    <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
            <caption class="visually-hidden">Listado de usuarios del sistema</caption>
            <thead>
                <tr>
                    <th scope="col">Usuario</th>
                    <th scope="col">Correo</th>
                    <th scope="col">Rol</th>
                    <th scope="col" class="text-center">Ventas</th>
                    <th scope="col">Estado</th>
                    <th scope="col">Registrado</th>
                    <th scope="col" class="text-end">Acciones</th>
                </tr>
            </thead>
            <tbody id="tablaUsuarios">
                <tr><td colspan="7" class="empty-state">Cargando usuarios…</td></tr>
            </tbody>
        </table>
    </div>
</div>

<!-- Modal: alta y edición -->
<div class="modal fade" id="modalUsuario" tabindex="-1" aria-labelledby="tituloUsuario" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered">
    <form class="modal-content" id="formUsuario" novalidate>
      <div class="modal-header">
        <h2 class="modal-title h5" id="tituloUsuario">
            <i class="bi bi-person-plus" aria-hidden="true"></i>
            <span id="tituloUsuarioTexto">Nuevo usuario</span>
        </h2>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
      </div>
      <div class="modal-body">
        <input type="hidden" id="usId">

        <div class="mb-3">
            <label class="form-label" for="usNombre">Nombre completo *</label>
            <input id="usNombre" class="form-control" required minlength="3" autocomplete="name">
        </div>

        <div class="mb-3">
            <label class="form-label" for="usCorreo">Correo electrónico *</label>
            <input id="usCorreo" type="email" class="form-control" required autocomplete="email">
        </div>

        <div class="mb-3">
            <label class="form-label" for="usPass">
                Contraseña <span id="usPassObligatoria">*</span>
            </label>
            <div class="input-group">
                <input id="usPass" type="password" class="form-control" minlength="6"
                       autocomplete="new-password" aria-describedby="usPassAyuda">
                <button class="btn btn-outline-secondary" type="button" id="btnVerPass"
                        aria-label="Mostrar contraseña" aria-pressed="false">
                    <i class="bi bi-eye" aria-hidden="true"></i>
                </button>
            </div>
            <p class="form-hint" id="usPassAyuda">Mínimo 6 caracteres.</p>
        </div>

        <div class="row g-3">
            <div class="col-sm-6">
                <label class="form-label" for="usRol">Rol</label>
                <select id="usRol" class="form-select">
                    <option value="cajero">Cajero</option>
                    <option value="admin">Administrador</option>
                </select>
            </div>
            <div class="col-sm-6" id="bloqueEstado">
                <label class="form-label" for="usActivo">Estado</label>
                <select id="usActivo" class="form-select">
                    <option value="1">Activo</option>
                    <option value="0">Inactivo</option>
                </select>
            </div>
        </div>

        <p class="form-hint mt-3" id="avisoPropio" hidden>
            <i class="bi bi-info-circle" aria-hidden="true"></i>
            Está editando su propia cuenta: no puede cambiar su rol ni desactivarse.
        </p>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
        <button type="submit" class="btn btn-primary" id="btnGuardarUsuario">
            <i class="bi bi-save" aria-hidden="true"></i> Guardar
        </button>
      </div>
    </form>
  </div>
</div>

<script>
const modalUs = () => bootstrap.Modal.getOrCreateInstance('#modalUsuario');
let usuarios = [];

/* ---------------------------------------------------------------- */
/*  Listado                                                          */
/* ---------------------------------------------------------------- */
async function cargarUsuarios() {
    const q = document.getElementById('buscarUsuario').value;
    const res = await api('/api/usuarios?q=' + encodeURIComponent(q));
    const tbody = document.getElementById('tablaUsuarios');
    usuarios = res.ok ? res.data : [];

    if (!usuarios.length) {
        tbody.innerHTML = `<tr><td colspan="7" class="empty-state">
            <i class="bi bi-people" aria-hidden="true"></i> Sin usuarios que coincidan.</td></tr>`;
        return;
    }

    tbody.innerHTML = usuarios.map(u => {
        const soyYo = u.id === window.USER_ID;
        const rol = u.rol === 'admin'
            ? '<span class="pill pill-primary"><i class="bi bi-shield-lock" aria-hidden="true"></i> Administrador</span>'
            : '<span class="pill pill-neutral"><i class="bi bi-person" aria-hidden="true"></i> Cajero</span>';
        const estado = u.activo
            ? '<span class="pill pill-success"><i class="bi bi-check-circle" aria-hidden="true"></i> Activo</span>'
            : '<span class="pill pill-danger"><i class="bi bi-slash-circle" aria-hidden="true"></i> Inactivo</span>';

        return `<tr>
            <td>
                <div class="fw-semibold">${escapeHtml(u.nombre)}${soyYo ? ' <span class="pill pill-info">Usted</span>' : ''}</div>
                <small class="text-muted">ID ${u.id}</small>
            </td>
            <td>${escapeHtml(u.correo)}</td>
            <td>${rol}</td>
            <td class="text-center">${u.ventas}</td>
            <td>${estado}</td>
            <td class="text-muted">${fechaCorta(u.created_at)}</td>
            <td>
                <div class="row-actions">
                    <button class="btn btn-sm btn-outline-primary" type="button"
                            onclick="editarUsuario(${u.id})"
                            aria-label="Editar a ${escapeHtml(u.nombre)}" title="Editar">
                        <i class="bi bi-pencil" aria-hidden="true"></i></button>
                    <button class="btn btn-sm btn-outline-secondary" type="button"
                            onclick="cambiarEstado(${u.id}, ${u.activo ? 0 : 1})"
                            ${soyYo ? 'disabled' : ''}
                            aria-label="${u.activo ? 'Desactivar' : 'Activar'} a ${escapeHtml(u.nombre)}"
                            title="${u.activo ? 'Desactivar' : 'Activar'}">
                        <i class="bi bi-${u.activo ? 'toggle-on' : 'toggle-off'}" aria-hidden="true"></i></button>
                    <button class="btn btn-sm btn-outline-danger" type="button"
                            onclick='eliminarUsuario(${u.id}, ${JSON.stringify(u.nombre)})'
                            ${soyYo ? 'disabled' : ''}
                            aria-label="Eliminar a ${escapeHtml(u.nombre)}" title="Eliminar">
                        <i class="bi bi-trash" aria-hidden="true"></i></button>
                </div>
            </td></tr>`;
    }).join('');
}

/* ---------------------------------------------------------------- */
/*  Alta / edición                                                   */
/* ---------------------------------------------------------------- */
function abrirNuevo() {
    document.getElementById('formUsuario').reset();
    document.getElementById('usId').value = '';
    document.getElementById('tituloUsuarioTexto').textContent = 'Nuevo usuario';
    document.getElementById('usPass').required = true;
    document.getElementById('usPassObligatoria').hidden = false;
    document.getElementById('usPassAyuda').textContent = 'Mínimo 6 caracteres.';
    document.getElementById('bloqueEstado').hidden = true;
    document.getElementById('avisoPropio').hidden = true;
    document.getElementById('usRol').disabled = false;
    modalUs().show();
}

function editarUsuario(id) {
    const u = usuarios.find(x => x.id === id);
    if (!u) return;
    const soyYo = u.id === window.USER_ID;

    document.getElementById('formUsuario').reset();
    document.getElementById('usId').value = u.id;
    document.getElementById('usNombre').value = u.nombre;
    document.getElementById('usCorreo').value = u.correo;
    document.getElementById('usRol').value = u.rol;
    document.getElementById('usActivo').value = u.activo ? '1' : '0';
    document.getElementById('tituloUsuarioTexto').textContent = 'Editar usuario';

    // Al editar, la contraseña es opcional: vacía = se conserva la actual.
    document.getElementById('usPass').required = false;
    document.getElementById('usPassObligatoria').hidden = true;
    document.getElementById('usPassAyuda').textContent =
        'Déjela vacía para conservar la contraseña actual.';

    // Un admin no puede quitarse el rol ni desactivarse (el servidor también lo impide).
    document.getElementById('bloqueEstado').hidden = soyYo;
    document.getElementById('usRol').disabled = soyYo;
    document.getElementById('avisoPropio').hidden = !soyYo;

    modalUs().show();
}

async function cambiarEstado(id, activo) {
    const u = usuarios.find(x => x.id === id);
    if (!u) return;
    const res = await api('/api/usuarios/' + id, {
        method: 'PUT',
        body: { nombre: u.nombre, correo: u.correo, rol: u.rol, activo: !!activo },
    });
    toast(res.mensaje, res.ok);
    if (res.ok) cargarUsuarios();
}

async function eliminarUsuario(id, nombre) {
    if (!confirm(`¿Eliminar al usuario "${nombre}"?\n\nSi tiene ventas registradas se desactivará en lugar de borrarse, para no perder el historial.`)) return;
    const res = await api('/api/usuarios/' + id, { method: 'DELETE' });
    toast(res.mensaje, res.ok);
    if (res.ok) cargarUsuarios();
}

document.getElementById('formUsuario').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!e.target.checkValidity()) { e.target.reportValidity(); return; }

    const id   = document.getElementById('usId').value;
    const pass = document.getElementById('usPass').value;
    const btn  = document.getElementById('btnGuardarUsuario');

    const body = {
        nombre: document.getElementById('usNombre').value.trim(),
        correo: document.getElementById('usCorreo').value.trim(),
        rol:    document.getElementById('usRol').value,
    };
    if (pass) body.password = pass;

    let res;
    btn.disabled = true;
    if (id) {
        if (!document.getElementById('bloqueEstado').hidden) {
            body.activo = document.getElementById('usActivo').value === '1';
        }
        res = await api('/api/usuarios/' + id, { method: 'PUT', body });
    } else {
        res = await api('/api/auth/register', { method: 'POST', body });
    }
    btn.disabled = false;

    toast(res.mensaje, res.ok);
    if (res.ok) { modalUs().hide(); cargarUsuarios(); }
});

/* Mostrar / ocultar la contraseña del formulario */
document.getElementById('btnVerPass').addEventListener('click', (e) => {
    const campo = document.getElementById('usPass');
    const btn = e.currentTarget;
    const visible = campo.type === 'text';
    campo.type = visible ? 'password' : 'text';
    btn.setAttribute('aria-pressed', String(!visible));
    btn.setAttribute('aria-label', visible ? 'Mostrar contraseña' : 'Ocultar contraseña');
    btn.querySelector('i').className = visible ? 'bi bi-eye' : 'bi bi-eye-slash';
});

document.getElementById('btnNuevoUsuario').addEventListener('click', abrirNuevo);

let dUs;
document.getElementById('buscarUsuario').addEventListener('input', () => {
    clearTimeout(dUs); dUs = setTimeout(cargarUsuarios, 300);
});

cargarUsuarios();
</script>
