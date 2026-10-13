/* =====================================================================
 *  Cliente HTTP con sesión para las pruebas de la API.
 *  fetch de Node no guarda cookies: aquí se toma la cookie PHPSESSID del
 *  login y se reenvía en cada petición, como haría el navegador.
 * ===================================================================== */

const BASE_URL = process.env.BASE_URL || 'http://localhost:8091';

async function pedir(metodo, ruta, { body, cookie } = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (cookie) headers.Cookie = cookie;

  const res = await fetch(BASE_URL + ruta, {
    method: metodo,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let data = null;
  try {
    data = await res.json();
  } catch (_) {
    /* respuesta sin JSON */
  }
  return { status: res.status, data, setCookies: res.headers.getSetCookie() };
}

/** Inicia sesión y devuelve funciones get/post/put/del que usan esa sesión. */
async function iniciarSesion(correo, password) {
  const r = await pedir('POST', '/api/auth/login', { body: { correo, password } });
  if (r.status !== 200) throw new Error(`No se pudo iniciar sesión con ${correo}: ${r.status}`);
  // El login manda dos Set-Cookie: la sesión inicial y la nueva que crea
  // session_regenerate_id() (protección contra fijación de sesión). La válida
  // es la última; la primera ya fue destruida en el servidor.
  const cookie = r.setCookies.at(-1).split(';')[0]; // PHPSESSID=...
  return {
    get: (ruta) => pedir('GET', ruta, { cookie }),
    post: (ruta, body) => pedir('POST', ruta, { body, cookie }),
    put: (ruta, body) => pedir('PUT', ruta, { body, cookie }),
    del: (ruta) => pedir('DELETE', ruta, { cookie }),
  };
}

/** Código de producto único por corrida, para que las pruebas se puedan repetir. */
const codigoUnico = (prefijo) => `${prefijo}-${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`;

module.exports = { BASE_URL, pedir, iniciarSesion, codigoUnico };
