document.addEventListener('DOMContentLoaded', () => {
    const currentUser = JSON.parse(localStorage.getItem('chebtube_current_user'));

    // 1. Проверка на стороне клиента (первый уровень защиты)
    if (!currentUser || !currentUser.isAdmin) {
        alert('Доступ запрещен. Вы будете перенаправлены на главную страницу.');
        window.location.href = 'index.html';
        return;
    }

    const SERVER_URL = 'https://impuls21.ru'; 
    const headers = {
        'Content-Type': 'application/json',
        'x-user-id': currentUser.id // Отправляем ID для проверки на бэкенде
    };

    // Функция для загрузки всех данных
    async function loadAllData() {
        try {
            // Загружаем одновременно
            const [statsRes, usersRes, videosRes] = await Promise.all([
                fetch(`${SERVER_URL}/api/admin/stats`, { headers }),
                fetch(`${SERVER_URL}/api/admin/users`, { headers }),
                fetch(`${SERVER_URL}/api/admin/videos`, { headers })
            ]);

            if (!statsRes.ok || !usersRes.ok || !videosRes.ok) {
                 const error = await (statsRes.ok ? usersRes.ok ? videosRes.json() : usersRes.json() : statsRes.json());
                 throw new Error(error.message || 'Ошибка загрузки данных');
            }

            const stats = await statsRes.json();
            const users = await usersRes.json();
            const videos = await videosRes.json();

            renderStats(stats);
            renderUsers(users);
            renderVideos(videos);

        } catch (error) {
            alert(`Ошибка: ${error.message}`);
            // Если ошибка прав доступа, перекидываем на главную
            if (error.message.includes('Доступ запрещен')) {
                 window.location.href = 'index.html';
            }
        }
    }

    // Отрисовка статистики
    function renderStats(stats) {
        document.getElementById('user-count').textContent = stats.userCount;
        document.getElementById('video-count').textContent = stats.videoCount;
        document.getElementById('uploads-size').textContent = `${stats.uploadsSize} MB`;
    }

    // Отрисовка таблицы пользователей
    function renderUsers(users) {
        const tbody = document.getElementById('users-table-body');
        tbody.innerHTML = '';
        users.forEach(user => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${user.id}</td>
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>${user.joined || 'N/A'}</td>
                <td>${user.isAdmin ? 'Да' : 'Нет'}</td>
                <td>
                    ${!user.isAdmin ? `<button class="delete-btn" data-id="${user.id}" data-type="user">Удалить</button>` : 'Недоступно'}
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    // Отрисовка таблицы видео
    function renderVideos(videos) {
        const tbody = document.getElementById('videos-table-body');
        tbody.innerHTML = '';
        videos.forEach(video => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${video.id}</td>
                <td><img src="${video.thumbnail}" alt="thumb" width="100"></td>
                <td>${video.title}</td>
                <td>${video.channel}</td>
                <td>${video.date}</td>
                <td><button class="delete-btn" data-id="${video.id}" data-type="video">Удалить</button></td>
            `;
            tbody.appendChild(tr);
        });
    }

    // Обработка кликов на удаление
    document.body.addEventListener('click', async (e) => {
        if (e.target.classList.contains('delete-btn')) {
            const id = e.target.dataset.id;
            const type = e.target.dataset.type;

            if (confirm(`Вы уверены, что хотите удалить этот элемент (${type} #${id})? Это действие необратимо.`)) {
                try {
                    const response = await fetch(`${SERVER_URL}/api/admin/${type}s/${id}`, {
                        method: 'DELETE',
                        headers: headers
                    });

                    const result = await response.json();
                    if (!response.ok) throw new Error(result.message);

                    alert(result.message);
                    loadAllData(); // Перезагружаем данные после удаления
                } catch (error) {
                    alert(`Ошибка удаления: ${error.message}`);
                }
            }
        }
    });

    // Первоначальная загрузка
    loadAllData();
});
