function toggleMenu() {
  const nav = document.getElementById('navLinks');
  nav.classList.toggle('active');
}

document.addEventListener('DOMContentLoaded', function() {
  
  // Elementos
  const navRight = document.querySelector('.nav-right');
  const navCenter = document.querySelector('.nav-center');
  
  // Dados da Sessão (Definidos no Login/Registro)
  const userName = sessionStorage.getItem('currentUserName');
  const userRole = sessionStorage.getItem('currentUserRole');

  // Verifica telas de Home (Hero) para alternância
  const heroDefault = document.getElementById('heroDefault');
  const heroLogged = document.getElementById('heroLogged');

  // Lógica de Exibição da Navbar Logada
  if (userName && navRight) {
      const userFirstName = userName.split(' ')[0]; 

      // Injeta HTML do usuário logado
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

  // LÓGICA DE ADMIN (Botão Gerenciamento)
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