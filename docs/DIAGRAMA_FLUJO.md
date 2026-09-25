# Diagrama de Flujo — POS Web (Tienda Bugambilias)

Documento que explica **cómo funciona la aplicación**: el ciclo de vida de una
petición, la autenticación por roles y el flujo del proceso central (registrar
una venta). Los diagramas están en formato **Mermaid** (se renderizan solos en
GitHub y en VS Code con la extensión de Mermaid).

---

## 1. Arquitectura general

La aplicación tiene dos partes:

- **Frontend:** SPA en **React** (compilada con Vite). Apache sirve los archivos
  estáticos de `public/app/` y React Router decide qué pantalla mostrar.
- **Backend:** **API REST en PHP puro** (sin framework) con patrón *Front
  Controller*. Todas las peticiones a `/api/*` entran por `public/index.php` y
  siempre responden JSON. El backend no genera HTML.

El navegador consume la API con `fetch` (ver `frontend/src/lib/api.js`).

```mermaid
flowchart LR
    Usuario([👤 Usuario<br/>navegador])

    subgraph Cliente["Frontend (navegador)"]
        SPA["SPA React<br/>React Router + Bootstrap"]
        JS["lib/api.js<br/>fetch() a la API REST"]
    end

    subgraph Servidor["Servidor (Apache/Docker)"]
        HT[".htaccess"]
        EST["public/app/<br/>index.html + JS/CSS"]
        FC["public/index.php<br/>Router de la API"]
        API["auth · productos · categorias<br/>clientes · ventas · reportes<br/>usuarios · clima"]
        HELP["helpers.php<br/>JSON, sesión, roles"]
        DBP["db.php (PDO singleton)"]
    end

    DB[("🗄️ MySQL<br/>pos_tienda")]
    OWM["🌐 OpenWeatherMap<br/>(clima del dashboard)"]

    Usuario --> SPA
    SPA --> JS
    Usuario -->|"/login, /pos, ..."| HT
    HT -->|"rutas de pantalla"| EST
    JS -->|"/api/* + cookie de sesión"| HT
    HT -->|"/api/*"| FC
    FC --> API
    API --> HELP
    API --> DBP
    DBP --> DB
    API -.->|"clima.php (desde el servidor)"| OWM
```

---

## 2. Ciclo de vida de una petición a la API (Router)

`public/.htaccess` envía las rutas `/api/*` a `public/index.php`, que calcula la
ruta y el método, aplica el *method override* (para PUT/DELETE con archivos) y
hace *match* contra la tabla de rutas. Cualquier otra ruta se responde con el
`index.html` de React.

```mermaid
flowchart TD
    A([Llega petición]) --> B{"¿La ruta empieza<br/>con /api?"}
    B -->|No| S["Archivo estático o<br/>public/app/index.html (React)"]
    B -->|Sí| C["public/index.php<br/>carga db.php, helpers.php y controladores"]
    C --> D["Calcula ruta (path) y método HTTP"]
    D --> E{"¿POST con<br/>_method PUT/PATCH/DELETE?"}
    E -->|Sí| F["Sobrescribe el método"]
    E -->|No| G
    F --> G["dispatch(method, path)"]
    G --> H{"¿Coincide<br/>alguna ruta?"}
    H -->|Sí| J["Controlador de la API"]
    H -->|No| K["json_error 404 / 405"]
    J --> N["json_ok / json_error<br/>respuesta JSON"]
```

---

## 3. Autenticación y control de roles

El login se hace contra la API: verifica la contraseña con **bcrypt**
(`password_verify`) contra la tabla `usuarios` y guarda al usuario en
`$_SESSION`. Los roles son **`admin`** y **`cajero`**. React oculta lo que el rol
no permite, pero quien decide es siempre el servidor.

