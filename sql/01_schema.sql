DROP TABLE IF EXISTS sale CASCADE;
DROP TABLE IF EXISTS product_supplier CASCADE;
DROP TABLE IF EXISTS supplier CASCADE;
DROP TABLE IF EXISTS customer CASCADE;
DROP TABLE IF EXISTS product CASCADE;
DROP TABLE IF EXISTS category CASCADE;

-- Creación de tablas finales
CREATE TABLE category (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL );

CREATE TABLE supplier (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL
);

CREATE TABLE customer (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(150) NOT NULL,
    last_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(30),
    address TEXT
);

CREATE TABLE product (
    product_sku VARCHAR(20) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    category_id INT NOT NULL,
    CONSTRAINT fk_product_category FOREIGN KEY (category_id) REFERENCES category(id)
);

CREATE TABLE product_supplier (
    unit_price DECIMAL(10,2) NOT NULL,
    product_sku VARCHAR(20) NOT NULL,
    supplier_id INT NOT NULL,
    PRIMARY KEY (product_sku, supplier_id),
    CONSTRAINT fk_product FOREIGN KEY (product_sku) REFERENCES product(product_sku) ON DELETE CASCADE,
    CONSTRAINT fk_supplier FOREIGN KEY (supplier_id) REFERENCES supplier(id) ON DELETE CASCADE
);

CREATE TABLE sale (
    id VARCHAR(20) PRIMARY KEY,
    customer_id INT NOT NULL,
    supplier_id INT NOT NULL,
    date TIMESTAMP NOT NULL,
    total_price NUMERIC(12,2) NOT NULL CHECK (total_price >= 0),
    product_sku VARCHAR(20) NOT NULL,
    quantity INT NOT NULL CHECK (quantity >= 0),
    CONSTRAINT fk_product_supplier FOREIGN KEY (product_sku, supplier_id) REFERENCES product_supplier(product_sku, supplier_id),
    CONSTRAINT fk_customer FOREIGN KEY (customer_id) REFERENCES customer(id)

);