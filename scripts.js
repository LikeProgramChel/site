let videoData = [];
let currentUser = null;
let users = [];

// Переменная для файла превью
let thumbnailFile = null;

// DOM элементы
const userAvatar = document.getElementById('user-avatar');
const userMenu = document.getElementById('user-menu');
const loginBtn = document.getElementById('login-btn');
const registerBtn = document.getElementById('register-btn');
const logoutBtn = document.getElementById('logout-btn');
const myChannelBtn = document.getElementById('my-channel-btn');
const authContainer = document.getElementById('auth-container');
const closeAuth = document.getElementById('close-auth');
const loginTab = document.getElementById('login-tab');
const registerTab = document.getElementById('register-tab');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const studioLink = document.getElementById('studio-link');
const homeLink = document.getElementById('home-link');
const searchBtn = document.getElementById('search-btn');
const searchInput = document.getElementById('search-input');
const startWatching = document.getElementById('start-watching');

// Элементы модального окна загрузки
const uploadModal = document.getElementById('upload-modal');
const closeUpload = document.getElementById('close-upload');
const cancelUpload = document.getElementById('cancel-upload');
const startUpload = document.getElementById('start-upload');
const thumbnailPreview = document.getElementById('thumbnail-preview');
const previewImg = document.getElementById('preview-img');
const progressContainer = document.getElementById('progress-container');
const progressBar = document.getElementById('progress-bar');
const uploadStatus = document.getElementById('upload-status');
const videoTitleInput = document.getElementById('video-title');
const videoDescInput = document.getElementById('video-desc');

// Элементы index.html
const featuredVideosContainer = document.getElementById('featured-videos');
const trendingVideosContainer = document.getElementById('trending-videos');

// Элементы studio.html
const uploadBtn = document.getElementById('upload-btn');
const studioGrid = document.getElementById('studio-grid');

// АДРЕС СЕРВЕРА
const SERVER_URL = 'https://impuls21.ru'; 

// Загрузка данных при старте
document.addEventListener('DOMContentLoaded', async () => {
    await loadDataFromServer();
    updateUserUI(); // Обновляем UI после загрузки данных и определения пользователя

    // Определяем страницу и генерируем контент
    if (document.body.classList.contains('index-page')) {
        generateVideoCards(featuredVideosContainer, 12, videoData);
        generateVideoCards(trendingVideosContainer, 6, videoData);
        handleUrlActions();
    } else if (document.body.classList.contains('studio-page')) {
        if (currentUser) {
            const myVideos = videoData.filter(v => v.channel === currentUser.name);
            generateStudioVideos(myVideos);
        } else {
            generateStudioVideos([]); // Показать заглушку если не вошел
        }
    }
});

async function loadDataFromServer() {
    try {
        const [videoResponse, userResponse] = await Promise.all([
            fetch(`${SERVER_URL}/api/videos`),
            fetch(`${SERVER_URL}/api/users`)
        ]);

        if (!videoResponse.ok || !userResponse.ok) {
            throw new Error('Ошибка сети при загрузке данных');
        }

        videoData = await videoResponse.json();
        users = await userResponse.json();

        // Проверка авторизации из localStorage
        const savedUser = localStorage.getItem('chebtube_current_user');
        if (savedUser) {
            currentUser = JSON.parse(savedUser);
        }
    } catch (error) {
        console.error('Ошибка загрузки данных с сервера:', error);
        videoData = [];
        users = [];
    }
}

function handleUrlActions() {
    const urlParams = new URLSearchParams(window.location.search);
    const action = urlParams.get('action');
    if (action === 'login' && loginBtn) {
        loginBtn.click();
    } else if (action === 'register' && registerBtn) {
        registerBtn.click();
    }
    // Очистить параметры из URL, чтобы они не мешали при перезагрузке
    if (action) {
       window.history.replaceState({}, document.title, window.location.pathname);
    }
}

// Генерация карточек видео на главной
function generateVideoCards(container, count, data) {
    if (!container) return;
    container.innerHTML = '';
    const shuffled = [...data].sort(() => 0.5 - Math.random());
    for (let i = 0; i < count && i < shuffled.length; i++) {
        const video = shuffled[i];
        const card = document.createElement('div');
        card.className = 'video-card';
        card.innerHTML = `
            <div class="thumbnail">
                <img src="${SERVER_URL}${video.thumbnail}" alt="${video.title}">
                <div class="duration">${video.duration}</div>
            </div>
            <div class="video-info">
                <h3 class="video-title">${video.title}</h3>
                <div class="video-channel">
                    <div class="channel-avatar">${video.channel.charAt(0)}</div>
                    ${video.channel}
                </div>
                <div class="video-stats">
                    <span>${video.views} просмотров</span>
                    <span>${video.date}</span>
                </div>
            </div>
        `;
        container.appendChild(card);
    }
}

