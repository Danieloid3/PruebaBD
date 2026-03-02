// javascript
// src/config/db.js
import pg from 'pg';
import 'dotenv/config';
import { createReadStream } from 'fs';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { parse } from 'csv-parse';

const { Pool } = pg;

const {
    DATABASE_URL,
    PGLOCAL_USER,
    PGLOCAL_PASSWORD,
    PGLOCAL_DB,
    PGLOCAL_HOST,
    PGLOCAL_PORT
} = process.env;

const createPool = ({ connectionString, ssl }) => {
    const pool = new Pool({ connectionString, ssl });

    pool.on('error', (err) => {
        console.error('❌ Error en el pool de Postgres:', err);
    });

    return pool;
};

let pool;
let isLocal = false;

// \[1] Cargar CSV a staging\_saludplus en modo LOCAL (sin COPY)
const loadStagingFromCsv = async () => {
    return new Promise((resolve, reject) => {
        const csvPath = join(process.cwd(), 'sql', 'staging_megastore.csv');
        const stream = createReadStream(csvPath);

        const parser = parse({
            columns: true,
            skip_empty_lines: true,
            trim: true
        });

        const rows = [];

        parser.on('readable', () => {
            let record;
            // leemos todo en memoria (para CSV moderado está bien)
            while ((record = parser.read()) !== null) {
                rows.push(record);
            }
        });

        parser.on('error', (err) => {
            reject(err);
        });

        parser.on('end', async () => {
            console.log(`📥 CSV leído. Filas: ${rows.length}`);


            const insertQuery = `
                INSERT INTO staging_megastore (
                    transaction_id,
                    date,
                    customer_name,
                    customer_email,
                    customer_address,
                    customer_phone,
                    product_category,
                    product_sku,
                    product_name,
                    unit_price,
                    quantity,
                    total_line_value,
                    supplier_name,
                    supplier_email
                ) VALUES (
                    $1,$2,$3,$4,$5,
                    $6,$7,$8,$9,$10,
                    $11,$12,$13,$14
                )
            `;

            try {
                // transacción para meter todo
                await pool.query('BEGIN');

                for (const r of rows) {
                    await pool.query(insertQuery, [
                        r.transaction_id,
                        r.date,
                        r.customer_name || r.customer,
                        r.customer_email,
                        r.customer_address,
                        r.customer_phone,
                        r.product_category,
                        r.product_sku,
                        r.product_name,
                        r.unit_price,
                        r.quantity,
                        r.total_line_value,
                        r.supplier_name,
                        r.supplier_email
                    ]);
                }

                await pool.query('COMMIT');
                console.log('✅ Datos de CSV cargados en staging_megastore (LOCAL)');
                resolve();
            } catch (err) {
                await pool.query('ROLLBACK');
                reject(err);
            }
        });

        stream.pipe(parser);
    });
};

// [2] Crear tabla staging y cargar CSV solo en LOCAL
const initLocalStaging = async () => {
    try {
        console.log('📄 Preparando tabla staging_megastore en LOCAL...');

        // 1. Crear tabla staging desde SQL
        const stagingSchemaPath = join(process.cwd(), 'sql', '00_staging_schema.sql');
        const stagingSchemaSql = await readFile(stagingSchemaPath, 'utf8');
        await pool.query(stagingSchemaSql);

        // 2. Vaciar staging (por si ya tenía datos)
        await pool.query('TRUNCATE TABLE staging_megastore');

        // 3. Cargar CSV mediante Node
        await loadStagingFromCsv();
    } catch (err) {
        console.error('❌ Error inicializando staging_megastore LOCAL:', err.message);
        throw err;
    }
};

const initPool = async () => {
    // 1. Intentar CLOUD
    if (DATABASE_URL && DATABASE_URL.trim() !== '') {
        try {
            console.log('🌐 Intentando conexión a Postgres CLOUD...');
            const cloudPool = createPool({
                connectionString: DATABASE_URL,
                ssl: { rejectUnauthorized: false }
            });
            await cloudPool.query('SELECT 1');
            console.log('🟢 Usando Postgres CLOUD');
            pool = cloudPool;
            isLocal = false;
            return;
        } catch (err) {
            console.error('⚠️ Falló conexión a Postgres CLOUD, usando LOCAL. Detalle:', err.message);
        }
    }

    // 2. Fallback a LOCAL
    const localConnectionString =
        `postgresql://${PGLOCAL_USER || 'postgres'}:${PGLOCAL_PASSWORD || 'postgres'}` +
        `@${PGLOCAL_HOST || 'localhost'}:${PGLOCAL_PORT || 5432}/${PGLOCAL_DB || 'saludplus'}`;

    console.log('🟠 Intentando conexión a Postgres LOCAL:', localConnectionString);

    const localPool = createPool({
        connectionString: localConnectionString,
        ssl: false
    });

    try {
        await localPool.query('SELECT 1');
        console.log('🟠 Usando Postgres LOCAL');
        pool = localPool;
        isLocal = true;

        // Inicializar staging solo en LOCAL
        await initLocalStaging();
    } catch (err) {
        console.error('❌ No se pudo conectar ni a Postgres CLOUD ni a LOCAL:', err.message);
        throw err;
    }
};

// Importante: top-level await en módulo ES
await initPool();

export { pool, isLocal };
