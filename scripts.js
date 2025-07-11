// Данные видео
let videoData = []; // Будет загружено из videos.json

// Пользовательские данные
let currentUser = null;
let users = []; // Будет загружено с сервера
let studioVideos = JSON.parse(localStorage.getItem('chebtube_studio_videos')) || [];

// DOM элементы (глобальные, которые нужны на обеих страницах или для общих функций)
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

// Элементы для модального окна загрузки видео (если оно общее)
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

// Элементы, специфичные для index.html
const mainSidebar = document.getElementById('main-sidebar');
const mainContent = document.getElementById('main-content');
const featuredVideosContainer = document.getElementById('featured-videos');
const trendingVideosContainer = document.getElementById('trending-videos');

// Элементы, специфичные для studio.html
const studioContainer = document.getElementById('studio-container');
const studioSidebar = document.getElementById('studio-sidebar');
const studioMain = document.getElementById('studio-main');
const uploadBtn = document.getElementById('upload-btn'); // Кнопка загрузки на странице студии
const studioGrid = document.getElementById('studio-grid');

// *************** КОНСТАНТА ДЛЯ АДРЕСА СЕРВЕРА ***************
// Важно: Замените 'http://localhost:3000' на реальный адрес вашего сервера,
// где будет запущен ваш Node.js (или другой бэкенд) сервер.
const SERVER_URL = 'https://impuls21.ru'; 
// *************************************************************


// Загрузка данных при старте
document.addEventListener('DOMContentLoaded', async () => {
    await loadData();
    updateUserUI();

    // Определяем, на какой странице мы находимся
    if (document.body.classList.contains('index-page')) {
        generateVideoCards(featuredVideosContainer, 6, videoData);
        generateVideoCards(trendingVideosContainer, 6, videoData);

        // Обработка параметра action из URL
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('action')) {
            const action = urlParams.get('action');
            if (action === 'login') {
                if (loginBtn) loginBtn.click();
            } else if (action === 'register') {
                if (registerBtn) registerBtn.click();
            }
        }

    } else if (document.body.classList.contains('studio-page')) {
        generateStudioVideos();
    }
});

async function loadData() {
    try {
        const videoResponse = await fetch('videos.json');
        videoData = await videoResponse.json();

        // Загрузка пользователей с сервера
        const userResponse = await fetch(`${SERVER_URL}/api/users`);
        users = await userResponse.json();

        // Проверка авторизации
        const savedUser = localStorage.getItem('chebtube_current_user');
        if (savedUser) {
            currentUser = JSON.parse(savedUser);
        }
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        // Если сервер недоступен, можно оставить `users` пустым
        users = [];
    }
}

// Генерация видео карточек (для главной страницы)
function generateVideoCards(container, count, data) {
    if (!container) return; // Проверка, что элемент существует
    container.innerHTML = '';
    
    const shuffled = [...data].sort(() => 0.5 - Math.random());
    
    for (let i = 0; i < count && i < shuffled.length; i++) {
        const video = shuffled[i];
        const card = document.createElement('div');
        card.className = 'video-card';
        
        card.innerHTML = `
            <div class="thumbnail">
                <img src="${video.thumbnail}" alt="${video.title}">
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

// Генерация видео в студии (для страницы студии)
function generateStudioVideos() {
    if (!studioGrid) return; // Проверка, что элемент существует
    studioGrid.innerHTML = '';
    
    if (studioVideos.length === 0) {
        studioGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
                <i class="fas fa-video" style="font-size: 80px; color: #555; margin-bottom: 20px;"></i>
                <h3>У вас пока нет загруженных видео</h3>
                <p>Нажмите кнопку "Загрузить видео", чтобы добавить свое первое видео</p>
                <button class="upload-btn" style="margin-top: 20px;" id="upload-btn-placeholder">
                    <i class="fas fa-upload"></i>
                    Загрузить видео
                </button>
            </div>
        `;
        // Добавляем слушатель к кнопке-заглушке, если она создана
        document.getElementById('upload-btn-placeholder')?.addEventListener('click', openUploadModal);
        return;
    }
    
    studioVideos.forEach(video => {
        const card = document.createElement('div');
        card.className = 'studio-card';
        
        card.innerHTML = `
            <div class="studio-thumb">
                <img src="${video.thumbnail}" alt="${video.title}">
            </div>
            <div class="studio-card-info">
                <h3 class="studio-card-title">${video.title}</h3>
                <p style="color: #aaa; font-size: 14px; margin: 10px 0;">${video.description || 'Без описания'}</p>
                <div class="studio-card-stats">
                    <div class="stat-item">
                        <i class="fas fa-eye"></i> ${video.views} просмотров
                    </div>
                    <div class="stat-item">
                        <i class="fas fa-clock"></i> ${video.date}
                        <span class="badge">${video.status}</span>
                    </div>
                </div>
            </div>
        `;
        studioGrid.appendChild(card);
    });
}

