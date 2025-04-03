const express = require('express');
const cors = require('cors');
const pool = require('./db.js');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.get('/api/message', (req, res) => {
    res.json({ message: 'Привет от сервера!' });
});

app.get('/api/users', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM users');
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Ошибка при выполнении запроса:', error.stack);
        res.status(500).json({ error: 'Ошибка при получении пользователей' });
    }
});
app.post('/api/check-user', async (req, res) => {
    try {
        const { snils } = req.body;

        // Проверяем, существует ли пользователь с таким СНИЛС в таблице users
        const queryResult = await pool.query('SELECT * FROM users WHERE snils=$1', [snils]);

        if (queryResult.rowCount > 0) {
            // Пользователь найден
            res.status(200).json({ message: 'Пользователь найден' });
        } else {
            // Пользователь не найден
            res.status(404).json({ error: 'Пользователь не найден' });
        }
    } catch (error) {
        console.error('Ошибка при проверке пользователя:', error.stack);
        res.status(500).json({ error: 'Произошла внутренняя ошибка сервера' });
    }
});
app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});