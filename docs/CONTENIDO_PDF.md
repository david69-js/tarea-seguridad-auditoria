# Contenido para el Documento PDF del Proyecto

Este archivo reúne el texto listo para armar el PDF entregable (portada,
descripción, diagramas y capturas). Puedes copiarlo a Word/Google Docs y
exportarlo a PDF, o convertir este Markdown directamente.

---

## PORTADA

> Universidad Mariano Gálvez de Guatemala
> Facultad de Ingeniería en Sistemas de Información
> **Seguridad y Auditoría de Sistemas — PHP y MySQL**
>
> **Proyecto No. 1**
> Sistema de Punto de Venta (POS) Web
> **Tienda Bugambilias**
>
> Estudiante: _(tu nombre y carné)_
> Catedrático: M.Sc. Elmer Rolando Lux Laynez
> Ciclo 2026 — Fecha: _(fecha de entrega)_

---

## 1. Descripción del proyecto

Sistema de Punto de Venta (POS) web para una **tienda familiar** (Tienda Bugambilias),
desarrollado con **PHP 8.3, MySQL y Bootstrap 5**. Permite administrar el
inventario de productos de la tienda, registrar ventas al contado (solo
efectivo, precios finales sin IVA y sin emisión de facturas) con descuentos,
administrar clientes y usuarios, y visualizar reportes con gráficas.

El sistema expone además una **API REST propia** (más de 20 endpoints
documentados) e integra tres servicios externos: **OpenWeatherMap**, **Chart.js** y
**Google Fonts**. Está desplegado en **Railway.app** con base de datos en la nube.

## 2. Objetivos

- Desarrollar una aplicación web full-stack con PHP y MySQL.
- Diseñar una base de datos relacional normalizada (7 tablas).
- Construir y documentar una API REST con operaciones CRUD.
- Integrar APIs externas con funcionalidad visible.
- Implementar autenticación con roles y control de acceso.
- Desplegar la aplicación en un hosting gratuito accesible públicamente.

## 3. Arquitectura y tecnologías

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + React Router (Vite), Bootstrap 5, Bootstrap Icons |
| Backend | PHP 8.3 (PDO), API REST: front-controller + controladores |
| Base de datos | MySQL 8 |
| Autenticación | Sesiones PHP + bcrypt, roles admin/cajero |
| API externa 1 | OpenWeatherMap — clima actual en el dashboard |
| API externa 2 | Chart.js — gráficas del dashboard |
| API externa 3 | Google Fonts — tipografía (Poppins/Inter) |
| Contenedores | Docker + Docker Compose |
| Hosting | Railway.app |

**Patrón de la aplicación:** el frontend es una SPA en React que consume la API
con `fetch()`. Las peticiones a `/api/*` entran por un *front controller*
(`public/index.php`) que las enruta a los controladores y siempre responde JSON.

## 4. Diagrama Entidad–Relación

_(Insertar aquí la imagen del diagrama ER. El código Mermaid está en
`docs/DIAGRAMA_ER.md`; puedes renderizarlo en https://mermaid.live y exportarlo
como PNG.)_

Tablas: `usuarios`, `categorias`, `productos`, `clientes`, `ventas`,
`detalle_ventas`, `pagos`.

## 5. Módulos del sistema

1. **Autenticación:** login/logout, registro, roles (admin/cajero), rutas protegidas.
2. **Inventario:** CRUD de productos, búsqueda, categorías, imagen, alerta de stock bajo (<5).
3. **Punto de Venta (POS):** carrito, descuento y total (precios finales, sin IVA), cobro en efectivo.
4. **Clientes:** CRUD de clientes frecuentes (opcional en cada venta).
5. **Reportes:** dashboard con KPIs y gráficas, reporte por rango de fechas, productos más vendidos.
6. **Usuarios:** gestión de usuarios (solo admin).

## 6. API REST propia

_(Insertar la tabla de endpoints del README — sección "Documentación de la API
REST propia". Mínimo 5 endpoints con método, URL, parámetros y códigos HTTP.)_

## 7. Seguridad

- Contraseñas con bcrypt (`password_hash`).
- Consultas preparadas (PDO) → sin inyección SQL.
- Escape de salida → sin XSS.
- Rutas protegidas por sesión y control por roles.
- Regeneración de ID de sesión al iniciar sesión.

## 8. Capturas de pantalla

_(Insertar las imágenes de la carpeta `docs/capturas/`.)_

1. Pantalla de Login
2. Dashboard con KPIs y gráficas
3. Punto de Venta (carrito)
4. Inventario de productos
5. Detalle de una venta (historial)
6. Reportes

## 9. Despliegue

URL pública del sistema: **_(pegar aquí la URL de Railway)_**
Repositorio GitHub: **_(pegar aquí la URL del repo)_**

## 10. Conclusiones

_(2–3 párrafos: qué aprendiste, retos que enfrentaste y cómo los resolviste.)_
