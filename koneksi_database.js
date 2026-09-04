const sql = require('mssql');

const config = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || 'password_kamu',
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_NAME || 'nama_db_kamu',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

const poolPromise = new sql.ConnectionPool(config)
    .connect()
    .then(pool => {
        console.log('Terhubung ke Database SQL');
        return pool;
    })
    .catch(err => {
        console.log('Gagal konek database (Abaikan jika di Vercel tanpa DB Cloud):', err.message);
        return null; 
    });

module.exports = {
    sql, poolPromise
};