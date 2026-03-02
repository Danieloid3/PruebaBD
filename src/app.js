// src/app.js
import express from 'express';
import cors from 'cors';
import 'dotenv/config';

// Importar conexión a MongoDB
import { connectMongo } from './mongo/connection.js';

// Rutas
import adminRoutes from './routes/adminRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import providerRoutes from './routes/providerRoutes.js';

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Healthcheck
app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
});

// Routes
app.use('/api/admin', adminRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/suppliers', providerRoutes);

// Manejo de 404
app.use((req, res) => {
    res.status(404).json({ message: 'Ruta no encontrada' });
});

// Manejo de errores (centralizado)
app.use((err, _req, res, _next) => {
    const status = err.statusCode || err.status || 500;
    console.error(err); // Es útil ver el error en consola
    res.status(status).json({
        error: err.message || 'Error interno del servidor'
    });
});

// Start Server
const PORT = process.env.PORT || 3000;

const startServer = async () => {
    try {
        // Conectar a Mongo antes de levantar el servidor
        await connectMongo();

        app.listen(PORT, () => {
            console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Error al iniciar el servidor:', error);
        process.exit(1);
    }
};

startServer();

export default app;
