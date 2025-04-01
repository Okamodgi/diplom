const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors()); // Разрешаем CORS для фронтенда
app.use(express.json());

app.get('/api/message', (req, res) => {
    res.json({ message: 'Привет от сервера!' });
});

app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});
