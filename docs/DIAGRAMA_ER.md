# Diagrama Entidad–Relación (ER)

Base de datos `pos_tienda` — 7 tablas relacionadas y normalizadas.

> El diagrama está en formato **Mermaid**. Se ve renderizado automáticamente
> en GitHub. Para exportarlo como imagen para el PDF, puedes pegar el código en
> <https://mermaid.live> y descargar el PNG/SVG.

```mermaid
erDiagram
    usuarios ||--o{ ventas : registra
    clientes ||--o{ ventas : "compra en"
    ventas ||--|{ detalle_ventas : contiene
    ventas ||--|{ pagos : "se paga con"
    productos ||--o{ detalle_ventas : "aparece en"
    categorias ||--o{ productos : clasifica

    usuarios {
        int id PK
        varchar nombre
        varchar correo UK
        varchar password_hash
        enum rol "admin | cajero"
        tinyint activo
        timestamp created_at
    }
    categorias {
        int id PK
        varchar nombre UK
        varchar descripcion
    }
    productos {
        int id PK
        varchar codigo UK
        varchar nombre
        text descripcion
        decimal precio
        int stock
        int id_categoria FK
        varchar imagen_url
        tinyint activo
        timestamp created_at
    }
    clientes {
        int id PK
        varchar nombre
        varchar correo
        varchar telefono
        varchar direccion
    }
    ventas {
        int id PK
        int id_usuario FK
        int id_cliente FK
        timestamp fecha
        decimal subtotal
        decimal descuento
        decimal total
        enum estado "completada | anulada"
    }
    detalle_ventas {
        int id PK
        int id_venta FK
        int id_producto FK
        int cantidad
        decimal precio_unitario
        decimal subtotal
    }
    pagos {
        int id PK
        int id_venta FK
        decimal monto
        timestamp fecha
    }
```

## Relaciones (cardinalidad)

| Relación | Tipo | Descripción |
|----------|------|-------------|
| `categorias` → `productos` | 1 : N | Una categoría agrupa muchos productos |
| `usuarios` → `ventas` | 1 : N | Un usuario (cajero/admin) registra muchas ventas |
| `clientes` → `ventas` | 1 : N | Un cliente puede tener muchas ventas |
| `ventas` → `detalle_ventas` | 1 : N | Una venta contiene varias líneas de detalle |
| `productos` → `detalle_ventas` | 1 : N | Un producto aparece en muchos detalles |
| `ventas` → `pagos` | 1 : N | Registro del cobro en efectivo de cada venta |

## Normalización

- **1FN:** todos los atributos son atómicos; no hay grupos repetidos.
- **2FN:** cada tabla tiene clave primaria simple (`id`); los atributos dependen
  por completo de la clave.
- **3FN:** no hay dependencias transitivas — por ejemplo, el nombre de la
  categoría no se repite en `productos`, se referencia con `id_categoria`; el
  precio de venta se "congela" en `detalle_ventas.precio_unitario` para conservar
  el histórico aunque cambie el precio del producto.
