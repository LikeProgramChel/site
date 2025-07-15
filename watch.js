document.addEventListener('DOMContentLoaded', async () => {
    const videoPlayer = document.getElementById('video-player');
    const videoTitleEl = document.getElementById('video-title');
    const videoChannelEl = document.getElementById('video-channel');
    const videoDescriptionEl = document.getElementById('video-description');

    const pathParts = window.location.pathname.split('/');
    const videoId = pathParts[pathParts.length - 1];

    if (!videoId || isNaN(videoId)) {
        videoTitleEl.textContent = 'Ошибка: неверный ID видео.';
        return;
    }

    try {
        const response = await fetch(`/api/video/${videoId}`);
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || 'Видео не найдено');
        }
        const video = await response.json();

        document.title = video.title;
        videoTitleEl.textContent = video.title;
        videoDescriptionEl.textContent = video.description || 'Нет описания.';
        videoChannelEl.innerHTML = `<div class="channel-avatar">${video.channel.charAt(0)}</div>${video.channel}`;
        videoPlayer.src = video.videoUrl;

    } catch (error) {
        videoTitleEl.textContent = `Ошибка: ${error.message}`;
    }
});
