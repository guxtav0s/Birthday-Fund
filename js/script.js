function toggleMenu() {
  const nav = document.getElementById('navLinks');
  nav.classList.toggle('active');
}

document.addEventListener('DOMContentLoaded', function() {
  
  // Seletores
  const navRight = document.querySelector('.nav-right');
  const navCenter = document.querySelector('.nav-center');
  const btnCriarContaSobre = document.getElementById('btnCriarContaSobre');
  
  // Home Elements
  const heroDefault = document.getElementById('heroDefault');
  const heroLogged = document.getElementById('heroLogged');
  
  // Dados
  const userName = sessionStorage.getItem('currentUserName');
  const userRole = sessionStorage.getItem('currentUserRole');

  // LÓGICA DE LOGIN
  if (userName) {

    // 1. Ajuste da Home
    if (heroDefault && heroLogged) {
        heroDefault.classList.add('hidden');
        heroDefault.style.display = 'none'; // Reforço
        
        heroLogged.classList.remove('hidden');
        heroLogged.style.display = 'flex';
    }

    // 2. Navbar
    if (navRight) {
        const userFirstName = userName.split(' ')[0]; 
        navRight.innerHTML = `
          <span class="user-greeting" style="margin-right:15px; color:#FFD700; font-weight:bold;">Olá, ${userFirstName}</span>
          <a href="perfil.html" class="user-icon" style="color:white; margin-right:15px;"><i class="fa-solid fa-user"></i></a>
          <button id="logoutBtn" class="auth-link-logout">Sair</button>
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

    // 3. Página Sobre (Esconder botão)
    if (btnCriarContaSobre) {
        btnCriarContaSobre.style.display = 'none';
    }

  } else {
    // DESLOGADO
    if (btnCriarContaSobre) {
        btnCriarContaSobre.style.display = 'inline-block';
    }
  }

  // LÓGICA DE ADMIN
  if (userRole === 'Admin' || userRole === 'admin') {
      if (navCenter) {
          if (!document.querySelector('a[href="gerenciamento-usuarios.html"]')) {
              const adminLink = document.createElement('a');
              adminLink.href = 'gerenciamento-usuarios.html';
              adminLink.textContent = 'Painel Admin'; // Nome mais curto
              adminLink.style.color = '#FFD700'; 
              navCenter.appendChild(adminLink);
          }
      }
  }
});