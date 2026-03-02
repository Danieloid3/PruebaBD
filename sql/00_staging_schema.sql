
CREATE TABLE IF NOT EXISTS staging_megastore (

    transaction_id VARCHAR(50),
    date TIMESTAMP,
    customer_name TEXT,
    customer_email TEXT,
    customer_address TEXT,
    customer_phone TEXT,
    customer_email TEXT,
    product_category TEXT,
    product_sku VARCHAR(50),
    product_name TEXT,
    unit_price NUMERIC(12,2),
    quantity INTEGER,
    total_line_value NUMERIC(12,2),
    supplier_name TEXT,
    supplier_email TEXT,

    );
