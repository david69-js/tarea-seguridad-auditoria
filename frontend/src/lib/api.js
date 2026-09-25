/* =====================================================================
 *  Cliente de la API REST propia. Devuelve siempre el JSON
 *  {ok, mensaje, data, detalle} y nunca lanza: los errores de red se
 *  convierten en {ok: false, mensaje}.
 *
 *  Un 401 fuera de /api/auth/ significa que la sesion expiro; se avisa con
 *  el evento "sesion-expirada" para que AuthProvider mande al login. En
 *  /api/auth/login un 401 es solo "credenciales invalidas" y no se avisa.
 * ===================================================================== */

async function enviar(path, opts) {
    try {
        const res = await fetch(path, { credentials: 'same-origin', ...opts });
        if (res.status === 401 && !path.startsWith('/api/auth/')) {
            window.dispatchEvent(new Event('sesion-expirada'));
        }
        const json = await res.json().catch(() => null);
        return json ?? { ok: false, mensaje: `Respuesta inesperada del servidor (${res.status}).` };
    } catch (err) {
        return { ok: false, mensaje: 'Error de red: ' + err.message };
    }
}

/** Peticion JSON. */
export function api(path, { method = 'GET', body = null } = {}) {
    const headers = { Accept: 'application/json' };
    if (body !== null) headers['Content-Type'] = 'application/json';
    return enviar(path, {
        method,
        headers,
        body: body !== null ? JSON.stringify(body) : undefined,
    });
}

/**
 * Envio de formularios con archivos (multipart). Usa POST con override
 * de metodo (_method) para PUT, ya que PHP solo procesa $_FILES en POST.
 */
export function apiForm(path, formData, method = 'POST') {
    if (method !== 'POST') formData.append('_method', method);
    return enviar(path, {
        method: 'POST',
        body: formData,
        headers: { Accept: 'application/json' },
    });
}
