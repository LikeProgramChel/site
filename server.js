const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = 3000;

// --- ИНИЦИАЛИЗАЦИЯ БАЗЫ ДАННЫХ ---
const dbPath = path.join(__dirname, 'chebtube.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        return console.error('Ошибка подключения к SQLite:', err.message);
    }
    console.log('Успешное подключение к базе данных SQLite.');
    db.serialize(() => {
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            joined TEXT NOT NULL,
            isAdmin BOOLEAN NOT NULL DEFAULT 0
        )`);
        
        db.run(`CREATE TABLE IF NOT EXISTS videos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            channel TEXT NOT NULL,
            duration TEXT NOT NULL,
            thumbnail TEXT NOT NULL,
            videoUrl TEXT NOT NULL,
            views TEXT NOT NULL,
            date TEXT NOT NULL,
            status TEXT NOT NULL
        )`);
    });
});

// --- Middleware ---
app.use(bodyParser.json());
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, x-user-id');
    next();
});

// --- НАСТРОЙКА UPLOAD ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let dest = file.fieldname === 'thumbnail' ? 'uploads/thumbnails' : 'uploads/videos';
        fs.mkdirSync(dest, { recursive: true });
        cb(null, dest);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// --- API ДЛЯ ПОЛЬЗОВАТЕЛЕЙ ---

app.post('/api/register', (req, res) => {
    const { name, email, password } = req.body;
    const joined = new Date().toLocaleDateString();
    db.get("SELECT * FROM users WHERE email = ?", [email], (err, row) => {
        if (err) return res.status(500).json({ message: 'Ошибка сервера' });
        if (row) return res.status(409).json({ message: 'Пользователь с таким email уже существует.' });

        const sql = `INSERT INTO users (name, email, password, joined) VALUES (?, ?, ?, ?)`;
        db.run(sql, [name, email, password, joined], function(err) {
            if (err) return res.status(500).json({ message: 'Ошибка регистрации' });
            const newUser = { id: this.lastID, name, email, password, joined, isAdmin: false };
            res.status(201).json({ message: 'Пользователь успешно зарегистрирован!', user: newUser });
        });
    });
});

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    db.get("SELECT * FROM users WHERE email = ? AND password = ?", [email, password], (err, row) => {
        if (err) return res.status(500).json({ message: 'Ошибка сервера' });
        if (row) {
            res.status(200).json({ message: 'Вход успешен!', user: row });
        } else {
            res.status(401).json({ message: 'Неверный email или пароль.' });
        }
    });
});

app.post('/api/upload', upload.fields([{ name: 'thumbnail', maxCount: 1 }, { name: 'videoFile', maxCount: 1 }]), (req, res) => {
    if (!req.files || !req.files.thumbnail || !req.files.videoFile) {
        return res.status(400).json({ message: 'Требуется и превью, и видеофайл.' });
    }
    
    const { title, description, channel, duration } = req.body;
    const thumbnailPath = `/uploads/thumbnails/${req.files.thumbnail[0].filename}`;
    const videoPath = `/uploads/videos/${req.files.videoFile[0].filename}`;

    const video = { title, description, channel, duration: duration || "0:00", thumbnail: thumbnailPath, videoUrl: videoPath, views: "0", date: "Только что", status: "Доступно" };
    
    const sql = `INSERT INTO videos (title, description, channel, duration, thumbnail, videoUrl, views, date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const params = [video.title, video.description, video.channel, video.duration, video.thumbnail, video.videoUrl, video.views, video.date, video.status];
    
    db.run(sql, params, function(err) {
        if (err) return res.status(500).json({ message: 'Ошибка сохранения видео в БД' });
        res.status(201).json({ message: 'Видео успешно загружено!', video: { ...video, id: this.lastID } });
    });
});

app.get('/api/users', (req, res) => {
    db.all("SELECT * FROM users", [], (err, rows) => {
        if (err) return res.status(500).json({ message: 'Ошибка сервера' });
        res.status(200).json(rows);
    });
});

app.get('/api/videos', (req, res) => {
     db.all("SELECT * FROM videos ORDER BY id DESC", [], (err, rows) => {
        if (err) return res.status(500).json({ message: 'Ошибка сервера' });
        res.status(200).json(rows);
    });
});

app.get('/api/video/:id', (req, res) => {
    const videoId = parseInt(req.params.id, 10);
    db.get("SELECT * FROM videos WHERE id = ?", [videoId], (err, row) => {
        if (err) return res.status(500).json({ message: 'Ошибка сервера' });
        if (row) {
            res.status(200).json(row);
        } else {
            res.status(404).json({ message: 'Видео не найдено' });
        }
    });
});

// --- API ДЛЯ АДМИН-ПАНЕЛИ ---
const checkAdmin = (req, res, next) => {
    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(401).json({ message: 'Отсутствует ID пользователя' });
    
    db.get("SELECT * FROM users WHERE id = ?", [userId], (err, user) => {
        if (err) return res.status(500).json({ message: 'Ошибка сервера' });
        if (user && user.isAdmin) { next(); } 
        else { res.status(403).json({ message: 'Доступ запрещен.' }); }
    });
};

app.get('/api/admin/stats', checkAdmin, (req, res) => {
    const stats = {};
    db.get("SELECT COUNT(*) as count FROM users", [], (err, row) => {
        if (err) return res.status(500).json({ message: "Ошибка сервера" });
        stats.userCount = row.count;

        db.get("SELECT COUNT(*) as count FROM videos", [], (err, row) => {
            if (err) return res.status(500).json({ message: "Ошибка сервера" });
            stats.videoCount = row.count;
            res.json(stats);
        });
    });
});

app.get('/api/admin/users', checkAdmin, (req, res) => {
    db.all("SELECT * FROM users", [], (err, rows) => {
        if (err) return res.status(500).json({ message: 'Ошибка сервера' });
        res.status(200).json(rows);
    });
});

app.delete('/api/admin/users/:id', checkAdmin, (req, res) => {
    const userIdToDelete = parseInt(req.params.id, 10);
    db.get("SELECT * FROM users WHERE id = ?", [userIdToDelete], (err, user) => {
        if (err) return res.status(500).json({ message: "Ошибка сервера" });
        if (!user) return res.status(404).json({ message: "Пользователь не найден" });
        if (user.isAdmin) return res.status(400).json({ message: 'Нельзя удалить другого администратора.' });

        db.run("DELETE FROM users WHERE id = ?", [userIdToDelete], function(err) {
            if (err) return res.status(500).json({ message: "Ошибка удаления" });
            res.json({ message: 'Пользователь успешно удален' });
        });
    });
});

// --- Обслуживание статических файлов ---
app.use(express.static(path.join(__dirname, '')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});