// Обновление UI в зависимости от состояния пользователя (для обеих страниц)
function updateUserUI() {
    // Обновление для главной страницы
    if (userAvatar && loginBtn && registerBtn && logoutBtn && myChannelBtn) {
        if (currentUser) {
            userAvatar.textContent = currentUser.name.charAt(0);
            loginBtn.style.display = 'none';
            registerBtn.style.display = 'none';
            logoutBtn.style.display = 'block';
            myChannelBtn.style.display = 'block';
        } else {
            userAvatar.textContent = '?';
            loginBtn.style.display = 'block';
            registerBtn.style.display = 'block';
            logoutBtn.style.display = 'none';
            myChannelBtn.style.display = 'none';
        }
    }
    // Также можно добавить логику для элементов на studio.html, если их ID отличаются
    // (см. updateUserUIForStudio в studio.html, если решите дублировать DOM элементы)
}

// Показать/скрыть меню пользователя
if (userAvatar) {
    userAvatar.addEventListener('click', function(e) {
        e.stopPropagation();
        userMenu.classList.toggle('active');
    });
}

// Закрыть меню при клике вне его
document.addEventListener('click', function(e) {
    if (userMenu && !userMenu.contains(e.target) && e.target !== userAvatar) {
        userMenu.classList.remove('active');
    }
});

// Показать форму входа
if (loginBtn) {
    loginBtn.addEventListener('click', function() {
        authContainer.style.display = 'flex';
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
        loginTab.classList.add('active');
        registerTab.classList.remove('active');
    });
}

// Показать форму регистрации
if (registerBtn) {
    registerBtn.addEventListener('click', function() {
        authContainer.style.display = 'flex';
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        registerTab.classList.add('active');
        loginTab.classList.remove('active');
    });
}

// Переключение между вкладками входа и регистрации
if (loginTab) {
    loginTab.addEventListener('click', function() {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
        loginTab.classList.add('active');
        registerTab.classList.remove('active');
    });
}
if (registerTab) {
    registerTab.addEventListener('click', function() {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        registerTab.classList.add('active');
        loginTab.classList.remove('active');
    });
}

// Закрыть форму авторизации
if (closeAuth) {
    closeAuth.addEventListener('click', function() {
        authContainer.style.display = 'none';
    });
}

// Обработка входа
if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        try {
            const response = await fetch(`${SERVER_URL}/api/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                currentUser = data.user;
                localStorage.setItem('chebtube_current_user', JSON.stringify(currentUser));
                updateUserUI();
                authContainer.style.display = 'none';
                alert(`Добро пожаловать, ${currentUser.name}!`);
            } else {
                alert(`Ошибка входа: ${data.message || 'Неизвестная ошибка'}`);
            }
        } catch (error) {
            console.error('Ошибка сети при входе:', error);
            alert('Ошибка сети. Попробуйте позже.');
        }
    });
}

// Обработка регистрации
if (registerForm) {
    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const confirm = document.getElementById('register-confirm').value;
        
        if (password !== confirm) {
            alert('Пароли не совпадают');
            return;
        }
        
        try {
            const response = await fetch(`${SERVER_URL}/api/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, email, password })
            });

            const data = await response.json();

            if (response.ok) {
                currentUser = data.user;
                localStorage.setItem('chebtube_current_user', JSON.stringify(currentUser));
                users.push(currentUser); // Добавляем в локальный массив для текущей сессии
                updateUserUI();
                authContainer.style.display = 'none';
                alert(`Регистрация прошла успешно, ${currentUser.name}!`);
            } else {
                alert(`Ошибка регистрации: ${data.message || 'Неизвестная ошибка'}`);
            }
        } catch (error) {
            console.error('Ошибка сети при регистрации:', error);
            alert('Ошибка сети. Попробуйте позже.');
        }
    });
}

// Выход из системы
if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
        currentUser = null;
        localStorage.removeItem('chebtube_current_user');
        updateUserUI();
        alert('Вы вышли из системы');
        if (userMenu) userMenu.classList.remove('active');
        
        // Если находимся в студии - вернуться на главную
        if (studioContainer && studioContainer.style.display === 'flex') {
            window.location.href = 'index.html';
        }
    });
}

// Переход в студию
if (studioLink) {
    studioLink.addEventListener('click', function(e) {
        e.preventDefault();
        if (!currentUser) {
            alert('Для доступа к студии необходимо войти в систему');
            return;
        }
        window.location.href = 'studio.html';
    });
}

// Переход на главную
if (homeLink) {
    homeLink.addEventListener('click', function(e) {
        e.preventDefault();
        window.location.href = 'index.html';
    });
}

