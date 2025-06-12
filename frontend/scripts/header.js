// scripts/header.js
function updateUserProfile() {
    const userProfile = document.querySelector('.user-profile');
    const snils = localStorage.getItem('userSnils');
    const admin = localStorage.getItem('adminLogin');

    // Определяем базовый путь в зависимости от текущей страницы
    const isIndexPage = window.location.pathname.endsWith('index.html') ||
        window.location.pathname.endsWith('/');
    const basePath = isIndexPage ? '' : '../';

    if (snils) {
        // Пользователь авторизован
        userProfile.innerHTML = `
            <a href="${basePath}pages/LK_abiturient.html?snils=${snils}">
                <img src="${basePath}static/images/user_profile_icon.png" alt="Личный кабинет">
            </a>
        `;
    } else if (admin) {
        // Пользователь авторизован
        userProfile.innerHTML = `
            <a href="${basePath}pages/LK_admin.html">
                <img src="${basePath}static/images/user_profile_icon.png" alt="Личный кабинет">
            </a>
        `;
    }
    else {
        // Пользователь не авторизован
        userProfile.innerHTML = `
            <a href="${basePath}pages/login.html">
                <img src="${basePath}static/images/user_login_icon.png" alt="Вход">
            </a>
        `;
    }

    // Обработчик выхода
    document.getElementById('logoutBtn')?.addEventListener('click', function() {
        localStorage.removeItem('userSnils');
        window.location.reload();
    });
}

window.addEventListener('message', function(event) {
    if (event.data.type === 'userLoggedIn' || event.data.type === 'userLoggedOut') {
        updateUserProfile();
    }
});

// Вызываем при загрузке страницы
document.addEventListener('DOMContentLoaded', updateUserProfile);