DROP TABLE IF EXISTS sale_details CASCADE;
DROP TABLE IF EXISTS sale CASCADE;
DROP TABLE IF EXISTS product_supplier CASCADE;
DROP TABLE IF EXISTS supplier CASCADE;
DROP TABLE IF EXISTS customer CASCADE;
DROP TABLE IF EXISTS product CASCADE;
DROP TABLE IF EXISTS category CASCADE;

-- Tabla de categorías
CREATE TABLE IF NOT EXISTS category (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL UNIQUE
    );

-- Tabla de proveedores
CREATE TABLE IF NOT EXISTS supplier (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE
    );

-- Tabla de clientes
CREATE TABLE IF NOT EXISTS customer (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(150) NOT NULL,
    last_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL UNIQUE,
    address TEXT
    );

-- Tabla de productos
CREATE TABLE IF NOT EXISTS product (
    product_sku VARCHAR(150) PRIMARY KEY,
    product_name VARCHAR(150) NOT NULL,
    product_price DECIMAL(10,2) NOT NULL CHECK (product_price > 0),
    product_category_id INT NOT NULL REFERENCES category(id)
    );

-- Tabla relacional: producto-proveedor
CREATE TABLE IF NOT EXISTS product_supplier (
    id SERIAL PRIMARY KEY,
    product_sku VARCHAR(150) NOT NULL REFERENCES product(product_sku) ON DELETE CASCADE,
    supplier_id INT NOT NULL REFERENCES supplier(id) ON DELETE CASCADE,
    unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price > 0),
    CONSTRAINT product_supplier_unique UNIQUE (product_sku, supplier_id)
    );

-- Tabla de ventas
CREATE TABLE IF NOT EXISTS sale(
    code VARCHAR(20) PRIMARY KEY,
    date DATE NOT NULL,
    customer_id INT NOT NULL REFERENCES customer(id) ON DELETE RESTRICT,
    total DECIMAL(10,2) NOT NULL CHECK (total > 0)
    );

-- Tabla de detalles de ventas
CREATE TABLE IF NOT EXISTS sale_details (
    id SERIAL PRIMARY KEY,
    sale_code VARCHAR(20) NOT NULL REFERENCES sale(code) ON DELETE CASCADE,
    product_supplier_id INT NOT NULL REFERENCES product_supplier(id),
    quantity INT NOT NULL CHECK (quantity > 0),
    subtotal DECIMAL(10,2) NOT NULL CHECK (subtotal > 0),
    CONSTRAINT sale_details_unique UNIQUE (sale_code, product_supplier_id)
    );

