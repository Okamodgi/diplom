const express = require('express');
const cors = require('cors');
const pool = require('./db.js');
const nodemailer = require('nodemailer');

const app = express();
const PORT = 3000;

app.use(express.json());

// Настройки SMTP (например, для Gmail или Mailtrap)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'sleepok00@gmail.com', // ваш email
        pass: 'bbxl humu nwgq rrex', // пароль или App Password (для Gmail)
    },
});

// Добавим более строгие настройки CORS
app.use(cors({
    origin: ['http://localhost', 'http://localhost:63342'], // Разрешаем оба origin
    methods: ['GET', 'POST', 'PUT', 'OPTIONS', 'DELETE'], // Добавляем OPTIONS для preflight
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));
// Добавление абитуриента (без подтверждения email)
app.post('/api/add-abiturient', async (req, res) => {
    try {
        const { snils, full_name, phone, email, attestat, specialities } = req.body;

        // Проверяем, что пользователь с таким СНИЛС еще не зарегистрирован
        const existingUser = await pool.query(
            'SELECT * FROM public.abiturients WHERE snils = $1',
            [snils]
        );

        if (existingUser.rowCount > 0) {
            return res.status(400).json({ error: 'Пользователь с таким СНИЛС уже зарегистрирован' });
        }

        // Начинаем транзакцию
        await pool.query('BEGIN');

        // Регистрируем пользователя
        const result = await pool.query(
            'INSERT INTO public.abiturients (fio, snils, number_t, attestat, email) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [full_name, snils, phone, attestat, email]
        );

        // Добавляем выбранные специальности
        if (specialities && specialities.length > 0) {
            for (const specId of specialities) {
                await pool.query(
                    'INSERT INTO public.abiturient_specialities (abiturient_snils, speciality_id) VALUES ($1, $2)',
                    [snils, specId]
                );
            }
        }

        // Завершаем транзакцию
        await pool.query('COMMIT');

        res.status(201).json({
            message: 'Абитуриент успешно добавлен',
            user: result.rows[0]
        });
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('Ошибка при добавлении абитуриента:', error.stack);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Добавим middleware для логирования входящих запросов
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    next();
});


// Тестовый роут
app.get('/api/message', (req, res) => {
    res.json({ message: 'Привет от сервера!' });
});

// Получение списка пользователей (для админки)
app.get('/api/users', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM public.abiturients');
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Ошибка при выполнении запроса:', error.stack);
        res.status(500).json({ error: 'Ошибка при получении пользователей' });
    }
});

// Получение списка пользователей
app.get('/api/specialities', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM public.lisct_spec');
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Ошибка при выполнении запроса:', error.stack);
        res.status(500).json({ error: 'Ошибка при получении специальностей' });
    }
});

// Получение всех абитуриентов для клиентского ранжирования
app.get('/api/all-applicants', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                fio,
                snils,
                number_t,
                attestat,
                spec1,
                spec2,
                spec3
            FROM abiturients
            ORDER BY attestat DESC
        `);

        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Ошибка при получении абитуриентов:', err.stack);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Проверка пользователя (авторизация)
app.post('/api/check-user', async (req, res) => {
    try {
        const { snils } = req.body;
        const queryResult = await pool.query(
            'SELECT * FROM public.abiturients WHERE snils = $1',
            [snils]
        );

        if (queryResult.rowCount > 0) {
            res.status(200).json({
                message: 'Пользователь найден',
                user: queryResult.rows[0] // Возвращаем данные пользователя
            });
        } else {
            res.status(404).json({ error: 'Пользователь не найден' });
        }
    } catch (error) {
        console.error('Ошибка при проверке пользователя:', error.stack);
        res.status(500).json({ error: 'Произошла внутренняя ошибка сервера' });
    }
});

// Получение данных для личного кабинета
app.get('/api/LK_abiturient/:snils', async (req, res) => {
    try {
        const { snils } = req.params;
        const result = await pool.query(
            `SELECT fio, snils, number_t, spec1, spec2, spec3
             FROM public.abiturients 
             WHERE snils = $1`,
            [snils]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Ошибка при получении данных:', error.stack);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Обновление данных в личном кабинете
app.put('/api/LK_abiturient/:snils', async (req, res) => {
    try {
        const { snils } = req.params;
        const { number_t } = req.body;

        // Валидация номера телефона
        if (!number_t || !/^[\d\+][\d\s\-\(\)]{7,15}$/.test(number_t)) {
            return res.status(400).json({ error: 'Неверный формат телефона' });
        }

        const result = await pool.query(
            `UPDATE public.abiturients 
             SET number_t = $1 
             WHERE snils = $2 
             RETURNING fio, snils, number_t`,
            [number_t, snils]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        res.status(200).json({
            message: 'Данные обновлены',
            user: result.rows[0]
        });
    } catch (error) {
        console.error('Ошибка при обновлении данных:', error.stack);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Аутентификация администратора
app.post('/auth/admin-login', async (req, res) => {
    try {
        const { login, password } = req.body;

        const result = await pool.query(
            'SELECT * FROM public.administrator WHERE login = $1 AND pass = $2',
            [login, password]
        );

        if (result.rowCount === 0) {
            return res.status(401).json({ error: 'Неверный логин или пароль' });
        }

        res.status(200).json({ message: 'Аутентификация успешна' });
    } catch (error) {
        console.error('Ошибка при аутентификации администратора:', error.stack);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Регистрация нового пользователя
app.post('/auth/register', async (req, res) => {
    try {
        const { snils, full_name, email, phone, attestat, specialities } = req.body;

        // Проверяем код подтверждения
        // const storedData = tempCodes.get(email);
        // if (!storedData || storedData.code !== verification_code) {
        //     return res.status(403).json({ error: 'Неверный код подтверждения' });
        // }

        // Проверяем, что данные совпадают с теми, для которых был отправлен код
        // if (storedData.snils !== snils || storedData.full_name !== full_name || storedData.phone !== phone) {
        //     return res.status(400).json({ error: 'Данные не совпадают с отправленными на подтверждение' });
        // }

        // Проверяем, что пользователь с таким СНИЛС еще не зарегистрирован
        const existingUser = await pool.query(
            'SELECT * FROM public.abiturients WHERE snils = $1',
            [snils]
        );

        if (existingUser.rowCount > 0) {
            return res.status(400).json({ error: 'Пользователь с таким СНИЛС уже зарегистрирован' });
        }

        // Начинаем транзакцию
        await pool.query('BEGIN');

        // Регистрируем пользователя
        const result = await pool.query(
            'INSERT INTO public.abiturients (fio, snils, number_t, attestat, spec1, spec2, spec3) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [full_name, snils, phone, attestat, specialities[0], specialities[1], specialities[2]]
        );


        // Завершаем транзакцию
        await pool.query('COMMIT');

        res.status(201).json({
            message: 'Регистрация успешно завершена',
            user: result.rows[0]
        });
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('Ошибка при регистрации:', error.stack);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Удаление абитуриента
app.delete('/api/delete-abiturient/:snils', async (req, res) => {
    try {
        const { snils } = req.params;

        const result = await pool.query(
            'DELETE FROM public.abiturients WHERE snils = $1',
            [snils]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Абитуриент не найден' });
        }

        res.status(200).json({ message: 'Абитуриент успешно удален' });
    } catch (error) {
        console.error('Ошибка при удалении абитуриента:', error.stack);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});


// Запуск сервера
app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});