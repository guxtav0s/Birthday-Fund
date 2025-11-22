function toggleMenu() {
  const nav = document.getElementById('navLinks');
  nav.classList.toggle('active');
}

document.addEventListener('DOMContentLoaded', function() {
  const navRight = document.querySelector('.nav-right');
  const userName = sessionStorage.getItem('currentUserName');
  const userRole = sessionStorage.getItem('currentUserRole');

  const heroDefault = document.getElementById('hero-guest');
  const heroLogged = document.getElementById('hero-user');

  if (userName) {
    if (heroDefault && heroLogged) {
        heroDefault.style.display = 'none';
        heroLogged.style.display = 'flex';
    }

    if (navRight) {
        const userFirstName = userName.split(' ')[0]; 

        navRight.innerHTML = `
        <span class="user-greeting">Olá, ${userFirstName}</span>
        <a href="perfil.html" class="user-icon"><i class="fa-solid fa-user"></i></a>
        <a href="#" id="logoutBtn" class="auth-link-logout">Sair</a>
        `;

        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            sessionStorage.clear();
            window.location.href = 'autenticacao.html';
        });
        }
    }

    if (userRole === 'admin') {
      const navCenter = document.querySelector('.nav-center');
      if (navCenter) {
          if (!document.querySelector('a[href="gerenciamento-usuarios.html"]')) {
              const adminLink = document.createElement('a');
              adminLink.href = 'gerenciamento-usuarios.html';
              adminLink.textContent = 'Gerenciamento';
              navCenter.appendChild(adminLink);
          }
      }
    }

    const btnCriarContaSobre = document.getElementById('btnCriarContaSobre');
    if (btnCriarContaSobre) {
        btnCriarContaSobre.style.display = 'none';
    }
  }
});