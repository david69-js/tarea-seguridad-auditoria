# Guion del video — Ejecución de pruebas con Jest

**Proyecto:** Sistema POS Web — Tienda Bugambilias · **Herramienta:** Jest
**Módulos:** Módulo 2 · Gestión de Productos y Módulo 4 · Cálculo de Ganancias
(más Módulo 1 · Autenticación como regresión)
**Duración sugerida:** 6 a 8 minutos · **Documento de apoyo:** `Plan_Pruebas_y_Formato_Estandar_POS_Web.docx`

---

## Antes de grabar (5 minutos)

1. Levantar el sistema con la base de datos limpia:
   ```bash
   docker compose down -v && docker compose up -d
   ```
2. Dejar abiertas estas ventanas:
   - **Terminal** con letra grande (Cmd + para ampliar), ubicada en la carpeta del proyecto.
   - **VS Code** con `pruebas/productos.test.js` y `pruebas/ganancias.test.js`.
   - **Navegador** en <http://localhost:8091> (sin sesión iniciada).
   - **Word** con el documento del plan abierto en la sección 1.8 (matriz de casos).
3. Probar una vez que todo pasa: `cd pruebas && npm test`.
4. Grabar con QuickTime (Archivo → Nueva grabación de pantalla) o con OBS.

---

## Escena 1 · Presentación (0:00 – 0:45)

**Mostrar:** la portada del documento.

> "Soy Santos David Toj Álvarez. Este video muestra la ejecución de las pruebas del
> sistema de inventario y precios de la Tienda Bugambilias. La herramienta que
> seleccioné es **Jest**, que automatiza los casos de prueba contra la API real del
> sistema. Voy a probar dos módulos: **Gestión de Productos** y **Cálculo de
> Ganancias**, y en cada caso indico si es una prueba de **caja negra, blanca o gris**."

## Escena 2 · El plan y los tipos de caja (0:45 – 1:45)

**Mostrar:** en Word, la tabla 1.4 (tipos de prueba) y la 1.8 (matriz de casos).

> "Caja **negra** es probar contra el requerimiento: doy entradas y reviso la salida sin
> mirar el código. Caja **blanca** es diseñar la prueba leyendo el código, para pasar por
> cada rama y verificar las fórmulas. Caja **gris** es cuando conozco parte del diseño
> interno —la base de datos o los roles— pero pruebo desde afuera, por la API."
>
> "En la matriz están los 9 casos planificados: 5 de productos y 4 de ganancias."

## Escena 3 · El sistema funcionando (1:45 – 2:45)

**Mostrar:** el navegador.

1. Iniciar sesión con `admin@tienda.com` / `admin123`.
2. Ir a **Inventario**: señalar las columnas **Compra, Venta y Ganancia**.
3. Clic en **Nuevo producto**, escribir compra `10` y venta `15`: la ganancia muestra **Q 5.00**.
   Cambiar la venta a `8`: aparece **"Se vende sin ganancia"**. Cancelar.

> "Esto es lo que vamos a verificar de forma automática con Jest: el registro de
> productos y el cálculo de la ganancia, que es precio de venta menos precio de compra."

## Escena 4 · Ejecutar las pruebas (2:45 – 4:00)

**Mostrar:** la terminal.

```bash
cd pruebas
npm test
```

Recorrer la salida de arriba hacia abajo, señalando la etiqueta de cada caso:

> "Jest ejecuta 20 verificaciones y todas pasan en verde."
>
> - "**CP-PROD-001, 002 y 003** son de **caja negra**: creo, edito y elimino un producto como
>   lo haría el dueño, y reviso que la API responda lo esperado."
> - "**CP-PROD-004** es de **caja blanca**: cada línea es una **rama** del código de validación."
> - "**CP-PROD-005** es de **caja gris**: sé que el sistema oculta el costo a los cajeros y lo
>   compruebo desde la API."
> - "En ganancias, **CP-GAN-001 y 003** son de **caja blanca** (verifican la fórmula),
>   **CP-GAN-002** es de **caja negra** (el reporte muestra primero al más rentable) y
>   **CP-GAN-004** es de **caja gris**."
> - "Al final corre el módulo de autenticación como prueba de regresión."

## Escena 5 · Cómo se ve una prueba de cada tipo (4:00 – 6:00)

**Mostrar:** VS Code.

1. **Caja negra** — `productos.test.js`, caso `CP-PROD-001`:
   > "Envío el producto, espero **201** y el mensaje *Producto creado*, y lo busco en el
   > listado. No necesito saber cómo está programado."
2. **Caja blanca** — abrir `app/controllers/productos.php`, función `api_productos_create()`,
   y al lado el `test.each` de `CP-PROD-004`:
   > "Aquí están las ramas del código: código o nombre vacíos, precios faltantes, precio
   > negativo y código repetido. Diseñé **un dato de prueba por cada rama**, por eso es caja blanca."
3. **Caja gris** — `ganancias.test.js`, caso `CP-GAN-004`:
   > "Sé que cada venta guarda el **costo del momento** en la base de datos. Vendo, cambio el
   > precio de compra y compruebo que la ganancia de la venta ya hecha **no cambia**."

## Escena 6 · Demostrar que la prueba detecta errores (6:00 – 7:00) — opcional, suma puntos

1. En `ganancias.test.js`, cambiar temporalmente en CP-GAN-001 `toBe(5)` por `toBe(6)`.
2. Ejecutar `npm test -- ganancias`: la prueba falla en **rojo** y muestra *Expected 6, Received 5*.
3. Regresar el valor a `5` y ejecutar de nuevo: vuelve a verde.

> "Así se comprueba que la prueba realmente verifica el cálculo: si el resultado no
> coincide, Jest lo reporta."

## Escena 7 · Prototipo y cierre (7:00 – 8:00)

**Mostrar:** la terminal.

```bash
cd ../frontend
npm test
```

> "Además probé el **prototipo de la interfaz** con Jest y Testing Library, como prueba ágil:
> 46 pruebas que simulan al usuario en cada pantalla."
>
> "Los resultados de cada caso quedaron registrados en el **Formato de Caso de Prueba
> Estándar**, con el resultado real y el estado. Los módulos de productos y ganancias
> cumplen el 100 % de los casos. Gracias."

**Mostrar para cerrar:** el resumen (sección 3) del documento.

---

## Si algo falla durante la grabación

| Síntoma | Solución |
|---|---|
| `No se pudo iniciar sesión ... 000` o `fetch failed` | El sistema no está levantado: `docker compose up -d` y esperar ~20 s. |
| Falla CP-LOGIN-001 | La base tiene datos viejos: `docker compose down -v && docker compose up -d`. |
| La terminal se ve pequeña | Cmd + (ampliar) antes de grabar; la salida de Jest debe leerse completa. |
