function toggleMenu() {
  const nav = document.getElementById('navLinks');
  nav.classList.toggle('active');
}

document.addEventListener('DOMContentLoaded', function() {
  
  // ==========================================
  // 1. SELETORES
  // ==========================================
  const navRight = document.querySelector('.nav-right');
  const navCenter = document.querySelector('.nav-center');
  
  // Elementos da Home (Index)
  const heroDefault = document.getElementById('heroDefault');
  const heroLogged = document.getElementById('heroLogged');

  // Elemento da página Sobre
  const btnCriarContaSobre = document.getElementById('btnCriarContaSobre');
  
  // Dados da Sessão
  const userName = sessionStorage.getItem('currentUserName');
  const userRole = sessionStorage.getItem('currentUserRole');

  // ==========================================
  // 2. LÓGICA DE USUÁRIO LOGADO
  // ==========================================
  if (userName) {

    // A. Ajuste da Home (Hero vs Dashboard)
    if (heroDefault && heroLogged) {
        heroDefault.classList.add('hidden');   // Usa a classe .hidden do CSS
        heroDefault.style.display = 'none';    // Reforço inline
        
        heroLogged.classList.remove('hidden');
        heroLogged.style.display = 'flex';     // Reforço inline
    }

    // B. Ajuste da Navbar (Mostra Nome + Sair)
    if (navRight) {
        const userFirstName = userName.split(' ')[0]; 

        navRight.innerHTML = `
          <span class="user-greeting">Olá, ${userFirstName}</span>
          <a href="perfil.html" class="user-icon"><i class="fa-solid fa-user"></i></a>
          <a href="#" id="logoutBtn" class="auth-link-logout">Sair</a>
        `;

        // Lógica de Logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
          logoutBtn.addEventListener('click', function(e) {
              e.preventDefault();
              sessionStorage.clear(); // Limpa tudo
              window.location.href = 'autenticacao.html';
          });
        }
    }

    // C. AJUSTE PÁGINA SOBRE (Ocultar botão de criar conta)
    if (btnCriarContaSobre) {
        btnCriarContaSobre.style.display = 'none';
    }

  } else {
    // Se NÃO estiver logado (Deslogado)
    
    // Garante que o botão apareça na página Sobre
    if (btnCriarContaSobre) {
        btnCriarContaSobre.style.display = 'inline-block';
    }
  }

  // ==========================================
  // 3. LÓGICA DE ADMIN (Botão Gerenciamento)
  // ==========================================
  if (userRole === 'Admin' || userRole === 'admin') {
      if (navCenter) {
          // Evita duplicar se já existir
          if (!document.querySelector('a[href="gerenciamento-usuarios.html"]')) {
              const adminLink = document.createElement('a');
              adminLink.href = 'gerenciamento-usuarios.html';
              adminLink.textContent = 'Gerenciamento';
              navCenter.appendChild(adminLink);
          }
      }
  }
});