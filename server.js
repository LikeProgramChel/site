const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000; // Вы можете выбрать другой порт

// Middleware для парсинга JSON-тела запросов
app.use(bodyParser.json());
// Middleware для обработки CORS (если ваш фронтенд на другом домене/порту)
app.use((req, res, next) => {
    // В реальном проекте указывайте конкретный домен фронтенда вместо '*'
    res.header('Access-Control-Allow-Origin', '*'); 
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

const usersFilePath = path.join(__dirname, 'users.json');

// Эндпоинт для регистрации нового пользователя
app.post('/api/register', (req, res) => {
    const newUser = req.body;

    fs.readFile(usersFilePath, 'utf8', (err, data) => {
        if (err && err.code !== 'ENOENT') { // ENOENT означает "файл не найден", это нормально для первого запуска
            console.error('Ошибка чтения users.json:', err);
            return res.status(500).json({ message: 'Ошибка сервера при чтении данных.' });
        }

        let users = [];
        if (data) {
            try {
                users = JSON.parse(data);
            } catch (parseError) {
                console.error('Ошибка парсинга users.json:', parseError);
                return res.status(500).json({ message: 'Ошибка сервера при обработке данных.' });
            }
        }

        // Проверка, существует ли пользователь с таким email
        if (users.some(u => u.email === newUser.email)) {
            return res.status(409).json({ message: 'Пользователь с таким email уже существует.' });
        }

        // Присваиваем ID и дату регистрации
        newUser.id = Date.now();
        newUser.joined = new Date().toLocaleDateString();

        users.push(newUser);

        fs.writeFile(usersFilePath, JSON.stringify(users, null, 4), 'utf8', (writeErr) => {
            if (writeErr) {
                console.error('Ошибка записи users.json:', writeErr);
                return res.status(500).json({ message: 'Ошибка сервера при сохранении данных.' });
            }
            res.status(201).json({ message: 'Пользователь успешно зарегистрирован!', user: newUser });
        });
    });
});

// Эндпоинт для входа пользователя
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    fs.readFile(usersFilePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ message: 'Ошибка сервера при чтении данных.' });
        }

        let users = [];
        try {
            users = JSON.parse(data);
        } catch (parseError) {
            return res.status(500).json({ message: 'Ошибка сервера при обработке данных.' });
        }

        const user = users.find(u => u.email === email && u.password === password);

        if (user) {
            // В реальном приложении здесь бы использовались JWT-токены или сессии
            res.status(200).json({ message: 'Вход успешен!', user: user });
        } else {
            res.status(401).json({ message: 'Неверный email или пароль.' });
        }
    });
});

// Эндпоинт для получения пользователей (для отладки, в продакшене не всегда нужен)
app.get('/api/users', (req, res) => {
    fs.readFile(usersFilePath, 'utf8', (err, data) => {
        if (err && err.code !== 'ENOENT') {
            return res.status(500).json({ message: 'Ошибка сервера.' });
        }
        res.status(200).json(data ? JSON.parse(data) : []);
    });
});


// Обслуживание статических файлов фронтенда
// Убедитесь, что эта строка находится после ваших API-эндпоинтов
// Предполагается, что ваши index.html, studio.html, styles.css, scripts.js
// находятся в папке `public` или прямо в корне проекта рядом с `server.js`
app.use(express.static(path.join(__dirname, ''))); // Обслуживаем файлы из текущей директории

app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
    console.log(`Ваш сайт доступен по адресу: http://localhost:${PORT}/index.html`);
});