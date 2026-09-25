-- =====================================================================
--  Sistema de Punto de Venta (POS) Web  -  Libreria y Papeleria Escolar
--  Universidad Mariano Galvez de Guatemala
--  Seguridad y Auditoria de Sistemas - PHP y MySQL
--
--  Script completo: ESTRUCTURA + DATOS DE PRUEBA
--  Motor: MySQL 8 / MariaDB 10.x
--  Moneda: Quetzales (GTQ)  |  IVA: 12%
--
--  Usuarios de prueba (contrasena en texto plano solo para pruebas):
--    - admin@libreria.com   / admin123    (rol: admin)
--    - cajero@libreria.com  / cajero123   (rol: cajero)
-- =====================================================================

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS pagos;
DROP TABLE IF EXISTS detalle_ventas;
DROP TABLE IF EXISTS ventas;
DROP TABLE IF EXISTS clientes;
DROP TABLE IF EXISTS productos;
DROP TABLE IF EXISTS categorias;
DROP TABLE IF EXISTS usuarios;

SET FOREIGN_KEY_CHECKS = 1;

-- ---------------------------------------------------------------------
-- Tabla: usuarios  (autenticacion y control de acceso por roles)
-- ---------------------------------------------------------------------
CREATE TABLE usuarios (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    nombre         VARCHAR(100)  NOT NULL,
    correo         VARCHAR(150)  NOT NULL UNIQUE,
    password_hash  VARCHAR(255)  NOT NULL,
    rol            ENUM('admin','cajero') NOT NULL DEFAULT 'cajero',
    activo         TINYINT(1)    NOT NULL DEFAULT 1,
    created_at     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Tabla: categorias
-- ---------------------------------------------------------------------
CREATE TABLE categorias (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    nombre       VARCHAR(80)  NOT NULL UNIQUE,
    descripcion  VARCHAR(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Tabla: productos
-- ---------------------------------------------------------------------
CREATE TABLE productos (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    codigo        VARCHAR(40)   NOT NULL UNIQUE,
    nombre        VARCHAR(150)  NOT NULL,
    descripcion   TEXT          DEFAULT NULL,
    precio        DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    stock         INT           NOT NULL DEFAULT 0,
    id_categoria  INT           DEFAULT NULL,
    imagen_url    VARCHAR(255)  DEFAULT NULL,
    activo        TINYINT(1)    NOT NULL DEFAULT 1,
    created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_producto_categoria
        FOREIGN KEY (id_categoria) REFERENCES categorias(id)
        ON UPDATE CASCADE ON DELETE SET NULL,
    INDEX idx_producto_nombre (nombre),
    INDEX idx_producto_codigo (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Tabla: clientes
-- ---------------------------------------------------------------------
CREATE TABLE clientes (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    nombre     VARCHAR(150) NOT NULL,
    nit        VARCHAR(20)  DEFAULT 'CF',
    correo     VARCHAR(150) DEFAULT NULL,
    telefono   VARCHAR(20)  DEFAULT NULL,
    direccion  VARCHAR(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Tabla: ventas  (cabecera de la factura)
-- ---------------------------------------------------------------------
CREATE TABLE ventas (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario   INT           NOT NULL,
    id_cliente   INT           DEFAULT NULL,
    fecha        TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    subtotal     DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    iva          DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    descuento    DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total        DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    metodo_pago  ENUM('efectivo','tarjeta','QR') NOT NULL DEFAULT 'efectivo',
    estado       ENUM('completada','anulada') NOT NULL DEFAULT 'completada',
    CONSTRAINT fk_venta_usuario
        FOREIGN KEY (id_usuario) REFERENCES usuarios(id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_venta_cliente
        FOREIGN KEY (id_cliente) REFERENCES clientes(id)
        ON UPDATE CASCADE ON DELETE SET NULL,
    INDEX idx_venta_fecha (fecha)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Tabla: detalle_ventas  (lineas de cada factura)
-- ---------------------------------------------------------------------
CREATE TABLE detalle_ventas (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    id_venta         INT           NOT NULL,
    id_producto      INT           NOT NULL,
    cantidad         INT           NOT NULL DEFAULT 1,
    precio_unitario  DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    subtotal         DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    CONSTRAINT fk_detalle_venta
        FOREIGN KEY (id_venta) REFERENCES ventas(id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_detalle_producto
        FOREIGN KEY (id_producto) REFERENCES productos(id)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Tabla: pagos  (registro del pago, referencia a API externa cuando aplica)
-- ---------------------------------------------------------------------
CREATE TABLE pagos (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    id_venta       INT           NOT NULL,
    monto          DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    metodo         ENUM('efectivo','tarjeta','QR') NOT NULL DEFAULT 'efectivo',
    referencia_api VARCHAR(255)  DEFAULT NULL,
    fecha          TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pago_venta
        FOREIGN KEY (id_venta) REFERENCES ventas(id)
        ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =====================================================================
--  DATOS DE PRUEBA
-- =====================================================================

-- Usuarios (password: admin123 / cajero123 - hasheadas con bcrypt)
INSERT INTO usuarios (nombre, correo, password_hash, rol) VALUES
('Administrador', 'admin@libreria.com',  '$2y$10$7P1Wp9lqVUwjDNdzEZXlDupx.er7chfInCau1AGg1Ke2Wymc81gLa', 'admin'),
('Cajero Uno',    'cajero@libreria.com', '$2y$10$ppm.DoHIAvhcccN1H60QdO.4ETHYJrDwnvNqx29Zdhi8mDUOo.J.C', 'cajero');

-- Categorias
INSERT INTO categorias (nombre, descripcion) VALUES
('Libros',              'Libros de texto, literatura y lectura'),
('Cuadernos',           'Cuadernos y libretas escolares'),
('Utiles de Escritura', 'Lapices, lapiceros, marcadores y correctores'),
('Papeleria',           'Hojas, folders, sobres y articulos de oficina'),
('Arte y Manualidades', 'Crayones, temperas, pinceles y material de arte'),
('Mochilas y Loncheras', 'Mochilas, loncheras y accesorios escolares'),
('Tecnologia Escolar',  'Calculadoras, memorias USB y accesorios');

-- Productos (precios en GTQ)
INSERT INTO productos (codigo, nombre, descripcion, precio, stock, id_categoria, imagen_url) VALUES
('LIB-001', 'Diccionario Larousse Escolar',        'Diccionario de espanol edicion escolar',        85.00,  30, 1, NULL),
('LIB-002', 'Libro Ortografia Practica',           'Guia de ortografia con ejercicios',             45.00,  25, 1, NULL),
('LIB-003', 'Atlas Geografico Universal',          'Atlas ilustrado a color',                       120.00, 12, 1, NULL),
('CUA-001', 'Cuaderno Espiral 100 hojas',          'Cuaderno universitario cuadriculado',           18.50, 150, 2, NULL),
('CUA-002', 'Cuaderno Empastado 200 hojas',        'Cuaderno empastado doble linea',                32.00,  80, 2, NULL),
('CUA-003', 'Libreta de Apuntes Pequena',          'Libreta de bolsillo 80 hojas',                  8.00,  200, 2, NULL),
('ESC-001', 'Lapicero BIC Azul',                   'Lapicero punta media tinta azul',               3.50, 500, 3, NULL),
('ESC-002', 'Lapiz Mongol No.2 (caja 12)',         'Caja de 12 lapices de grafito',                 28.00,  60, 3, NULL),
('ESC-003', 'Marcador Permanente Sharpie',         'Marcador permanente negro punta fina',          12.00,  90, 3, NULL),
('ESC-004', 'Corrector Liquido',                   'Corrector liquido 20ml con brocha',             9.50,   4, 3, NULL),
('PAP-001', 'Resma de Hojas Bond Carta',           'Resma 500 hojas papel bond 80g',                42.00,  40, 4, NULL),
('PAP-002', 'Folder Manila Carta (paq 25)',        'Paquete de 25 folders manila',                  35.00,  35, 4, NULL),
('PAP-003', 'Engrapadora Metalica',                'Engrapadora de escritorio estandar',            55.00,  20, 4, NULL),
('PAP-004', 'Caja de Clips (100 unidades)',        'Clips metalicos No.1',                           6.00,   3, 4, NULL),
('ART-001', 'Caja de Crayones (24 colores)',       'Crayones de cera 24 colores',                   22.00,  70, 5, NULL),
('ART-002', 'Set de Temperas (6 colores)',         'Temperas lavables 6 colores',                   38.00,  45, 5, NULL),
('ART-003', 'Pincel de Cerda No.6',                'Pincel para tempera y acuarela',                7.50,   55, 5, NULL),
('MOC-001', 'Mochila Escolar Clasica',             'Mochila resistente con 3 compartimentos',       185.00, 18, 6, NULL),
('MOC-002', 'Lonchera Termica',                    'Lonchera con aislamiento termico',              95.00,  22, 6, NULL),
('TEC-001', 'Calculadora Cientifica Casio',        'Calculadora cientifica 240 funciones',          165.00, 15, 7, NULL),
('TEC-002', 'Memoria USB 32GB',                    'Memoria USB 3.0 32GB',                          75.00,  40, 7, NULL),
('TEC-003', 'Audifonos Escolares',                 'Audifonos con microfono para clases',           85.00,   2, 7, NULL);

-- Clientes
INSERT INTO clientes (nombre, nit, correo, telefono, direccion) VALUES
('Consumidor Final',        'CF',        NULL,                       NULL,        NULL),
('Maria Fernanda Lopez',    '1234567-8', 'mfernanda@example.com',    '5555-1234', 'Zona 1, Guatemala'),
('Colegio San Jose',        '9876543-2', 'compras@colegiosj.edu.gt', '2222-9876', 'Zona 10, Guatemala'),
('Carlos Ramirez',          '4567890-1', 'cramirez@example.com',     '4444-5678', 'Mixco, Guatemala');

-- Ventas de ejemplo (para que el dashboard y reportes muestren datos)
INSERT INTO ventas (id_usuario, id_cliente, fecha, subtotal, iva, descuento, total, metodo_pago, estado) VALUES
(2, 2, DATE_SUB(NOW(), INTERVAL 20 DAY), 44.00,  5.28,  0.00,  49.28,  'efectivo', 'completada'),
(2, 1, DATE_SUB(NOW(), INTERVAL 12 DAY), 45.00,  5.40,  0.00,  50.40,  'tarjeta',  'completada'),
(1, 3, DATE_SUB(NOW(), INTERVAL 5 DAY),  350.00, 39.60, 20.00, 369.60, 'QR',       'completada'),
(2, 4, DATE_SUB(NOW(), INTERVAL 2 DAY),  28.00,  3.36,  0.00,  31.36,  'efectivo', 'completada'),
(2, 1, DATE_SUB(NOW(), INTERVAL 1 DAY),  120.00, 14.40, 0.00,  134.40, 'tarjeta',  'completada'),
(1, 2, NOW(),                            40.50,  4.86,  0.00,  45.36,  'efectivo', 'completada');

-- Detalle de las ventas de ejemplo (cada linea coincide con su cabecera)
INSERT INTO detalle_ventas (id_venta, id_producto, cantidad, precio_unitario, subtotal) VALUES
-- Venta 1 (cuadernos + lapiceros)
(1, 4, 2, 18.50, 37.00),
(1, 7, 2, 3.50,  7.00),
-- Venta 2 (libro de ortografia)
(2, 2, 1, 45.00, 45.00),
-- Venta 3 (Colegio: mochila + calculadora, con descuento)
(3, 18, 1, 185.00, 185.00),
(3, 20, 1, 165.00, 165.00),
-- Venta 4 (caja de lapices)
(4, 8, 1, 28.00, 28.00),
-- Venta 5 (atlas)
(5, 3, 1, 120.00, 120.00),
-- Venta 6 (cuaderno + crayones)
(6, 4,  1, 18.50, 18.50),
(6, 15, 1, 22.00, 22.00);

-- Pagos correspondientes (monto = total de la venta)
INSERT INTO pagos (id_venta, monto, metodo, referencia_api, fecha) VALUES
(1, 49.28,  'efectivo', NULL, DATE_SUB(NOW(), INTERVAL 20 DAY)),
(2, 50.40,  'tarjeta',  NULL, DATE_SUB(NOW(), INTERVAL 12 DAY)),
(3, 369.60, 'QR',       'QR-REF-000003', DATE_SUB(NOW(), INTERVAL 5 DAY)),
(4, 31.36,  'efectivo', NULL, DATE_SUB(NOW(), INTERVAL 2 DAY)),
(5, 134.40, 'tarjeta',  NULL, DATE_SUB(NOW(), INTERVAL 1 DAY)),
(6, 45.36,  'efectivo', NULL, NOW());
