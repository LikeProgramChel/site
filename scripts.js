// ==========================================================
// ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ
// ==========================================================
let videoData = [];
let currentUser = null;
let users = [];
let thumbnailFile = null;
let videoFile = null;

const SERVER_URL = ''; // Запросы идут на тот же домен, поэтому оставляем пустым

// ==========================================================
// КЭШИРОВАНИЕ DOM-ЭЛЕМЕНТОВ
// ==========================================================
// Общие элементы
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

// Элементы студии (могут быть null на главной странице)
const userAvatarStudio = document.getElementById('user-avatar-studio');
const userMenuStudio = document.getElementById('user-menu-studio');
const loginBtnStudio = document.getElementById('login-btn-studio');
const registerBtnStudio = document.getElementById('register-btn-studio');
const logoutBtnStudio = document.getElementById('logout-btn-studio');
const myChannelBtnStudio = document.getElementById('my-channel-btn-studio');
const homeFromStudioLink = document.getElementById('home-from-studio-link');
const studioGrid = document.getElementById('studio-grid');
const uploadBtn = document.getElementById('upload-btn');

// Элементы модального окна загрузки
const uploadModal = document.getElementById('upload-modal');
const closeUpload = document.getElementById('close-upload');
const cancelUpload = document.getElementById('cancel-upload');
const startUpload = document.getElementById('start-upload');
const thumbnailPreview = document.getElementById('thumbnail-preview');
const previewImg = document.getElementById('preview-img');
const videoFileInput = document.getElementById('video-file-input');
const videoTitleInput = document.getElementById('video-title');
const videoDescInput = document.getElementById('video-desc');
const progressContainer = document.getElementById('progress-container');
const progressBar = document.getElementById('progress-bar');
const uploadStatus = document.getElementById('upload-status');

// Элементы главной страницы
const featuredVideosContainer = document.getElementById('featured-videos');
const trendingVideosContainer = document.getElementById('trending-videos');
const startWatchingBtn = document.getElementById('start-watching');


// ==========================================================
// ОСНОВНЫЕ ФУНКЦИИ И ИНИЦИАЛИЗАЦИЯ
// ==========================================================

