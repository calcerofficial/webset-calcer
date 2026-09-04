const sql = require('mssql');

const dbConfig = {
    user: 'sa',                       // Username SQL Server kamu
    password: 'PasswordAnda123',     // Password SQL Server kamu
    server: 'localhost',              // Server / Instance SQL Server
    database: 'calcer_official',       // Nama database
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

// Inisialisasi koneksi pool
const poolPromise = new sql.ConnectionPool(dbConfig)
    .connect()
    .then(pool => {
        console.log('Berhasil terhubung ke SQL Server (calcer_official)');
        return pool;
    })
    .catch(err => {
        console.error('Gagal terhubung ke database:', err);
        process.exit(1);
    });

module.exports = {
    sql,
    poolPromise
};