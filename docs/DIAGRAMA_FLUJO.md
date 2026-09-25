# Diagrama de Flujo — POS Web (Tienda El Estudiante)

Documento que explica **cómo funciona la aplicación**: el ciclo de vida de una
petición, la autenticación por roles y el flujo del proceso central (registrar
una venta). Los diagramas están en formato **Mermaid** (se renderizan solos en
GitHub y en VS Code con la extensión de Mermaid).

---

## 1. Arquitectura general

Aplicación **PHP puro** (sin framework) con patrón *Front Controller*. Un único
punto de entrada (`public/index.php`) despacha dos tipos de rutas:

- **Rutas web** → devuelven páginas HTML (Bootstrap).
- **Rutas `/api`** → API REST propia que devuelve JSON.

El navegador consume la API con `fetch` (ver `public/assets/js/app.js`).

```mermaid
flowchart LR
    Usuario([👤 Usuario<br/>navegador])

    subgraph Cliente["Frontend (navegador)"]
        HTML[Páginas HTML<br/>Bootstrap]
        JS["app.js<br/>fetch() a la API REST"]
    end

    subgraph Servidor["Servidor PHP (Apache/Docker)"]
        HT[".htaccess<br/>reescribe todo →"]
        FC["public/index.php<br/>Front Controller / Router"]

        subgraph Ctrls["Controladores"]
            WEB["web.php<br/>(páginas)"]
            API["auth · productos · categorias<br/>clientes · ventas · reportes<br/>(API REST → JSON)"]
        end

        HELP["helpers.php<br/>sesión, roles, view(), JSON"]
        DBP["db.php (PDO singleton)"]
    end

    DB[("🗄️ MySQL<br/>pos_libreria")]
    QR["🌐 API externa QR<br/>api.qrserver.com"]

    Usuario --> HTML
    HTML --> JS
    JS -->|"HTTP + cookies de sesión"| HT
    Usuario -->|"navegación de páginas"| HT
    HT --> FC
    FC --> WEB
    FC --> API
    WEB --> HELP
    API --> HELP
    WEB --> DBP
    API --> DBP
    DBP --> DB
    HTML -.->|"<img> del QR"| QR
```

---

## 2. Ciclo de vida de una petición (Router)

Todo pasa por `public/index.php`, que calcula la ruta y el método, aplica el
*method override* (para PUT/DELETE desde formularios) y hace *match* contra la
tabla de rutas.

```mermaid
flowchart TD
    A([Llega petición]) --> B[".htaccess → public/index.php"]
    B --> C["Carga db.php, helpers.php<br/>y todos los controladores"]
    C --> D["Calcula ruta (path) y método HTTP"]
    D --> E{"¿POST con<br/>_method PUT/PATCH/DELETE?"}
    E -->|Sí| F["Sobrescribe el método"]
    E -->|No| G
    F --> G["dispatch(method, path)"]
    G --> H{"¿Coincide<br/>alguna ruta?"}

    H -->|"Ruta web"| I["Controlador web.php"]
    H -->|"Ruta /api"| J["Controlador de API"]
    H -->|"No coincide (/api)"| K["json_error 404 / 405"]
    H -->|"No coincide (web)"| L["Vista errors/404"]

    I --> M["view() renderiza HTML<br/>dentro de layout/main"]
    J --> N["json_ok / json_error<br/>respuesta JSON"]
```

---

## 3. Autenticación y control de roles

Hay dos vías de login (formulario web y API), ambas verifican la contraseña con
**bcrypt** (`password_verify`) contra la tabla `usuarios` y guardan al usuario en
`$_SESSION`. Los roles son **`admin`** y **`cajero`**.