// Открытие модального окна загрузки видео (общая функция)
function openUploadModal() {
    if (!currentUser) {
        alert('Для загрузки видео необходимо войти в систему');
        return;
    }
    
    if (uploadModal) {
        uploadModal.style.display = 'flex';
        // Сброс формы
        if (videoTitleInput) videoTitleInput.value = '';
        if (videoDescInput) videoDescInput.value = '';
        if (previewImg) {
            previewImg.src = '';
            previewImg.style.display = 'none';
        }
        if (thumbnailPreview) {
            thumbnailPreview.querySelector('i').style.display = 'block';
            thumbnailPreview.querySelector('p').style.display = 'block';
        }
        if (progressContainer) progressContainer.style.display = 'none';
        if (uploadStatus) uploadStatus.style.display = 'none';
        if (startUpload) startUpload.disabled = false;
        if (cancelUpload) cancelUpload.disabled = false;
        if (progressBar) progressBar.style.width = '0%';
    }
}

// Загрузка видео - открытие модального окна (для кнопки на studio.html)
if (uploadBtn) {
    uploadBtn.addEventListener('click', openUploadModal);
}


// Закрытие модального окна загрузки
if (closeUpload) {
    closeUpload.addEventListener('click', function() {
        uploadModal.style.display = 'none';
    });
}

if (cancelUpload) {
    cancelUpload.addEventListener('click', function() {
        uploadModal.style.display = 'none';
    });
}

// Загрузка превью
if (thumbnailPreview) {
    thumbnailPreview.addEventListener('click', function() {
        const randomImage = 'https://source.unsplash.com/random/600x400/?video,film';
        if (previewImg) {
            previewImg.src = randomImage;
            previewImg.style.display = 'block';
        }
        if (thumbnailPreview) {
            thumbnailPreview.querySelector('i').style.display = 'none';
            thumbnailPreview.querySelector('p').style.display = 'none';
        }
    });
}

// Начало загрузки видео
if (startUpload) {
    startUpload.addEventListener('click', function() {
        const title = videoTitleInput.value.trim();
        const description = videoDescInput.value.trim();
        
        if (!title) {
            alert('Введите название видео');
            return;
        }
        
        if (!previewImg || !previewImg.src || previewImg.style.display === 'none') { // Проверка, что превью загружено
            alert('Загрузите превью для видео');
            return;
        }
        
        // Показать индикатор загрузки
        if (progressContainer) progressContainer.style.display = 'block';
        if (uploadStatus) uploadStatus.style.display = 'block';
        if (startUpload) startUpload.disabled = true;
        if (cancelUpload) cancelUpload.disabled = true;
        
        // Имитация процесса загрузки
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.floor(Math.random() * 10);
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
                
                // Создание нового видео
                const newVideo = {
                    title: title,
                    channel: currentUser.name,
                    views: "0",
                    date: "Только что",
                    duration: "0:00",
                    thumbnail: previewImg.src,
                    description: description,
                    status: "Обработка"
                };
                
                studioVideos.unshift(newVideo);
                localStorage.setItem('chebtube_studio_videos', JSON.stringify(studioVideos));
                
                // Обновление UI
                generateStudioVideos();
                
                // Закрытие модального окна
                setTimeout(() => {
                    uploadModal.style.display = 'none';
                    if (startUpload) startUpload.disabled = false;
                    if (cancelUpload) cancelUpload.disabled = false;
                    alert('Видео успешно загружено! Оно появится на платформе после обработки.');
                }, 500);
            }
            
            if (progressBar) progressBar.style.width = `${progress}%`;
            if (uploadStatus) uploadStatus.textContent = `Загрузка: ${progress}%`;
        }, 200);
    });
}

// Поиск видео
function performSearch() {
    const currentSearchInput = document.activeElement === searchInput ? searchInput : document.getElementById('search-input-studio');
    const query = currentSearchInput ? currentSearchInput.value.trim() : '';

    if (query) {
        alert(`Поиск по запросу: "${query}"\nВ реальном приложении здесь бы отобразились результаты поиска`);
        if (currentSearchInput) currentSearchInput.value = '';
    }
}
// Добавляем слушатели событий поиска для обеих страниц
if (searchBtn) {
    searchBtn.addEventListener('click', performSearch);
}
if (searchInput) {
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') performSearch();
    });
}
const searchBtnStudio = document.getElementById('search-btn-studio');
const searchInputStudio = document.getElementById('search-input-studio');
if (searchBtnStudio) {
    searchBtnStudio.addEventListener('click', performSearch);
}
if (searchInputStudio) {
    searchInputStudio.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') performSearch();
    });
}


// Начать просмотр
if (startWatching) {
    startWatching.addEventListener('click', function() {
        const firstVideo = document.querySelector('.video-card');
        if (firstVideo) {
            firstVideo.scrollIntoView({ behavior: 'smooth' });
        }
    });
}

// Навигация в сайдбаре
const sidebarItems = document.querySelectorAll('.sidebar-item');
sidebarItems.forEach(item => {
    item.addEventListener('click', function() {
        sidebarItems.forEach(i => i.classList.remove('active'));
        this.classList.add('active');
    });
});
