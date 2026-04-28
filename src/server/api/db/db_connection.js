const mysql = require('mysql2');

const pool = mysql.createPool({
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    waitForConnections: true,  // If all connections are used, wait instead of throwing an error
    connectionLimit: 10,       // Maximum number of connections in the pool
    queueLimit: 0              // Unlimited queries can queue up (0 means no limit)
});

// Export as a promise-based pool for easy async/await use
module.exports = pool.promise();