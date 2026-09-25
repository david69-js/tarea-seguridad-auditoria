# 🏪 Sistema de Punto de Venta (POS) Web — Tienda Bugambilias

Proyecto del curso **Seguridad y Auditoría de Sistemas (PHP y MySQL)**
Universidad Mariano Gálvez de Guatemala · Ciclo 2026

Sistema de Punto de Venta web **full-stack** para una tienda familiar (Tienda Bugambilias):
inventario, ventas al contado en efectivo con carrito y descuento, dashboard con
gráficas, autenticación con roles y una **API REST propia** documentada.

---

## 🧰 Tecnologías

| Capa | Tecnología |
|------|------------|
| Frontend | **React 18** + React Router (SPA compilada con **Vite**), **Bootstrap 5**, Bootstrap Icons |
| Backend | **PHP 8.3** (PDO, sin framework) — solo API REST, sin vistas |
| Base de datos | **MySQL 8 / MariaDB** |
| Autenticación | Sesiones PHP + **bcrypt** (`password_hash`), roles admin/cajero |
| API REST | JSON + métodos HTTP + códigos de estado |
| APIs externas | **OpenWeatherMap** · **Chart.js** (react-chartjs-2) · **Google Fonts** |
| Contenedores | Docker + Docker Compose |
| Hosting | Railway.app (PHP + MySQL) |

---

## 🚀 Cómo ejecutarlo en local (con Docker)

Requisitos: Docker + Docker Compose.

```bash
docker compose up --build
```

Luego abrir <http://localhost:8091>

La base de datos se crea y se llena automáticamente con `database/pos_tienda.sql`.

### Usuarios de prueba

| Rol | Correo | Contraseña |
|-----|--------|-----------|
| Administrador | `admin@tienda.com` | `admin123` |
| Cajero | `cajero@tienda.com` | `cajero123` |

> El **admin** puede gestionar inventario, clientes, usuarios y anular ventas.
> El **cajero** puede vender y consultar, pero no administrar el catálogo.

Los usuarios de prueba **no se muestran en la pantalla de login**: los campos
llegan vacíos, como en un sistema real. Desde `/registro` cualquiera puede
crear su propia cuenta (siempre con rol *cajero*).

### Clima del dashboard (OpenWeatherMap)

El dashboard muestra el clima actual usando la API gratuita de OpenWeatherMap.
La clave se consulta **desde el servidor**, así que nunca viaja al navegador:

```bash
export OPENWEATHER_API_KEY=su_clave_gratuita   # openweathermap.org/api_keys
export OPENWEATHER_CIUDAD="Guatemala City,GT"  # opcional
docker compose up --build
```

Sin la clave el sistema funciona igual: la tarjeta del dashboard indica que el
clima no está configurado. La respuesta se cachea 15 minutos para no gastar la
cuota gratuita en cada recarga.

---

## 🧑‍💻 Desarrollo del frontend (React)

El frontend es una SPA en `frontend/`. Para trabajar en él con recarga en
caliente, levante el backend con Docker y, en otra terminal:

```bash
cd frontend
npm install
npm run dev          # http://localhost:5173
```

Vite reenvía `/api` y `/uploads` al contenedor (`http://localhost:8091`), así
que la cookie de sesión funciona igual que en producción. Si el contenedor
usa otro puerto: `API_URL=http://localhost:9000 npm run dev`.

`npm run build` genera `public/app/`, que es lo que sirve Apache. No hace
falta hacerlo a mano para Docker ni Railway: el `Dockerfile` compila el
frontend en una etapa con Node y copia solo el resultado a la imagen PHP.

---

## 📁 Estructura del proyecto

```
.
├── frontend/                # SPA en React (Vite)
│   ├── src/
│   │   ├── main.jsx         # Punto de entrada (router + proveedores)
│   │   ├── App.jsx          # Rutas y protección por sesión / rol
│   │   ├── pages/           # Pantallas: Dashboard, Pos, Productos, Ventas...
│   │   ├── components/      # Layout, Modal, Kpi, CampoPassword...
│   │   ├── lib/             # Cliente de la API, sesión, toasts, formato
│   │   └── styles.css       # Estilos propios sobre Bootstrap
│   └── vite.config.js       # Build a public/app + proxy de desarrollo
├── public/                  # Document root (lo que sirve Apache)
│   ├── index.php            # Router de la API REST (/api/*)
│   ├── .htaccess            # /api/* -> index.php; resto -> app/index.html
│   ├── app/                 # Build del frontend (generado, no versionado)
│   └── uploads/             # Imágenes de productos subidas
├── app/
│   ├── config.php           # Configuración (lee variables de entorno)
│   ├── db.php               # Conexión PDO
│   ├── helpers.php          # JSON, sesión, autenticación y roles
│   └── controllers/         # Lógica: auth, usuarios, productos, ventas,
│                            #         reportes, clima...
├── database/
│   └── pos_tienda.sql     # Script SQL: estructura + datos de prueba
├── docs/                    # Manual, diagrama ER, guía de despliegue
├── pruebas/                 # Pruebas de caja negra de la API (Jest)
├── Dockerfile               # Build de React (Node) + PHP 8.3 + Apache
└── docker-compose.yml       # Entorno local (web + MySQL + phpMyAdmin)
```

