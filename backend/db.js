const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'Abiturients',
    password: '1113',
    port: 5432,
});

async function checkConnection() {
    try {
        await pool.connect();
        console.log('Подключение к базе данных успешно установлено!');
    } catch (err) {
        console.error('Ошибка подключения к базе данных:', err.message);
    }
}

async function ensureIndexes() {
    await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_abiturients_snils 
        ON abiturients(snils)
    `);
}

ensureIndexes();

checkConnection();

async function checkIndexes() {
    const res = await pool.query(`
        SELECT indexname 
        FROM pg_indexes 
        WHERE tablename = 'abiturients'
          AND indexdef LIKE '%snils%'
    `);
    console.log('Индексы для snils:', res.rows);
}
checkIndexes();

module.exports = pool;