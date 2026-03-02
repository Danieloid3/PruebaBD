
INSERT INTO category (name)
SELECT DISTINCT product_category
FROM staging_megastore
WHERE product_category IS NOT NULL AND product_category != ''
ON CONFLICT (name) DO NOTHING;


-- 2. NORMALIZAR PROVEEDORES

INSERT INTO supplier (name, email)
SELECT DISTINCT supplier_name, supplier_email
FROM staging_megastore
WHERE supplier_name IS NOT NULL AND supplier_name != ''
  AND supplier_email IS NOT NULL AND supplier_email != ''
ON CONFLICT (email) DO NOTHING;


-- 3. NORMALIZAR CLIENTES

INSERT INTO customer (first_name, last_name, email, phone, address)
SELECT DISTINCT
    COALESCE(SPLIT_PART(customer_name, ' ', 1), 'Unknown') as first_name,
    COALESCE(NULLIF(SPLIT_PART(customer_name, ' ', 2), ''), SPLIT_PART(customer_name, ' ', 1)) as last_name,
    customer_email,
    customer_phone,
    customer_address
FROM staging_megastore
WHERE customer_name IS NOT NULL AND customer_name != ''
  AND customer_email IS NOT NULL AND customer_email != ''
ON CONFLICT (email) DO NOTHING;


-- 4. NORMALIZAR PRODUCTOS

INSERT INTO product (product_sku, product_name, product_price, product_category_id)
SELECT DISTINCT
    s.product_sku,
    s.product_name,
    s.unit_price,
    c.id as product_category_id
FROM staging_megastore s
INNER JOIN category c ON c.name = s.product_category
WHERE s.product_sku IS NOT NULL AND s.product_sku != ''
  AND s.product_name IS NOT NULL AND s.product_name != ''
ON CONFLICT (product_sku) DO NOTHING;


-- 5. NORMALIZAR RELACIÓN PRODUCTO-PROVEEDOR

INSERT INTO product_supplier (product_sku, supplier_id, unit_price)
SELECT DISTINCT
    s.product_sku,
    sup.id as supplier_id,
    s.unit_price
FROM staging_megastore s
INNER JOIN supplier sup ON sup.email = s.supplier_email
WHERE s.product_sku IS NOT NULL AND s.product_sku != ''
  AND s.supplier_email IS NOT NULL AND s.supplier_email != ''
ON CONFLICT (product_sku, supplier_id) DO NOTHING;

-- 6. NORMALIZAR VENTAS

INSERT INTO sale (code, date, customer_id, total)
SELECT
    s.transaction_id as code,
    s.date::DATE as date,
    c.id as customer_id,
    SUM(s.total_line_value) as total
FROM staging_megastore s
INNER JOIN customer c ON c.email = s.customer_email
WHERE s.transaction_id IS NOT NULL AND s.transaction_id != ''
  AND s.date IS NOT NULL
  AND s.customer_email IS NOT NULL AND s.customer_email != ''
GROUP BY s.transaction_id, s.date::DATE, c.id
ON CONFLICT (code) DO NOTHING;


-- 7. NORMALIZAR DETALLES DE VENTAS

INSERT INTO sale_details (sale_code, product_supplier_id, quantity, subtotal)
SELECT
    s.transaction_id as sale_code,
    ps.id as product_supplier_id,
    s.quantity,
    s.total_line_value as subtotal
FROM staging_megastore s
INNER JOIN product_supplier ps ON ps.product_sku = s.product_sku
  AND ps.supplier_id = (
    SELECT id FROM supplier WHERE email = s.supplier_email
  )
WHERE s.transaction_id IS NOT NULL AND s.transaction_id != ''
  AND s.product_sku IS NOT NULL AND s.product_sku != ''
  AND s.supplier_email IS NOT NULL AND s.supplier_email != ''
  AND s.quantity > 0
ON CONFLICT (sale_code, product_supplier_id) DO NOTHING;


-- RESUMEN Y VALIDACIÓN

SELECT
    '✅ NORMALIZACIÓN COMPLETADA' as status,
    (SELECT COUNT(*) FROM category) as total_categorias,
    (SELECT COUNT(*) FROM supplier) as total_proveedores,
    (SELECT COUNT(*) FROM customer) as total_clientes,
    (SELECT COUNT(*) FROM product) as total_productos,
    (SELECT COUNT(*) FROM product_supplier) as total_relaciones_producto_proveedor,
    (SELECT COUNT(*) FROM sale) as total_ventas,
    (SELECT COUNT(*) FROM sale_details) as total_detalles_ventas;

