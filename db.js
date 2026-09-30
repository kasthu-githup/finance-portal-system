const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

pool.on("connect", () => {
    console.log("Neon PostgreSQL connected successfully");
});

pool.on("error", (error) => {
    console.error("PostgreSQL error:", error.message);
});

module.exports = pool;