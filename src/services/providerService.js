
import { pool } from '../config/db.js';



export const getAll = async () => {
    const { rows } = await pool.query('SELECT * FROM supplier ORDER BY id ASC');
    return rows;
};

export const getById = async (id) => {
    const { rows } = await pool.query('SELECT * FROM supplier WHERE id = $1', [id]);
    return rows[0];
};

export const create = async (data) => {
    const { name, email } = data;

    if (!name || !email) {
        throw new Error('Los campos "name" y "email" son obligatorios');
    }

    const { rows } = await pool.query(
        'INSERT INTO supplier (name, email) VALUES ($1, $2) RETURNING *',
        [name, email]
    );
    return rows[0];
};

export const update = async (id, data) => {
    const { name, email } = data;

    if (!name || !email) {
        throw new Error('Los campos "name" y "email" son obligatorios');
    }

    const { rows } = await pool.query(
        'UPDATE supplier SET name = $1, email = $2 WHERE id = $3 RETURNING *',
        [name, email, id]
    );
    return rows[0];
};

export const remove = async (id) => {
    const { rowCount } = await pool.query('DELETE FROM supplier WHERE id = $1', [id]);
    return rowCount > 0;
};



/**
 * Obtiene estadísticas de un proveedor:
 * - Cantidad total de items vendidos
 * - Valor total del inventario asociado
 */
export const getSupplierStats = async (supplierId) => {
    const supplierQuery = `SELECT * FROM supplier WHERE id = $1`;
    const supplierRes = await pool.query(supplierQuery, [supplierId]);
    const supplier = supplierRes.rows[0];

    if (!supplier) return null;

    // Obtener estadísticas de ventas e inventario de este proveedor
    const statsQuery = `
        SELECT
            sup.id,
            sup.name,
            sup.email,
            COALESCE(SUM(sd.quantity), 0) AS total_items_sold,
            COALESCE(SUM(sd.quantity * ps.unit_price), 0) AS total_inventory_value,
            COUNT(DISTINCT s.code) AS total_orders,
            COUNT(DISTINCT p.product_sku) AS total_products
        FROM supplier sup
        LEFT JOIN product_supplier ps ON ps.supplier_id = sup.id
        LEFT JOIN product p ON p.product_sku = ps.product_sku
        LEFT JOIN sale_details sd ON sd.product_supplier_id = ps.id
        LEFT JOIN sale s ON s.code = sd.sale_code
        WHERE sup.id = $1
        GROUP BY sup.id, sup.name, sup.email
    `;

    const { rows } = await pool.query(statsQuery, [supplierId]);
    return rows[0] || null;
};

//top proveedores por items vendidos
export const getSuppliersSummary = async () => {
    const summaryQuery = `
        SELECT
            sup.id,
            sup.name,
            sup.email,
            COALESCE(SUM(sd.quantity), 0) AS total_items_sold,
            COALESCE(SUM(sd.quantity * ps.unit_price), 0) AS total_inventory_value,
            COUNT(DISTINCT s.code) AS total_orders,
            COUNT(DISTINCT p.product_sku) AS total_products
        FROM supplier sup
        LEFT JOIN product_supplier ps ON ps.supplier_id = sup.id
        LEFT JOIN product p ON p.product_sku = ps.product_sku
        LEFT JOIN sale_details sd ON sd.product_supplier_id = ps.id
        LEFT JOIN sale s ON s.code = sd.sale_code
        GROUP BY sup.id, sup.name, sup.email
        ORDER BY total_items_sold DESC, total_inventory_value DESC
    `;

    const { rows } = await pool.query(summaryQuery);

    // Transformar valores a números
    return rows.map(row => ({
        ...row,
        total_items_sold: parseInt(row.total_items_sold),
        total_inventory_value: parseFloat(row.total_inventory_value),
        total_orders: parseInt(row.total_orders),
        total_products: parseInt(row.total_products)
    }));
};