---

## 🗄️ Base de datos

7 tablas relacionadas y normalizadas: `usuarios`, `categorias`, `productos`,
`clientes`, `ventas`, `detalle_ventas`, `pagos`.
Ver el diagrama entidad-relación en [`docs/DIAGRAMA_ER.md`](docs/DIAGRAMA_ER.md).

---

## 🔌 Documentación de la API REST propia

Todas las respuestas son **JSON** con el formato:

```json
{ "ok": true, "mensaje": "OK", "data": { } }
```

La autenticación es por **sesión (cookie)**: primero se llama a `POST /api/auth/login`
y la cookie de sesión se envía automáticamente en las siguientes peticiones.
Los endpoints marcados con 🔒 requieren sesión; los marcados con 👑 requieren rol **admin**.

### Autenticación

| Método | Endpoint | Descripción | Códigos |
|--------|----------|-------------|---------|
| `POST` | `/api/auth/login` | Inicia sesión. Body: `{correo, password}` | `200`, `401`, `422` |
| `POST` | `/api/auth/register` | Registra un usuario. Body: `{nombre, correo, password, rol}` | `201`, `409`, `422` |
| `POST` | `/api/auth/logout` | Cierra la sesión | `200` |
| `GET`  | `/api/auth/me` 🔒 | Devuelve el usuario autenticado | `200`, `401` |

### Productos (inventario)

| Método | Endpoint | Descripción | Códigos |
|--------|----------|-------------|---------|
| `GET`    | `/api/productos` 🔒 | Lista productos. Query: `?q=`, `?categoria=`, `?stock_bajo=1` | `200` |
| `GET`    | `/api/productos/{id}` 🔒 | Detalle de un producto | `200`, `404` |
| `POST`   | `/api/productos` 👑 | Crea un producto (acepta imagen multipart) | `201`, `409`, `422` |
| `PUT`    | `/api/productos/{id}` 👑 | Actualiza un producto | `200`, `404` |
| `DELETE` | `/api/productos/{id}` 👑 | Baja lógica del producto | `200`, `404` |

### Categorías

| Método | Endpoint | Descripción | Códigos |
|--------|----------|-------------|---------|
| `GET`    | `/api/categorias` 🔒 | Lista categorías con conteo de productos | `200` |
| `POST`   | `/api/categorias` 👑 | Crea categoría. Body: `{nombre, descripcion}` | `201`, `409` |
| `PUT`    | `/api/categorias/{id}` 👑 | Actualiza categoría | `200`, `404` |
| `DELETE` | `/api/categorias/{id}` 👑 | Elimina categoría | `200`, `404` |

### Usuarios (gestión, solo admin)

| Método | Endpoint | Descripción | Códigos |
|--------|----------|-------------|---------|
| `GET`    | `/api/usuarios` 👑 | Lista/busca usuarios. Query: `?q=` | `200`, `403` |
| `GET`    | `/api/usuarios/{id}` 👑 | Detalle de un usuario | `200`, `404` |
| `PUT`    | `/api/usuarios/{id}` 👑 | Edita nombre, correo, rol, estado y (opcionalmente) contraseña | `200`, `404`, `409`, `422` |
| `DELETE` | `/api/usuarios/{id}` 👑 | Elimina el usuario; si tiene ventas, lo desactiva | `200`, `404`, `409` |

> El alta se hace con `POST /api/auth/register`. El servidor impide que un
> administrador se quite el rol, se desactive o se elimine a sí mismo, y que el
> sistema se quede sin ningún administrador activo (`409`).

### Clientes

| Método | Endpoint | Descripción | Códigos |
|--------|----------|-------------|---------|
| `GET`    | `/api/clientes` 🔒 | Lista/busca clientes. Query: `?q=` | `200` |
| `POST`   | `/api/clientes` 🔒 | Crea cliente | `201`, `422` |
| `PUT`    | `/api/clientes/{id}` 🔒 | Actualiza cliente | `200` |
| `DELETE` | `/api/clientes/{id}` 👑 | Elimina cliente | `200`, `404`, `409` |

