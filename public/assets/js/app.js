/* =====================================================================
 *  app.js  -  Utilidades compartidas del frontend
 *  - Wrapper de la API REST (fetch con JSON)
 *  - Formato de moneda, escape de HTML, notificaciones (toast)
 *  - Control de UI por rol (elementos [data-admin-only])
 *  - Menú lateral accesible (teclado + lectores de pantalla)
 * ===================================================================== */

const BASE_URL = window.BASE_URL || '';

/**
 * Cliente de la API REST propia. Devuelve el JSON {ok, mensaje, data}.
 * Envía y recibe JSON, e incluye las cookies de sesión.
 */
async function api(path, { method = 'GET', body = null } = {}) {
    const opts = {
        method,
        headers: { 'Accept': 'application/json' },
        credentials: 'same-origin',
    };
    if (body !== null) {
        opts.headers['Content-Type'] = 'application/json';
        opts.body = JSON.stringify(body);
    }
    try {
        const res = await fetch(BASE_URL + path, opts);
        if (res.status === 401) {   // sesión expirada
            window.location.href = BASE_URL + '/login';
            return { ok: false, mensaje: 'Sesión expirada' };
        }
        return await res.json();
    } catch (err) {
        return { ok: false, mensaje: 'Error de red: ' + err.message };
    }
}

/**
 * Envío de formularios con archivos (multipart). Usa POST con override
 * de método (_method) para PUT, ya que PHP solo procesa $_FILES en POST.
 */
async function apiForm(path, formData, method = 'POST') {
    if (method !== 'POST') formData.append('_method', method);
    try {
        const res = await fetch(BASE_URL + path, {
            method: 'POST',
            body: formData,
            credentials: 'same-origin',
            headers: { 'Accept': 'application/json' },
        });
        if (res.status === 401) { window.location.href = BASE_URL + '/login'; return { ok: false }; }
        return await res.json();
    } catch (err) {
        return { ok: false, mensaje: 'Error de red: ' + err.message };
    }
}

/** Formatea un número como Quetzales. */
function money(n) {
    return 'Q ' + Number(n || 0).toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Escapa texto para insertarlo en HTML (previene XSS). */
function escapeHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, s =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[s]));
}

/** Fecha legible a partir de un TIMESTAMP de MySQL ("2026-09-04 14:03:00"). */
function fechaCorta(valor) {
    const d = new Date(String(valor ?? '').replace(' ', 'T'));
    if (isNaN(d)) return escapeHtml(valor);
    return d.toLocaleString('es-GT', { dateStyle: 'medium', timeStyle: 'short' });
}

/**
 * Muestra una notificación flotante.
 * El contenedor es una región "live": los lectores de pantalla anuncian
 * el mensaje sin que el usuario tenga que buscarlo en la página.
 */
function toast(mensaje, ok = true) {
    let cont = document.getElementById('toastContainer');
    if (!cont) {
        cont = document.createElement('div');
        cont.id = 'toastContainer';
        cont.className = 'toast-container position-fixed top-0 end-0 p-3';
        cont.style.zIndex = 1090;
        cont.setAttribute('role', 'status');
        cont.setAttribute('aria-live', 'polite');
        cont.setAttribute('aria-atomic', 'true');
        document.body.appendChild(cont);
    }
    const el = document.createElement('div');
    el.className = `toast align-items-center text-white border-0 show ${ok ? 'bg-success' : 'bg-danger'}`;
    el.innerHTML = `<div class="d-flex"><div class="toast-body">
        <i class="bi bi-${ok ? 'check-circle' : 'exclamation-triangle'}" aria-hidden="true"></i> ${escapeHtml(mensaje)}
        </div><button type="button" class="btn-close btn-close-white me-2 m-auto"
        data-bs-dismiss="toast" aria-label="Cerrar notificación"></button></div>`;
    cont.appendChild(el);
    setTimeout(() => el.remove(), 4000);
}

/** Oculta los elementos [data-admin-only] si el usuario no es admin. */
function aplicarPermisos() {
    const esAdmin = window.USER_ROL === 'admin';
    document.querySelectorAll('[data-admin-only]').forEach(el => {
        el.hidden = !esAdmin;
    });
}

/* ------------------------------------------------------------------ */
/*  Menú lateral en móvil                                              */
/* ------------------------------------------------------------------ */
function configurarSidebar() {
    const sidebar  = document.getElementById('sidebar');
    const boton    = document.getElementById('btnSidebar');
    const backdrop = document.getElementById('sidebarBackdrop');
    if (!sidebar || !boton) return;

    const abrir = (si) => {
        sidebar.classList.toggle('open', si);
        backdrop?.classList.toggle('show', si);
        boton.setAttribute('aria-expanded', String(si));
        // Al abrir con teclado, el foco entra al menú; al cerrar, vuelve al botón.
        if (si) sidebar.querySelector('.nav-link')?.focus();
        else boton.focus();
    };

    boton.addEventListener('click', () => abrir(!sidebar.classList.contains('open')));
    backdrop?.addEventListener('click', () => abrir(false));
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && sidebar.classList.contains('open')) abrir(false);
    });
    // Navegar cierra el menú (en móvil queda encima del contenido).
    sidebar.querySelectorAll('.nav-link').forEach(a =>
        a.addEventListener('click', () => sidebar.classList.remove('open')));
}

/* Reloj del topbar */
function actualizarReloj() {
    const el = document.getElementById('clockText');
    if (el) el.textContent = new Date().toLocaleString('es-GT', { dateStyle: 'medium', timeStyle: 'short' });
}

document.addEventListener('DOMContentLoaded', () => {
    aplicarPermisos();
    actualizarReloj();
    setInterval(actualizarReloj, 30000);
    configurarSidebar();
});
