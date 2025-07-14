const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const multer = require('multer'); // Для обработки загрузки файлов

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());
app.use((req, res, next) => {
    // Указываем конкретный домен для безопасности
    res.header('Access-Control-Allow-Origin', '*'); // Для отладки можно временно оставить '*', потом поменять на 'https://impuls21.ru'
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

const usersFilePath = path.join(__dirname, 'users.json');
const videosFilePath = path.join(__dirname, 'videos.json');

// --- РЕГИСТРАЦИЯ И АУТЕНТИФИКАЦИЯ ---

app.post('/api/register', (req, res) => {
    console.log('Запрос на /api/register с телом:', req.body);
    const newUser = req.body;

    fs.readFile(usersFilePath, 'utf8', (err, data) => {
        if (err && err.code !== 'ENOENT') {
            console.error('Ошибка чтения users.json:', err);
            return res.status(500).json({ message: 'Ошибка сервера при чтении данных.' });
        }

        let users = data ? JSON.parse(data) : [];

        if (users.some(u => u.email === newUser.email)) {
            console.log(`Регистрация отклонена: email ${newUser.email} уже существует.`);
            return res.status(409).json({ message: 'Пользователь с таким email уже существует.' });
        }

        newUser.id = Date.now();
        newUser.joined = new Date().toLocaleDateString();
        
        users.push(newUser);

        fs.writeFile(usersFilePath, JSON.stringify(users, null, 2), 'utf8', (writeErr) => {
            if (writeErr) {
                console.error('Ошибка записи в users.json:', writeErr);
                return res.status(500).json({ message: 'Ошибка сервера при сохранении данных.' });
            }
            console.log(`Пользователь ${newUser.name} успешно зарегистрирован.`);
            res.status(201).json({ message: 'Пользователь успешно зарегистрирован!', user: newUser });
        });
    });
});

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    fs.readFile(usersFilePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ message: 'Ошибка сервера.' });
        }
        let users = [];
        try {
            users = JSON.parse(data);
        } catch (e) {
             return res.status(500).json({ message: 'Ошибка обработки данных на сервере.' });
        }
        const user = users.find(u => u.email === email && u.password === password);
        if (user) {
            res.status(200).json({ message: 'Вход успешен!', user: user });
        } else {
            res.status(401).json({ message: 'Неверный email или пароль.' });
        }
    });
});

app.get('/api/users', (req, res) => {
    fs.readFile(usersFilePath, 'utf8', (err, data) => {
        if (err && err.code !== 'ENOENT') {
            return res.status(500).json({ message: 'Ошибка сервера.' });
        }
        res.status(200).json(data ? JSON.parse(data) : []);
    });
});


// --- ЗАГРУЗКА И ПОЛУЧЕНИЕ ВИДЕО ---

// 1. Настройка хранилища для превью
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Папка для сохранения файлов
    },
    filename: function (req, file, cb) {
        // Уникальное имя файла
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// 2. Эндпоинт для загрузки видео (превью + данные)
app.post('/api/upload', upload.single('thumbnail'), (req, res) => {
    const { title, description, channel } = req.body;

    if (!req.file) {
        return res.status(400).json({ message: 'Файл превью не был загружен.' });
    }

    fs.readFile(videosFilePath, 'utf8', (err, data) => {
        if (err && err.code !== 'ENOENT') {
            return res.status(500).json({ message: 'Ошибка сервера при чтении видео.' });
        }

        let videos = data ? JSON.parse(data) : [];

        const newVideo = {
            id: Date.now(),
            title: title,
            description: description,
            channel: channel,
            duration: `${Math.floor(Math.random() * 10)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
            thumbnail: `/uploads/${req.file.filename}`, // Путь к файлу на сервере
            views: "0",
            date: "Только что",
            status: "Доступно"
        };

        videos.unshift(newVideo);

        fs.writeFile(videosFilePath, JSON.stringify(videos, null, 2), 'utf8', (writeErr) => {
            if (writeErr) {
                console.error('Ошибка записи в videos.json:', writeErr);
                return res.status(500).json({ message: 'Ошибка сервера при сохранении видео.' });
            }
            console.log(`Видео "${title}" успешно загружено.`);
            res.status(201).json({ message: 'Видео успешно загружено!', video: newVideo });
        });
    });
});

// 3. Эндпоинт для получения всех видео
app.get('/api/videos', (req, res) => {
    fs.readFile(videosFilePath, 'utf8', (err, data) => {
        if (err && err.code !== 'ENOENT') {
            return res.status(500).json({ message: 'Ошибка сервера.' });
        }
        res.status(200).json(data ? JSON.parse(data) : []);
    });
});

// Обслуживание статических файлов
app.use(express.static(path.join(__dirname, '')));
// Обслуживание загруженных файлов из папки /uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});