```mermaid
flowchart TD
    A([Usuario abre la app]) --> B["React pide GET /api/auth/me"]
    B --> C{"¿Sesión activa?"}
    C -->|No 401| D["Pantalla /login"]
    D --> E["POST /api/auth/login<br/>correo + password"]
    E --> F["SELECT usuarios WHERE correo, activo=1"]
    F --> G{"¿Existe y<br/>password_verify() OK?"}
    G -->|No| H["401 → aviso 'Correo o contraseña incorrectos'"]
    H --> D
    G -->|Sí| I["session_regenerate_id()<br/>guarda $_SESSION['user'] (id, rol...)"]
    I --> J["React muestra el dashboard"]
    C -->|Sí 200| J

    J --> K{"Petición a la API"}
    K -->|"Endpoint con sesión"| L["require_api_login()"]
    K -->|"Solo admin<br/>(usuarios, anular venta, catálogo)"| M["require_api_admin()"]
    L --> P{¿Autenticado?}
    P -->|No| Q["401 → React vuelve a /login"]
    P -->|Sí| O["Responde el dato (JSON)"]
    M --> R{¿Es admin?}
    R -->|No| S["403 — Acceso denegado"]
    R -->|Sí| O
```

---

## 4. Flujo del proceso central: registrar una venta (POS)

El corazón del sistema. El cajero arma el carrito en `/pos`, el navegador envía
`POST /api/ventas` y el servidor procesa **todo en una transacción atómica**:
valida stock (con `FOR UPDATE`), calcula importes, guarda cabecera + detalle,
descuenta stock, registra el pago y hace `commit`.

Reglas de la tienda: los precios son **finales (sin IVA)**, el cobro es
**siempre en efectivo** y **no se emiten facturas**; el detalle de cada venta se
consulta en pantalla desde el historial.

```mermaid
flowchart TD
    A([Cajero en /pos]) --> B["Agrega productos al carrito<br/>elige cliente (opcional) y descuento"]
    B --> C["POST /api/ventas (JSON con items)"]
    C --> D["require_api_login()"]
    D --> E["BEGIN TRANSACTION"]

    E --> F["Por cada item:<br/>SELECT producto FOR UPDATE"]
    F --> G{"¿Existe y hay<br/>stock suficiente?"}
    G -->|No| H["throw → ROLLBACK<br/>422 'Stock insuficiente'"]
    G -->|Sí| I["Acumula subtotal por línea"]

    I --> J{"¿Descuento ><br/>subtotal?"}
    J -->|Sí| H
    J -->|No| K["total = subtotal − descuento<br/>(sin IVA)"]

    K --> L["INSERT ventas (cabecera)"]
    L --> M["INSERT detalle_ventas<br/>+ UPDATE stock = stock - cantidad"]
    M --> N["INSERT pagos (monto en efectivo)"]
    N --> O["COMMIT"]
    O --> P["201 → venta completa (JSON)"]
    P --> Q(["Aviso: 'Venta #N registrada: Q X en efectivo'"])
```

> **Anulación** (`POST /api/ventas/{id}/anular`): solo **admin**. Devuelve el
> stock de cada línea y marca la venta como `anulada`, también en una transacción.

---

## 5. Módulos y rutas

| Módulo | Pantalla (React) | API REST | Acceso |
|---|---|---|---|
| Autenticación | `/login`, `/registro` | `/api/auth/*` | Público / sesión |
| Dashboard | `/dashboard` | `/api/reportes/dashboard`, `/api/clima` | Sesión |
| Inventario | `/productos` (costo y ganancia: solo admin) | `/api/productos` (CRUD) | Sesión (editar: admin) |
| Categorías | — | `/api/categorias` (CRUD) | Sesión (editar: admin) |
| Punto de Venta | `/pos` | `POST /api/ventas` | Sesión |
| Ventas | `/ventas` (con detalle de cada venta) | `/api/ventas`, `.../anular` | Sesión / admin |
| Clientes | `/clientes` | `/api/clientes` (CRUD) | Sesión |
| Reportes | `/reportes` (rentabilidad: solo admin) | `/api/reportes/*`, `/api/reportes/rentabilidad` | Sesión / admin |
| Usuarios | `/usuarios` | `/api/usuarios` | **Solo admin** |

---

### Resumen del stack

- **Backend:** PHP 8 (PDO + MySQL), consultas preparadas (anti SQL-injection), solo API REST.
- **Frontend:** React + React Router + Bootstrap, `fetch` contra la API REST.
- **Sesión:** cookies de sesión PHP; roles `admin` / `cajero`.
- **Externo:** OpenWeatherMap (clima, consultado desde el servidor), Chart.js y Google Fonts.
- **Infra:** Docker / Apache; desplegable en Railway.