// Генерация видео в студии
function generateStudioVideos(videos) {
    if (!studioGrid) return;
    studioGrid.innerHTML = '';
    
    if (!currentUser) {
         studioGrid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 60px 20px;"><h3>Для доступа к студии необходимо войти в систему.</h3></div>`;
         return;
    }

    if (videos.length === 0) {
        studioGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
                <i class="fas fa-video" style="font-size: 80px; color: #555; margin-bottom: 20px;"></i>
                <h3>У вас пока нет загруженных видео</h3>
                <p>Нажмите кнопку "Загрузить видео", чтобы добавить свое первое видео</p>
                <button class="upload-btn" style="margin-top: 20px;" onclick="document.getElementById('upload-btn').click();">
                    <i class="fas fa-upload"></i> Загрузить видео
                </button>
            </div>
        `;
        return;
    }
    
    videos.forEach(video => {
        const card = document.createElement('div');
        card.className = 'studio-card';
        card.innerHTML = `
            <div class="studio-thumb">
                <img src="${SERVER_URL}${video.thumbnail}" alt="${video.title}">
            </div>
            <div class="studio-card-info">
                <h3 class="studio-card-title">${video.title}</h3>
                <p style="color: #aaa; font-size: 14px; margin: 10px 0;">${video.description || 'Без описания'}</p>
                <div class="studio-card-stats">
                    <div class="stat-item"><i class="fas fa-eye"></i> ${video.views} просмотров</div>
                    <div class="stat-item"><i class="fas fa-clock"></i> ${video.date} <span class="badge">${video.status}</span></div>
                </div>
            </div>
        `;
        studioGrid.appendChild(card);
    });
}

// Обновление UI пользователя
function updateUserUI() {
    const isStudio = document.body.classList.contains('studio-page');
    const avatarEl = document.getElementById(isStudio ? 'user-avatar-studio' : 'user-avatar');
    const menuEl = document.getElementById(isStudio ? 'user-menu-studio' : 'user-menu');
    
    if (currentUser) {
        avatarEl.textContent = currentUser.name.charAt(0);
        menuEl.querySelector(isStudio ? '#login-btn-studio' : '#login-btn').style.display = 'none';
        menuEl.querySelector(isStudio ? '#register-btn-studio' : '#register-btn').style.display = 'none';
        menuEl.querySelector(isStudio ? '#logout-btn-studio' : '#logout-btn').style.display = 'block';
        menuEl.querySelector(isStudio ? '#my-channel-btn-studio' : '#my-channel-btn').style.display = 'block';
    } else {
        avatarEl.textContent = '?';
        menuEl.querySelector(isStudio ? '#login-btn-studio' : '#login-btn').style.display = 'block';
        menuEl.querySelector(isStudio ? '#register-btn-studio' : '#register-btn').style.display = 'block';
        menuEl.querySelector(isStudio ? '#logout-btn-studio' : '#logout-btn').style.display = 'none';
        menuEl.querySelector(isStudio ? '#my-channel-btn-studio' : '#my-channel-btn').style.display = 'none';
    }
}

// --- ОБРАБОТЧИКИ СОБЫТИЙ ---

// Открытие/закрытие меню пользователя
document.querySelectorAll('.user-avatar').forEach(avatar => {
    avatar.addEventListener('click', (e) => {
        e.stopPropagation();
        const menu = avatar.nextElementSibling;
        menu.classList.toggle('active');
    });
});

document.addEventListener('click', (e) => {
    document.querySelectorAll('.user-menu').forEach(menu => {
        if (!menu.contains(e.target) && !menu.previousElementSibling.contains(e.target)) {
            menu.classList.remove('active');
        }
    });
});

// Открытие форм входа/регистрации
if (loginBtn) loginBtn.addEventListener('click', () => { authContainer.style.display = 'flex'; loginTab.click(); });
if (registerBtn) registerBtn.addEventListener('click', () => { authContainer.style.display = 'flex'; registerTab.click(); });

// Переключение вкладок
if (loginTab) loginTab.addEventListener('click', () => {
    loginForm.style.display = 'block'; registerForm.style.display = 'none';
    loginTab.classList.add('active'); registerTab.classList.remove('active');
});
if (registerTab) registerTab.addEventListener('click', () => {
    loginForm.style.display = 'none'; registerForm.style.display = 'block';
    registerTab.classList.add('active'); loginTab.classList.remove('active');
});

// Закрытие модальных окон
if (closeAuth) closeAuth.addEventListener('click', () => { authContainer.style.display = 'none'; });
if (closeUpload) closeUpload.addEventListener('click', () => { uploadModal.style.display = 'none'; });
if (cancelUpload) cancelUpload.addEventListener('click', () => { uploadModal.style.display = 'none'; });

// Обработка форм
if (loginForm) loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    try {
        const response = await fetch(`${SERVER_URL}/api/login`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        
        currentUser = data.user;
        localStorage.setItem('chebtube_current_user', JSON.stringify(currentUser));
        updateUserUI();
        authContainer.style.display = 'none';
        alert(`Добро пожаловать, ${currentUser.name}!`);
        window.location.reload(); // Перезагружаем для обновления контента
    } catch (error) {
        alert(`Ошибка входа: ${error.message}`);
    }
});

if (registerForm) registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    if (password !== document.getElementById('register-confirm').value) {
        return alert('Пароли не совпадают');
    }
    try {
        const response = await fetch(`${SERVER_URL}/api/register`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        
        currentUser = data.user;
        localStorage.setItem('chebtube_current_user', JSON.stringify(currentUser));
        updateUserUI();
        authContainer.style.display = 'none';
        alert(`Регистрация прошла успешно, ${currentUser.name}!`);
        window.location.reload(); // Перезагружаем
    } catch (error) {
        alert(`Ошибка регистрации: ${error.message}`);
    }
});

// Выход
document.querySelectorAll('#logout-btn, #logout-btn-studio').forEach(btn => {
    btn.addEventListener('click', () => {
        currentUser = null;
        localStorage.removeItem('chebtube_current_user');
        updateUserUI();
        alert('Вы вышли из системы');
        if (document.body.classList.contains('studio-page')) {
            window.location.href = 'index.html';
        } else {
             window.location.reload();
        }
    });
});

// Навигация
if (studioLink) studioLink.addEventListener('click', (e) => {
    e.preventDefault();
    if (!currentUser) return alert('Для доступа к студии необходимо войти в систему');
    window.location.href = 'studio.html';
});
if (homeLink) homeLink.addEventListener('click', (e) => {
    e.preventDefault();
    window.location.href = 'index.html';
});
document.querySelectorAll('#home-from-studio-link').forEach(link => {
    link.addEventListener('click', e => {
        e.preventDefault();
        window.location.href = 'index.html';
    });
});

// Открытие окна загрузки
function openUploadModal() {
    if (!currentUser) return alert('Для загрузки видео необходимо войти в систему');
    uploadModal.style.display = 'flex';
    // Сброс формы
    videoTitleInput.value = '';
    videoDescInput.value = '';
    previewImg.src = '';
    previewImg.style.display = 'none';
    thumbnailFile = null;
    thumbnailPreview.querySelector('i').style.display = 'block';
    thumbnailPreview.querySelector('p').style.display = 'block';
    progressContainer.style.display = 'none';
    uploadStatus.style.display = 'none';
    startUpload.disabled = false;
    cancelUpload.disabled = false;
    progressBar.style.width = '0%';
}

if (uploadBtn) uploadBtn.addEventListener('click', openUploadModal);

// Загрузка превью
if (thumbnailPreview) thumbnailPreview.addEventListener('click', () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.onchange = e => {
        const file = e.target.files[0];
        if (file) {
            thumbnailFile = file; // Сохраняем файл
            const reader = new FileReader();
            reader.onload = (event) => {
                previewImg.src = event.target.result;
                previewImg.style.display = 'block';
                thumbnailPreview.querySelector('i').style.display = 'none';
                thumbnailPreview.querySelector('p').style.display = 'none';
            };
            reader.readAsDataURL(file);
        }
    };
    fileInput.click();
});

// Отправка видео на сервер
if (startUpload) startUpload.addEventListener('click', async () => {
    const title = videoTitleInput.value.trim();
    const description = videoDescInput.value.trim();
    
    if (!title || !thumbnailFile) return alert('Введите название и загрузите превью');
    if (!currentUser) return alert('Ошибка: вы не авторизованы.');
    
    progressContainer.style.display = 'block';
    uploadStatus.style.display = 'block';
    startUpload.disabled = true;
    cancelUpload.disabled = true;
    progressBar.style.width = '50%';
    uploadStatus.textContent = `Загрузка на сервер...`;

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('thumbnail', thumbnailFile);
    formData.append('channel', currentUser.name);
    
    try {
        const response = await fetch(`${SERVER_URL}/api/upload`, { method: 'POST', body: formData });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message);

        progressBar.style.width = '100%';
        uploadStatus.textContent = 'Загрузка завершена!';
        
        videoData.unshift(result.video); // Мгновенно обновляем локальные данные
        const myVideos = videoData.filter(v => v.channel === currentUser.name);
        generateStudioVideos(myVideos); // Перерисовываем студию
        
        setTimeout(() => {
            uploadModal.style.display = 'none';
            alert('Видео успешно загружено!');
        }, 500);

    } catch (error) {
        alert(`Ошибка загрузки: ${error.message}`);
    } finally {
        startUpload.disabled = false;
        cancelUpload.disabled = false;
    }
});


// Перенаправление на главную для входа/регистрации со страницы студии
document.querySelectorAll('#login-btn-studio, #register-btn-studio').forEach(btn => {
    btn.addEventListener('click', () => {
        const action = btn.id.includes('login') ? 'login' : 'register';
        window.location.href = `index.html?action=${action}`;
    });
});
