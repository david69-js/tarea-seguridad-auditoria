# Manual de Usuario — POS Librería Escolar

Guía básica para usar el sistema de punto de venta.

---

## 1. Ingreso al sistema

1. Abrir la URL del sistema en el navegador.
2. Escribir el **correo** y la **contraseña**.
3. Presionar **Ingresar**.

| Rol | Correo de prueba | Contraseña | Qué puede hacer |
|-----|------------------|-----------|------------------|
| Administrador | `admin@libreria.com` | `admin123` | Todo: inventario, ventas, clientes, usuarios, anular ventas |
| Cajero | `cajero@libreria.com` | `cajero123` | Vender, ver inventario, clientes y reportes |

> Los campos del login llegan **vacíos**: por seguridad, el sistema no muestra
> ninguna credencial en pantalla. Estas cuentas de prueba solo están en la
> documentación.
>
> El botón del **ojo** junto a la contraseña permite verla mientras la escribes.
> Si escribes mal las credenciales, verás el mensaje "Credenciales inválidas".
> Para salir, usa **Cerrar sesión** en la parte inferior del menú lateral.

### Crear una cuenta nueva

En el login, el enlace **Registrarse** abre el formulario de alta. Se piden
nombre, correo y contraseña (mínimo 6 caracteres, repetida para confirmar).
Las cuentas creadas así siempre entran con rol **cajero**; solo un
administrador puede convertirlas en administrador desde *Usuarios*.

---

## 2. Dashboard (inicio)

Al ingresar verás:

- **Tarjetas KPI:** ventas de hoy, ventas del mes, productos activos y alertas de stock bajo.
- **Gráficas (Chart.js):** ventas de los últimos 7 días, ventas por mes y productos más vendidos.
- **Alertas de inventario:** lista de productos con stock menor a 5 unidades.
- **Clima actual:** temperatura, sensación térmica, humedad y viento de la ciudad
  configurada (servicio externo OpenWeatherMap). Si el administrador del sistema
  no configuró la clave del servicio, la tarjeta lo indica y el resto del
  dashboard funciona igual.

---

## 3. Punto de Venta (POS) — realizar una venta

1. Entrar al menú **Punto de Venta**.
2. **Buscar** el producto por nombre o código en la barra superior.
3. Hacer **clic en el producto** para agregarlo al carrito (a la derecha).
4. Ajustar la **cantidad** con los botones `−` y `+`. El sistema no deja vender
   más de lo que hay en stock.
5. (Opcional) Seleccionar el **cliente** y el **método de pago** (efectivo, tarjeta o QR).
6. (Opcional) Escribir un **descuento** en Quetzales.
7. Revisar **Subtotal**, **IVA (12%)** y **TOTAL**, que se calculan automáticamente.
8. Presionar **Cobrar**.
9. Se abre la **factura imprimible** con un **código QR**. Usar **Imprimir / PDF**
   para imprimirla o guardarla como PDF.

---

## 4. Inventario (productos)

> Crear, editar y eliminar productos es exclusivo del **Administrador**.

- **Buscar:** por nombre o código.
- **Filtrar:** por categoría.
- **Nuevo producto:** botón azul → llenar código, nombre, precio, stock,
  categoría e (opcional) imagen → **Guardar**.
- **Editar:** botón del lápiz en cada fila.
- **Eliminar:** botón del bote de basura (baja lógica; la venta histórica se conserva).
- **Alerta de stock:** los productos con menos de 5 unidades se muestran en rojo.

---

## 5. Clientes

- Ver, buscar, crear y editar clientes.
- El cliente **"Consumidor Final" (NIT: CF)** viene por defecto para ventas rápidas.
- Eliminar clientes es exclusivo del Administrador (no se puede eliminar un cliente con ventas).

---

## 6. Ventas (historial)

- Lista de todas las ventas con fecha, cliente, cajero, método y total.
- Botón de **factura** para volver a ver/imprimir cualquier venta.
- El **Administrador** puede **anular** una venta; al anularla se devuelve el stock.

---

## 7. Reportes

- Elegir un rango de fechas **Desde / Hasta** y presionar **Generar**.
- Muestra: número de ventas, total vendido, IVA recaudado y descuentos.
- Tabla de ventas del período y ranking de **productos más vendidos**.
- Botón **Imprimir / PDF** para exportar el reporte.

---

## 8. Usuarios (solo Administrador)

- **Buscar:** por nombre o correo.
- **Nuevo usuario:** nombre, correo, contraseña (mín. 6) y rol (cajero o administrador).
- **Editar** (botón del lápiz): cambia nombre, correo, rol y estado.
  Para **cambiar la contraseña**, escribe una nueva; si dejas ese campo vacío se
  conserva la que ya tenía.
- **Activar / desactivar** (botón del interruptor): un usuario inactivo no puede
  iniciar sesión, pero sus ventas quedan en el historial.
- **Eliminar** (botón del bote de basura): si el usuario tiene ventas registradas
  el sistema lo desactiva en lugar de borrarlo, para no perder el historial.

> Reglas que el sistema aplica siempre: no puedes quitarte a ti mismo el rol de
> administrador, desactivarte ni eliminarte, y nunca puede quedar el sistema sin
> al menos un administrador activo.

---

## Preguntas frecuentes

**No puedo agregar más de X unidades al carrito.**
Llegaste al stock disponible del producto. Reabastece el inventario para vender más.

**Un cajero no ve los botones de crear/editar/eliminar.**
Es correcto: esas acciones son solo para el Administrador.

**La factura no muestra el código QR.**
El QR se genera con un servicio externo (api.qrserver.com); requiere conexión a Internet.

**El dashboard dice "Clima no disponible".**
Falta configurar la clave gratuita de OpenWeatherMap (`OPENWEATHER_API_KEY`).
Es opcional: no afecta a ventas, inventario ni reportes.

**Olvidé mi contraseña.**
Un administrador puede asignarte una nueva desde *Usuarios* → botón del lápiz →
escribir la contraseña nueva → **Guardar**.

**¿Se ve bien en celular o tablet?**
Sí. En pantallas pequeñas el menú lateral se abre con el botón ☰ de la barra
superior y se cierra con la tecla `Esc` o tocando fuera de él.
