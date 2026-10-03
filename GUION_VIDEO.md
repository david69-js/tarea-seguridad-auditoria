# Guion para el video — Serie III (Pruebas de Software)

**Duración sugerida:** 3–5 minutos · **Qué grabar:** la ejecución de las pruebas sobre el sistema en funcionamiento.
**Recomendación:** graba la pantalla con OBS Studio o el grabador de tu sistema, y activa el micrófono para narrar.

---

## 0. Antes de grabar (preparación, NO se graba)

1. Cierra pestañas/programas que no uses.
2. Abre una terminal en la carpeta del proyecto:
   `cd ~/Documents/GIT-PROJECTS/tarea-seguridad-auditoria`
3. Ten listo el editor con el archivo `pruebas/ventas.test.js` abierto (para mostrarlo).

---

## 1. Introducción (15–20 s) — hablando a cámara/pantalla

> "Buenas, soy Santos David Toj Álvarez. Voy a mostrar el proceso de pruebas de software de mi
> proyecto: el sistema POS de la Tienda Bugambilias. Probaré los módulos de **Ventas**,
> **Ingreso de Usuarios** e **Ingreso de Producto** con pruebas automatizadas en **Jest**,
> ejecutadas contra la API REST real del sistema."

---

## 2. Levantar el sistema (30 s)

Muestra la terminal y escribe:

```bash
docker compose up -d
```

> "Primero levanto el sistema con Docker: se inicia el servidor PHP y la base de datos MySQL
> con los datos de ejemplo. La aplicación queda en http://localhost:8091."

*(Opcional)* Abre el navegador en `http://localhost:8091`, inicia sesión con
`admin@tienda.com` / `admin123` y muestra el dashboard 2–3 segundos.

---

## 3. Mostrar el caso de prueba (30 s)

Cambia al editor y muestra `pruebas/ventas.test.js`, específicamente **CP-VENTA-001**.

> "Este es el caso de Ventas CP-VENTA-001: registra una venta de 2 unidades de un producto de
> Q14, y verifica que el total sea Q28 y que el stock baje de 20 a 18. La prueba habla con el
> endpoint real `POST /api/ventas`."

---

## 4. Ejecutar las pruebas (60–90 s) — **la parte clave del video**

En la terminal:

```bash
cd pruebas
npm test
```

> "Ejecuto `npm test`. Jest corre todos los casos contra la API real."

Cuando termine, señala el resumen en verde:

- `ventas.test.js` → **4 pasan** (Ventas)
- `auth.test.js` → **5 pasan** (Ingreso de Usuarios)
- `productos.test.js` → **11 pasan** (Ingreso de Producto)
- `ganancias.test.js` → **4 pasan**
- **Test Suites: 4 passed · Tests: 24 passed**

> "Todas las pruebas quedan en verde: las 4 de Ventas, las 5 de Ingreso de Usuarios y las 11 de
> Ingreso de Producto. En total, 24 pruebas aprobadas."

*(Opcional, para enfocar solo Ventas y que se vea claro en el video):*

```bash
npx jest ventas.test.js
```

---

## 5. Cierre (15 s)

> "Con esto se demuestra que los tres módulos cumplen sus criterios de aceptación: el resultado
> real coincide con el esperado en cada caso. El detalle de cada prueba está en el documento PDF
> del formato estándar. Gracias."

---

## Comandos de referencia (todos verificados y funcionando)

| Acción | Comando |
|---|---|
| Levantar el sistema | `docker compose up -d` |
| Ver el estado de los contenedores | `docker compose ps` |
| Ejecutar TODAS las pruebas | `cd pruebas && npm test` |
| Ejecutar solo Ventas | `cd pruebas && npx jest ventas.test.js` |
| Ejecutar solo Autenticación | `cd pruebas && npx jest auth.test.js` |
| Ejecutar solo Productos | `cd pruebas && npx jest productos.test.js` |
| Apagar el sistema | `docker compose down` |

> Usuario administrador: **admin@tienda.com** / **admin123**
> Usuario cajero: **cajero@tienda.com** / **cajero123**