### Ventas (POS)

| Método | Endpoint | Descripción | Códigos |
|--------|----------|-------------|---------|
| `GET`  | `/api/ventas` 🔒 | Lista las últimas ventas | `200` |
| `GET`  | `/api/ventas/{id}` 🔒 | Venta completa con los productos vendidos | `200`, `404` |
| `POST` | `/api/ventas` 🔒 | Registra una venta (transacción atómica) | `201`, `422` |
| `POST` | `/api/ventas/{id}/anular` 👑 | Anula la venta y devuelve el stock | `200`, `404`, `409` |

### Reportes

| Método | Endpoint | Descripción | Códigos |
|--------|----------|-------------|---------|
| `GET` | `/api/reportes/dashboard` 🔒 | KPIs + ventas por día/mes + top productos | `200` |
| `GET` | `/api/reportes/ventas` 🔒 | Reporte por rango. Query: `?desde=&hasta=` | `200` |
| `GET` | `/api/reportes/productos-vendidos` 🔒 | Ranking de productos más vendidos | `200` |

### Clima (API externa)

| Método | Endpoint | Descripción | Códigos |
|--------|----------|-------------|---------|
| `GET` | `/api/clima` 🔒 | Clima actual de la ciudad configurada (OpenWeatherMap) | `200`, `401`, `502`, `503` |

Respuesta (`200 OK`):

```json
{
  "ok": true,
  "mensaje": "Clima actual.",
  "data": {
    "ciudad": "Guatemala City", "pais": "GT",
    "temperatura": 23.4, "sensacion": 24.1,
    "humedad": 72, "viento": 11.2,
    "descripcion": "Nubes dispersas", "icono": "03d",
    "actualizado": "14:05"
  }
}
```

Devuelve `503` si no hay `OPENWEATHER_API_KEY` configurada y `502` si el
servicio externo falla o rechaza la consulta.

### Ejemplos de uso

**Login**
```bash
curl -c cookies.txt -X POST http://localhost:8091/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"correo":"admin@tienda.com","password":"admin123"}'
```

**Registrar una venta**
```bash
curl -b cookies.txt -X POST http://localhost:8091/api/ventas \
  -H "Content-Type: application/json" \
  -d '{
        "id_cliente": 2,
        "descuento": 5,
        "items": [
          { "id_producto": 4, "cantidad": 2 },
          { "id_producto": 7, "cantidad": 1 }
        ]
      }'
```

Respuesta (`201 Created`):
```json
{
  "ok": true,
  "mensaje": "Venta registrada correctamente.",
  "data": { "id": 7, "subtotal": 30, "descuento": 5, "total": 25, "...": "..." }
}
```

Reglas de la tienda que aplica el servidor: los precios del catálogo son
**finales (sin IVA)**, todas las ventas se cobran **en efectivo** y **no se
emiten facturas**, así que `total = subtotal − descuento`.

---

## 🌐 Despliegue en Railway

Ver la guía paso a paso en [`docs/DESPLIEGUE_RAILWAY.md`](docs/DESPLIEGUE_RAILWAY.md).

---

## 🔐 Seguridad implementada

- Contraseñas con **bcrypt** (`password_hash` / `password_verify`), nunca en texto plano.
- **Consultas preparadas (PDO)** en todas las consultas → previene inyección SQL.
- **Escape de salida**: React escapa todo lo que se pinta con `{...}` y el código no usa
  `dangerouslySetInnerHTML` → previene XSS.
- **Rutas protegidas**: sin sesión no se accede (la API responde `401` y React manda al login).
- **Control por roles**: acciones de administración exigen rol admin (`403` si no).
- `session_regenerate_id()` al iniciar sesión → previene fijación de sesión.
- Las imágenes subidas **no pueden ejecutarse como PHP** (`.htaccess` en `/uploads`).
- El **login no revela credenciales**: los campos van vacíos y no hay usuarios de
  ejemplo impresos en la página.
- **Validación en el servidor** además de la del navegador (registro y edición de
  usuarios): formato de correo, longitud de contraseña, correo único.
- Reglas de negocio que la interfaz no puede saltarse: un administrador no puede
  degradarse, desactivarse ni borrarse a sí mismo, y siempre debe quedar al menos
  un administrador activo.
- La **clave de OpenWeather se usa solo en el servidor**; el navegador nunca la ve.

---

## 👤 Autor

Proyecto académico — UMG, Seguridad y Auditoría de Sistemas, Ciclo 2026.
