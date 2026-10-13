# Guion para la Presentación (10 minutos)

Objetivo del rubro: **demo en vivo sin errores + explicar la arquitectura y el código.**

---

## Antes de empezar (checklist)

- [ ] Tener la URL pública de Railway abierta y con sesión lista para iniciar.
- [ ] Tener el repositorio de GitHub abierto en otra pestaña.
- [ ] Tener el diagrama ER a la mano.
- [ ] Repasar el flujo: login → dashboard → POS → historial de ventas → reportes.

---

## Minuto a minuto

**0:00 – 1:00 · Introducción**
- "Es un POS web para una tienda familiar, la Tienda Bugambilias, con frontend en React y una API REST en PHP 8 con MySQL, desplegado en Railway."
- Mencionar los 3 servicios externos: OpenWeatherMap (clima), Chart.js y Google Fonts.

**1:00 – 2:30 · Login y seguridad**
- Iniciar sesión como **admin**.
- Explicar: "Las contraseñas se guardan con bcrypt, no en texto plano. Las rutas están protegidas: sin sesión la API responde 401 y React vuelve al login."
- Mencionar los dos roles (admin y cajero).

**2:30 – 4:30 · Punto de Venta (lo más importante)**
- Buscar un producto, agregarlo al carrito, cambiar cantidades.
- Mostrar el cálculo automático de **Subtotal y Total**, aplicar un **descuento**.
- Explicar las reglas de la tienda: precios finales **sin IVA**, cobro **solo en efectivo** y **sin facturas**.
- Presionar **Cobrar** → aviso con el número de venta y el monto; en **Ventas** se abre su **detalle**.
- Explicar: "La venta se registra en una transacción; si algo falla, se revierte y no se descuenta stock."

**4:30 – 5:30 · Inventario**
- Mostrar el CRUD de productos, el buscador y la **alerta de stock bajo** (rojo).
- Mostrar rápidamente que un **cajero** no ve los botones de administración (control por roles).

**5:30 – 6:30 · Dashboard y Reportes**
- Mostrar los KPIs y las **gráficas de Chart.js** (ventas por día/mes, top productos).
- En Reportes, generar un reporte por rango de fechas.

**6:30 – 8:30 · Arquitectura y código (parte técnica)**
- Abrir el repositorio y mostrar la estructura: `frontend/` (React),
  `public/index.php` (router de la API) y `app/controllers/`.
- Mostrar **un endpoint** de la API (por ejemplo `api_ventas_create` en
  `app/controllers/ventas.php`) y explicar la transacción y el cálculo del total (subtotal − descuento).
- Mostrar el **diagrama ER** y explicar 2–3 relaciones (venta → detalle → producto).
- Mostrar que todas las consultas usan **PDO preparado** (anti inyección SQL).

**8:30 – 9:30 · Despliegue**
- Explicar que corre en Railway con `Dockerfile` (compila React y lo sirve con PHP + Apache) y MySQL en la nube.
- Mostrar la URL pública funcionando.

**9:30 – 10:00 · Cierre**
- Resumen y conclusiones. Abrir espacio a preguntas.

---

## Preguntas que podría hacer el catedrático (y respuestas)

**¿Cómo evitas inyección SQL?**
Con consultas preparadas de PDO (`prepare` + parámetros); nunca concateno
entradas del usuario en el SQL.

**¿Cómo proteges las contraseñas?**
Con `password_hash` (bcrypt) al registrar y `password_verify` al iniciar sesión.
En la base solo se guarda el hash.

**¿Qué pasa si dos ventas ocurren a la vez sobre el mismo producto?**
La venta corre dentro de una transacción y bloquea la fila del producto
(`SELECT ... FOR UPDATE`) antes de descontar stock.

**¿Cuáles son tus APIs externas y dónde se ven?**
OpenWeatherMap (clima en el dashboard, consultado desde el servidor para no
exponer la clave), Chart.js (gráficas del dashboard) y Google Fonts
(tipografía de toda la interfaz).

**¿Cómo manejas los roles?**
En el servidor: los endpoints de administración llaman a `require_api_admin()`
que devuelve 403 si el usuario no es admin. En la interfaz se ocultan los botones.
