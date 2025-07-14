const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, x-user-id, x-user-token'); // Добавляем кастомные заголовки
    next();
});

const usersFilePath = path.join(__dirname, 'users.json');
const videosFilePath = path.join(__dirname, 'videos.json');
const uploadsDir = path.join(__dirname, 'uploads');

// --- Стандартные API ---
// ... (все ваши эндпоинты /api/register, /api/login, /api/upload и т.д. остаются здесь без изменений)
// Я их скрыл для краткости, но они должны быть в вашем файле

// --- АДМИН-ПАНЕЛЬ: MIDDLEWARE ДЛЯ ПРОВЕРКИ АДМИНА ---

// Middleware для проверки прав администратора
const checkAdmin = (req, res, next) => {
    const userId = req.headers['x-user-id']; // ID админа передается в заголовке
    if (!userId) {
        return res.status(401).json({ message: 'Отсутствует ID пользователя' });
    }

    fs.readFile(usersFilePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ message: 'Ошибка сервера' });
        }
        const users = JSON.parse(data);
        const user = users.find(u => u.id == userId);

        if (user && user.isAdmin === true) {
            next(); // Пользователь - админ, разрешаем доступ
        } else {
            res.status(403).json({ message: 'Доступ запрещен. Требуются права администратора.' });
        }
    });
};


// --- АДМИН-ПАНЕЛЬ: НОВЫЕ ЗАЩИЩЕННЫЕ API ЭНДПОИНТЫ ---

// Роут для получения общей статистики
app.get('/api/admin/stats', checkAdmin, (req, res) => {
    const users = JSON.parse(fs.readFileSync(usersFilePath, 'utf8'));
    const videos = JSON.parse(fs.readFileSync(videosFilePath, 'utf8'));
    
    fs.readdir(uploadsDir, (err, files) => {
        let totalSize = 0;
        if (!err) {
            files.forEach(file => {
                totalSize += fs.statSync(path.join(uploadsDir, file)).size;
            });
        }
        res.json({
            userCount: users.length,
            videoCount: videos.length,
            uploadsSize: (totalSize / (1024 * 1024)).toFixed(2) // в МБ
        });
    });
});

// Получить всех пользователей
app.get('/api/admin/users', checkAdmin, (req, res) => {
    res.sendFile(usersFilePath);
});

// Получить все видео
app.get('/api/admin/videos', checkAdmin, (req, res) => {
    res.sendFile(videosFilePath);
});

// Удалить пользователя
app.delete('/api/admin/users/:id', checkAdmin, (req, res) => {
    const userIdToDelete = parseInt(req.params.id, 10);
    let users = JSON.parse(fs.readFileSync(usersFilePath, 'utf8'));
    const userToDelete = users.find(u => u.id === userIdToDelete);

    if (userToDelete && userToDelete.isAdmin) {
        return res.status(400).json({ message: 'Нельзя удалить другого администратора.' });
    }

    const newUsers = users.filter(u => u.id !== userIdToDelete);

    if (users.length === newUsers.length) {
        return res.status(404).json({ message: 'Пользователь не найден' });
    }

    fs.writeFileSync(usersFilePath, JSON.stringify(newUsers, null, 2));
    res.json({ message: 'Пользователь успешно удален' });
});

// Удалить видео
app.delete('/api/admin/videos/:id', checkAdmin, (req, res) => {
    const videoIdToDelete = parseInt(req.params.id, 10);
    let videos = JSON.parse(fs.readFileSync(videosFilePath, 'utf8'));
    const videoToDelete = videos.find(v => v.id === videoIdToDelete);

    if (!videoToDelete) {
        return res.status(404).json({ message: 'Видео не найдено' });
    }

    // Удаляем файл превью с диска
    try {
        const thumbnailPath = path.join(__dirname, videoToDelete.thumbnail);
        if (fs.existsSync(thumbnailPath)) {
            fs.unlinkSync(thumbnailPath);
        }
    } catch (e) {
        console.error("Не удалось удалить файл превью:", e);
    }
    
    const newVideos = videos.filter(v => v.id !== videoIdToDelete);
    fs.writeFileSync(videosFilePath, JSON.stringify(newVideos, null, 2));
    res.json({ message: 'Видео успешно удалено' });
});


// Обслуживание статических файлов
app.use(express.static(path.join(__dirname, '')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});
