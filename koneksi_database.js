const mysql = require('mysql2/promise');

const config = {
    host: process.env.DB_HOST || 'mysql-1f1fa4c3-nabilkeceebet-ca32.l.aivencloud.com',
    port: process.env.DB_PORT || 16335,
    user: process.env.DB_USER || 'avnadmin',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'calcer_official',
    ssl: {
        rejectUnauthorized: false
    },
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000
};

const poolPromise = mysql.createPool(config);

poolPromise.getConnection()
    .then(connection => {
        console.log('Berhasil terhubung ke Aiven MySQL Cloud!');
        connection.release();
    })
    .catch(err => {
        console.log('Gagal konek ke Aiven MySQL:', err.message);
    });

module.exports = { poolPromise };