const mysql = require('mysql2/promise');
require('dotenv').config();

// Crear el pool de conexiones
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '0000',
    database: process.env.DB_NAME || 'gestion_creditos',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

// Función para probar la conexión
const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('Conectado a MySQL correctamente');
        connection.release();
        return true;
    } catch (error) {
        console.error('Error conectando a MySQL:', error.message);
        console.error('Verifica que MySQL esté corriendo y los datos en .env sean correctos');
        return false;
    }
};

module.exports = { pool, testConnection };