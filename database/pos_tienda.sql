-- =====================================================================
--  Sistema de Punto de Venta (POS) Web  -  Tienda Bugambilias
--  Universidad Mariano Galvez de Guatemala
--  Seguridad y Auditoria de Sistemas - PHP y MySQL
--
--  Script completo: ESTRUCTURA + DATOS DE PRUEBA
--  Motor: MySQL 8 / MariaDB 10.x
--  Moneda: Quetzales (GTQ)  |  Precios finales (sin IVA)
--  Ventas al contado: solo efectivo y sin emision de facturas
--
--  Usuarios de prueba (contrasena en texto plano solo para pruebas):
--    - admin@tienda.com   / admin123    (rol: admin)
--    - cajero@tienda.com  / cajero123   (rol: cajero)
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
    correo     VARCHAR(150) DEFAULT NULL,
    telefono   VARCHAR(20)  DEFAULT NULL,
    direccion  VARCHAR(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Tabla: ventas  (cabecera de la venta)
-- ---------------------------------------------------------------------
CREATE TABLE ventas (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario   INT           NOT NULL,
    id_cliente   INT           DEFAULT NULL,
    fecha        TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    subtotal     DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    descuento    DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total        DECIMAL(10,2) NOT NULL DEFAULT 0.00,
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
-- Tabla: detalle_ventas  (lineas de cada venta)
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
-- Tabla: pagos  (registro del pago en efectivo de cada venta)
-- ---------------------------------------------------------------------
CREATE TABLE pagos (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    id_venta       INT           NOT NULL,
    monto          DECIMAL(10,2) NOT NULL DEFAULT 0.00,
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
('Administrador', 'admin@tienda.com',  '$2y$10$7P1Wp9lqVUwjDNdzEZXlDupx.er7chfInCau1AGg1Ke2Wymc81gLa', 'admin'),
('Cajero Uno',    'cajero@tienda.com', '$2y$10$ppm.DoHIAvhcccN1H60QdO.4ETHYJrDwnvNqx29Zdhi8mDUOo.J.C', 'cajero');

-- Categorias
INSERT INTO categorias (nombre, descripcion) VALUES
('Bebidas',            'Agua pura, gaseosas, jugos y cafe'),
('Granos Basicos',     'Frijol, arroz, azucar y harina de maiz'),
('Abarrotes',          'Aceite, pastas, enlatados y condimentos'),
('Lacteos y Huevos',   'Leche, queso, crema y huevos'),
('Snacks y Dulces',    'Galletas, boquitas y golosinas'),
('Limpieza del Hogar', 'Detergentes, cloro y jabones para el hogar'),
('Cuidado Personal',   'Papel higienico, jabon y cuidado dental');

-- Productos (precios en GTQ)
INSERT INTO productos (codigo, nombre, descripcion, precio, stock, id_categoria, imagen_url) VALUES
('BEB-001', 'Agua Pura 600 ml',                 'Botella de agua purificada',              5.00,  120, 1, NULL),
('BEB-002', 'Gaseosa Cola 1.5 L',               'Bebida gaseosa sabor cola',               14.00, 60,  1, NULL),
('BEB-003', 'Jugo de Naranja 1 L',              'Jugo de naranja pasteurizado',            16.50, 35,  1, NULL),
('GRA-001', 'Frijol Negro 1 lb',                'Frijol negro seleccionado',               9.00,  90,  2, NULL),
('GRA-002', 'Arroz Blanco 1 lb',                'Arroz blanco grano largo',                6.50,  110, 2, NULL),
('GRA-003', 'Azucar Blanca 5 lb',               'Bolsa de azucar refinada',                24.00, 40,  2, NULL),
('GRA-004', 'Harina de Maiz 1 kg',              'Harina de maiz nixtamalizado',            12.00, 3,   2, NULL),
('ABA-001', 'Aceite Vegetal 1 L',               'Aceite vegetal para cocinar',             28.00, 30,  3, NULL),
('ABA-002', 'Pasta Spaghetti 200 g',            'Pasta de trigo tipo spaghetti',           4.50,  80,  3, NULL),
('ABA-003', 'Frijoles Volteados en Lata 400 g', 'Frijol negro volteado listo para servir', 11.00, 45,  3, NULL),
('ABA-004', 'Sal Yodada 1 kg',                  'Sal de mesa yodada',                      4.00,  50,  3, NULL),
('LAC-001', 'Leche Entera 1 L',                 'Leche entera ultrapasteurizada',          13.50, 24,  4, NULL),
('LAC-002', 'Huevos (carton 30)',               'Carton de 30 huevos',                     42.00, 4,   4, NULL),
('LAC-003', 'Queso Fresco 1 lb',                'Queso fresco artesanal',                  30.00, 12,  4, NULL),
('SNA-001', 'Galletas de Vainilla (paq 6)',     'Paquete de 6 galletas de vainilla',       10.00, 70,  5, NULL),
('SNA-002', 'Papalinas Clasicas 45 g',          'Papas fritas sabor natural',              5.50,  85,  5, NULL),
('SNA-003', 'Chocolate en Barra 50 g',          'Barra de chocolate con leche',            8.00,  55,  5, NULL),
('LIM-001', 'Detergente en Polvo 1 kg',         'Detergente para ropa',                    26.00, 28,  6, NULL),
('LIM-002', 'Jabon para Trastos 500 g',         'Jabon en pasta para trastos',             12.50, 36,  6, NULL),
('LIM-003', 'Cloro 1 L',                        'Blanqueador desinfectante',               9.50,  2,   6, NULL),
('CUI-001', 'Papel Higienico (paq 4)',          'Paquete de 4 rollos doble hoja',          18.00, 48,  7, NULL),
('CUI-002', 'Pasta Dental 100 ml',              'Crema dental con fluor',                  15.00, 33,  7, NULL);

-- Clientes
INSERT INTO clientes (nombre, correo, telefono, direccion) VALUES
('Cliente General',      NULL,                          NULL,        NULL),
('Maria Fernanda Lopez', 'mfernanda@example.com',       '5555-1234', 'Zona 1, Guatemala'),
('Comedor Dona Rosa',    'compras@comedordonarosa.com', '2222-9876', 'Zona 10, Guatemala'),
('Carlos Ramirez',       'cramirez@example.com',        '4444-5678', 'Mixco, Guatemala');

-- Ventas de ejemplo (para que el dashboard y reportes muestren datos)
INSERT INTO ventas (id_usuario, id_cliente, fecha, subtotal, descuento, total, estado) VALUES
(2, 2, DATE_SUB(NOW(), INTERVAL 20 DAY), 31.00,  0.00,  31.00,  'completada'),
(2, 1, DATE_SUB(NOW(), INTERVAL 12 DAY), 28.00,  0.00,  28.00,  'completada'),
(1, 3, DATE_SUB(NOW(), INTERVAL 5 DAY),  216.00, 10.00, 206.00, 'completada'),
(2, 4, DATE_SUB(NOW(), INTERVAL 2 DAY),  26.00,  0.00,  26.00,  'completada'),
(2, 1, DATE_SUB(NOW(), INTERVAL 1 DAY),  57.00,  0.00,  57.00,  'completada'),
(1, 2, NOW(),                            33.50,  0.00,  33.50,  'completada');

-- Detalle de las ventas de ejemplo (cada linea coincide con su cabecera)
INSERT INTO detalle_ventas (id_venta, id_producto, cantidad, precio_unitario, subtotal) VALUES
-- Venta 1 (frijol + arroz)
(1, 4,  2, 9.00,  18.00),
(1, 5,  2, 6.50,  13.00),
-- Venta 2 (aceite)
(2, 8,  1, 28.00, 28.00),
-- Venta 3 (Comedor: huevos + azucar + aceite, con descuento)
(3, 13, 2, 42.00, 84.00),
(3, 6,  2, 24.00, 48.00),
(3, 8,  3, 28.00, 84.00),
-- Venta 4 (detergente)
(4, 18, 1, 26.00, 26.00),
-- Venta 5 (leche + queso)
(5, 12, 2, 13.50, 27.00),
(5, 14, 1, 30.00, 30.00),
-- Venta 6 (gaseosas + papalinas)
(6, 2,  2, 14.00, 28.00),
(6, 16, 1, 5.50,  5.50);

-- Pagos en efectivo (monto = total de la venta)
INSERT INTO pagos (id_venta, monto, fecha) VALUES
(1, 31.00,  DATE_SUB(NOW(), INTERVAL 20 DAY)),
(2, 28.00,  DATE_SUB(NOW(), INTERVAL 12 DAY)),
(3, 206.00, DATE_SUB(NOW(), INTERVAL 5 DAY)),
(4, 26.00,  DATE_SUB(NOW(), INTERVAL 2 DAY)),
(5, 57.00,  DATE_SUB(NOW(), INTERVAL 1 DAY)),
(6, 33.50,  NOW());
