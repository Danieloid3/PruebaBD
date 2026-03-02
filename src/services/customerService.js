// src/services/customerService.js
import { pool } from '../config/db.js';

// --- Funciones CRUD Básicas de SQL ---

export const getAll = async () => {
    const { rows } = await pool.query('SELECT * FROM customer ORDER BY id ASC');
    return rows;
};

export const getById = async (id) => {
    const { rows } = await pool.query('SELECT * FROM customer WHERE id = $1', [id]);
    return rows[0];
};

export const create = async (data) => {
    const { first_name, last_name, email, phone, address } = data;
    const { rows } = await pool.query(
        'INSERT INTO customer (first_name, last_name, email, phone, address) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [first_name, last_name, email, phone, address]
    );
    return rows[0];
};

export const update = async (id, data) => {
    const { first_name, last_name, email, phone, address } = data;
    const { rows } = await pool.query(
        'UPDATE customer SET first_name = $1, last_name = $2, email = $3, phone = $4, address = $5 WHERE id = $6 RETURNING *',
        [first_name, last_name, email, phone, address, id]
    );
    return rows[0];
};

export const remove = async (id) => {
    const { rowCount } = await pool.query('DELETE FROM customer WHERE id = $1', [id]);
    return rowCount > 0;
};

// --- Funciones Nuevas para Sincronización con Mongo ---

// Obtiene todos los IDs para poder iterar sobre ellos en el proceso masivo
export const getAllCustomersIds = async () => {
    const { rows } = await pool.query('SELECT id FROM customer');
    return rows.map(r => r.id);
};

// Construye el objeto completo (Cliente + Array de Ventas)
export const getFullCustomerHistory = async (customerId) => {
    // 1. Obtener datos del cliente
    const customerQuery = `SELECT * FROM customer WHERE id = $1`;
    const customerRes = await pool.query(customerQuery, [customerId]);
    const customerData = customerRes.rows[0];

    if (!customerData) return null;

    // 2. Obtener TODAS las ventas de este cliente con joins para traer detalles
    const salesQuery = `
        SELECT
            s.code            AS sale_code,
            s.date,
            s.total,
            sd.id             AS detail_id,
            sd.quantity,
            sd.subtotal,
            p.product_sku,
            p.product_name,
            p.product_price,
            c.name            AS category_name,
            sup.id            AS supplier_id,
            sup.name          AS supplier_name,
            sup.email         AS supplier_email,
            ps.unit_price
        FROM sale s
        LEFT JOIN sale_details sd ON sd.sale_code = s.code
        LEFT JOIN product_supplier ps ON ps.id = sd.product_supplier_id
        LEFT JOIN product p ON p.product_sku = ps.product_sku
        LEFT JOIN category c ON c.id = p.product_category_id
        LEFT JOIN supplier sup ON sup.id = ps.supplier_id
        WHERE s.customer_id = $1
        ORDER BY s.date DESC
    `;

    const salesRes = await pool.query(salesQuery, [customerId]);

    // 3. Agrupar detalles por venta
    const salesMap = new Map();

    for (const row of salesRes.rows) {
        if (!salesMap.has(row.sale_code)) {
            salesMap.set(row.sale_code, {
                sale_code: row.sale_code,
                date: row.date,
                total: Number(row.total),
                details: []
            });
        }

        if (row.detail_id) {
            salesMap.get(row.sale_code).details.push({
                detail_id: row.detail_id,
                quantity: row.quantity,
                subtotal: Number(row.subtotal),
                product: {
                    sku: row.product_sku,
                    name: row.product_name,
                    price: Number(row.product_price),
                    category: row.category_name
                },
                supplier: {
                    id: row.supplier_id,
                    name: row.supplier_name,
                    email: row.supplier_email,
                    unit_price: Number(row.unit_price)
                }
            });
        }
    }

    const sales = Array.from(salesMap.values());

    return {
        customerId: customerData.id,
        firstName: customerData.first_name,
        lastName: customerData.last_name,
        email: customerData.email,
        phone: customerData.phone,
        address: customerData.address,
        totalSales: sales.length,
        history: sales
    };
};
