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
        console.log('Подключение к базе данных успешно установлено.');
    } catch (err) {
        console.error('Ошибка подключения к базе данных:', err.message);
    }
}

checkConnection();

module.exports = pool;