document.addEventListener('DOMContentLoaded', async () => {
    await loadDataFromServer();
    updateUserUI(); 

    if (document.body.classList.contains('index-page')) {
        generateVideoCards(featuredVideosContainer, 12, videoData);
        generateVideoCards(trendingVideosContainer, 6, videoData);
    } else if (document.body.classList.contains('studio-page')) {
        const myVideos = currentUser ? videoData.filter(v => v.channel === currentUser.name) : [];
        generateStudioVideos(myVideos);
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
        
        const savedUser = localStorage.getItem('chebtube_current_user');
        if (savedUser) {
            currentUser = JSON.parse(savedUser);
        }

    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
    }
}

function generateVideoCards(container, count, data) {
    if (!container) return;
    container.innerHTML = '';
    const shuffled = [...data].sort(() => 0.5 - Math.random());
    for (let i = 0; i < count && i < shuffled.length; i++) {
        const video = shuffled[i];
        const cardLink = document.createElement('a');
        cardLink.className = 'video-card';
        cardLink.href = `/videos/${video.id}`;
        cardLink.style.textDecoration = 'none';
        cardLink.style.color = 'inherit';
        cardLink.innerHTML = `
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
                    <span> • </span>
                    <span>${video.date}</span>
                </div>
            </div>`;
        container.appendChild(cardLink);
    }
}

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
            </div>`;
        return;
    }
    
    videos.forEach(video => {
        const card = document.createElement('div');
        card.className = 'studio-card';
        card.innerHTML = `
            <a href="/videos/${video.id}" style="text-decoration: none; color: inherit;">
                <div class="studio-thumb">
                    <img src="${SERVER_URL}${video.thumbnail}" alt="${video.title}">
                </div>
            </a>
            <div class="studio-card-info">
                <h3 class="studio-card-title">${video.title}</h3>
                <p style="color: #aaa; font-size: 14px; margin: 10px 0;">${video.description || 'Без описания'}</p>
                <div class="studio-card-stats">
                    <div class="stat-item"><i class="fas fa-eye"></i> ${video.views} просмотров</div>
                    <div class="stat-item"><i class="fas fa-clock"></i> ${video.date} <span class="badge">${video.status}</span></div>
                </div>
            </div>`;
        studioGrid.appendChild(card);
    });
}

function updateUserUI() {
    const isStudio = document.body.classList.contains('studio-page');
    const avatar = isStudio ? userAvatarStudio : userAvatar;
    const menu = isStudio ? userMenuStudio : userMenu;
    
    if (!avatar || !menu) return; // Элементов нет, выходим

    if (currentUser) {
        avatar.textContent = currentUser.name.charAt(0).toUpperCase();
        menu.querySelector(isStudio ? '#login-btn-studio' : '#login-btn').style.display = 'none';
        menu.querySelector(isStudio ? '#register-btn-studio' : '#register-btn').style.display = 'none';
        menu.querySelector(isStudio ? '#logout-btn-studio' : '#logout-btn').style.display = 'block';
        menu.querySelector(isStudio ? '#my-channel-btn-studio' : '#my-channel-btn').style.display = 'block';
    } else {
        avatar.textContent = '?';
        menu.querySelector(isStudio ? '#login-btn-studio' : '#login-btn').style.display = 'block';
        menu.querySelector(isStudio ? '#register-btn-studio' : '#register-btn').style.display = 'block';
        menu.querySelector(isStudio ? '#logout-btn-studio' : '#logout-btn').style.display = 'none';
        menu.querySelector(isStudio ? '#my-channel-btn-studio' : '#my-channel-btn').style.display = 'none';
    }
}

// ==========================================================
// ОБРАБОТЧИКИ СОБЫТИЙ
// ==========================================================

// --- Меню пользователя ---
document.querySelectorAll('.user-avatar').forEach(avatar => {
    avatar?.addEventListener('click', (e) => {
        e.stopPropagation();
        avatar.nextElementSibling?.classList.toggle('active');
    });
});

document.addEventListener('click', (e) => {
    document.querySelectorAll('.user-menu').forEach(menu => {
        if (!menu.contains(e.target) && !menu.previousElementSibling.contains(e.target)) {
            menu.classList.remove('active');
        }
    });
});

// --- Модальное окно входа/регистрации ---
loginBtn?.addEventListener('click', () => { authContainer.style.display = 'flex'; loginTab.click(); });
registerBtn?.addEventListener('click', () => { authContainer.style.display = 'flex'; registerTab.click(); });
loginBtnStudio?.addEventListener('click', () => { window.location.href = '/index.html?action=login'; });
registerBtnStudio?.addEventListener('click', () => { window.location.href = '/index.html?action=register'; });

loginTab?.addEventListener('click', () => {
    loginForm.style.display = 'block'; registerForm.style.display = 'none';
    loginTab.classList.add('active'); registerTab.classList.remove('active');
});
registerTab?.addEventListener('click', () => {
    loginForm.style.display = 'none'; registerForm.style.display = 'block';
    registerTab.classList.add('active'); loginTab.classList.remove('active');
});

closeAuth?.addEventListener('click', () => { authContainer.style.display = 'none'; });

// --- Формы ---
loginForm?.addEventListener('submit', async (e) => {
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
        window.location.reload();
    } catch (error) {
        alert(`Ошибка входа: ${error.message}`);
    }
});

registerForm?.addEventListener('submit', async (e) => {
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
        window.location.reload();
    } catch (error) {
        alert(`Ошибка регистрации: ${error.message}`);
    }
});

// --- Выход ---
function handleLogout() {
    currentUser = null;
    localStorage.removeItem('chebtube_current_user');
    updateUserUI();
    alert('Вы вышли из системы');
    if (document.body.classList.contains('studio-page')) {
        window.location.href = '/index.html';
    } else {
         window.location.reload();
    }
}
logoutBtn?.addEventListener('click', handleLogout);
logoutBtnStudio?.addEventListener('click', handleLogout);

// --- Навигация ---
studioLink?.addEventListener('click', (e) => {
    e.preventDefault();
    if (!currentUser) return alert('Для доступа к студии необходимо войти в систему');
    window.location.href = '/studio.html';
});
homeLink?.addEventListener('click', (e) => { e.preventDefault(); window.location.href = '/'; });
homeFromStudioLink?.addEventListener('click', (e) => { e.preventDefault(); window.location.href = '/'; });
startWatchingBtn?.addEventListener('click', () => { document.querySelector('.videos-grid')?.scrollIntoView({ behavior: 'smooth' }); });

// --- Логика загрузки ---
function openUploadModal() {
    if (!currentUser) {
        alert('Для загрузки видео необходимо войти в систему');
        return;
    }
    uploadModal.style.display = 'flex';
    // Сброс формы
    videoTitleInput.value = '';
    videoDescInput.value = '';
    videoFileInput.value = '';
    previewImg.src = '';
    previewImg.style.display = 'none';
    thumbnailFile = null;
    videoFile = null;
    thumbnailPreview.querySelector('i').style.display = 'block';
    thumbnailPreview.querySelector('p').style.display = 'block';
    progressContainer.style.display = 'none';
    uploadStatus.style.display = 'none';
    startUpload.disabled = false;
    cancelUpload.disabled = false;
    progressBar.style.width = '0%';
}

uploadBtn?.addEventListener('click', openUploadModal);
closeUpload?.addEventListener('click', () => { uploadModal.style.display = 'none'; });
cancelUpload?.addEventListener('click', () => { uploadModal.style.display = 'none'; });

thumbnailPreview?.addEventListener('click', () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.onchange = e => {
        const file = e.target.files[0];
        if (file) {
            thumbnailFile = file;
            const reader = new FileReader();
            reader.onload = event => {
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

videoFileInput?.addEventListener('change', (e) => {
    videoFile = e.target.files[0];
    if (videoFile) {
        videoFileInput.style.outline = '2px solid var(--success)';
    }
});

startUpload?.addEventListener('click', async () => {
    const title = videoTitleInput.value.trim();
    if (!title || !thumbnailFile || !videoFile) {
        return alert('Введите название, выберите превью и видеофайл.');
    }
    if (!currentUser) return alert('Ошибка: вы не авторизованы.');
    
    startUpload.disabled = true;
    cancelUpload.disabled = true;
    progressContainer.style.display = 'block';
    uploadStatus.style.display = 'block';
    uploadStatus.textContent = 'Загрузка...';
    progressBar.style.width = '50%';

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', videoDescInput.value.trim());
    formData.append('channel', currentUser.name);
    formData.append('thumbnail', thumbnailFile);
    formData.append('videoFile', videoFile);
    
    try {
        const response = await fetch(`${SERVER_URL}/api/upload`, {
            method: 'POST',
            body: formData,
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message);
        
        progressBar.style.width = '100%';
        uploadStatus.textContent = 'Загрузка завершена!';
        
        setTimeout(() => {
            alert('Видео успешно загружено!');
            window.location.reload();
        }, 500);

    } catch (error) {
        alert(`Ошибка загрузки: ${error.message}`);
        startUpload.disabled = false;
        cancelUpload.disabled = false;
        progressContainer.style.display = 'none';
        uploadStatus.style.display = 'none';
    }
});