```mermaid
flowchart TD
    A([Usuario abre la app]) --> B{"¿Sesión activa?<br/>is_logged_in()"}
    B -->|No| C["/login — formulario"]
    C --> D["POST /login<br/>correo + password"]
    D --> E["SELECT usuarios WHERE correo, activo=1"]
    E --> F{"¿Existe y<br/>password_verify() OK?"}
    F -->|No| G["Redirige a /login?error=1"]
    G --> C
    F -->|Sí| H["session_regenerate_id()<br/>guarda \$_SESSION['user'] (id, rol...)"]
    H --> I["Redirige a /dashboard"]

    B -->|Sí| I

    I --> J{"Acción solicitada"}
    J -->|"Página protegida"| K["require_login()"]
    J -->|"Endpoint API"| L["require_api_login()"]
    J -->|"Solo admin<br/>(usuarios, anular venta)"| M["require_api_admin()<br/>/ is_admin()"]

    K --> N{¿Autenticado?}
    N -->|No| C
    N -->|Sí| O["Sirve la página / dato"]
    L --> P{¿Autenticado?}
    P -->|No| Q["401 JSON → app.js redirige a /login"]
    P -->|Sí| O
    M --> R{¿Es admin?}
    R -->|No| S["403 — Acceso denegado"]
    R -->|Sí| O
```

---

## 4. Flujo del proceso central: registrar una venta (POS)

El corazón del sistema. El cajero arma el carrito en `/pos`, el navegador envía
`POST /api/ventas` y el servidor procesa **todo en una transacción atómica**:
valida stock (con `FOR UPDATE`), calcula importes, guarda cabecera + detalle,
descuenta stock, registra el pago y hace `commit`. Luego se puede imprimir la
**factura con código QR**.

```mermaid
flowchart TD
    A([Cajero en /pos]) --> B["Agrega productos al carrito<br/>elige cliente, método de pago, descuento"]
    B --> C["POST /api/ventas (JSON con items)"]
    C --> D["require_api_login()"]
    D --> E["BEGIN TRANSACTION"]

    E --> F["Por cada item:<br/>SELECT producto FOR UPDATE"]
    F --> G{"¿Existe y hay<br/>stock suficiente?"}
    G -->|No| H["throw → ROLLBACK<br/>422 'Stock insuficiente'"]
    G -->|Sí| I["Acumula subtotal por línea"]

    I --> J{"¿Descuento ><br/>subtotal?"}
    J -->|Sí| H
    J -->|No| K["Calcula:<br/>IVA 12% · total"]

    K --> L["INSERT ventas (cabecera)"]
    L --> M["INSERT detalle_ventas<br/>+ UPDATE stock = stock - cantidad"]
    M --> N["INSERT pagos<br/>(genera referencia QR si aplica)"]
    N --> O["COMMIT"]
    O --> P["201 → venta completa (JSON)"]

    P --> Q(["Ver factura<br/>GET /ventas/{id}"])
    Q --> R["Vista factura.php<br/>+ &lt;img&gt; QR desde api.qrserver.com"]
```

> **Anulación** (`POST /api/ventas/{id}/anular`): solo **admin**. Devuelve el
> stock de cada línea y marca la venta como `anulada`, también en una transacción.

---

## 5. Módulos y rutas

| Módulo | Página (web) | API REST | Acceso |
|---|---|---|---|
| Autenticación | `/login`, `/logout` | `/api/auth/*` | Público / sesión |
| Dashboard | `/dashboard` | `/api/reportes/dashboard` | Sesión |
| Inventario | `/productos` | `/api/productos` (CRUD) | Sesión |
| Categorías | — | `/api/categorias` (CRUD) | Sesión |
| Punto de Venta | `/pos` | `POST /api/ventas` | Sesión |
| Ventas | `/ventas`, `/ventas/{id}` (factura) | `/api/ventas`, `.../anular` | Sesión / admin |
| Clientes | `/clientes` | `/api/clientes` (CRUD) | Sesión |
| Reportes | `/reportes` | `/api/reportes/*` | Sesión |
| Usuarios | `/usuarios` | — (render en servidor) | **Solo admin** |

---

### Resumen del stack

- **Backend:** PHP 8 (PDO + MySQL), consultas preparadas (anti SQL-injection).
- **Frontend:** HTML + Bootstrap + JS `fetch` contra la API REST.
- **Sesión:** cookies de sesión PHP; roles `admin` / `cajero`.
- **Externo:** generación de QR en `api.qrserver.com` (visible en cada factura).
- **Infra:** Docker / Apache; desplegable en Railway.
