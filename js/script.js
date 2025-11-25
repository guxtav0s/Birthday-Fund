function toggleMenu() {
    const nav = document.getElementById('navLinks');
    nav.classList.toggle('active');
}

document.addEventListener('DOMContentLoaded', function() {

    // --- ELEMENTOS ---
    const navRight = document.querySelector('.nav-right');
    const navCenter = document.querySelector('.nav-center');
    const btnCriarContaSobre = document.getElementById('btnCriarContaSobre');
    
    // Home Elements
    const heroDefault = document.getElementById('heroDefault');
    const heroLogged = document.getElementById('heroLogged');

    // --- VERIFICAÇÃO DE AUTENTICAÇÃO ---
    // Agora verificamos o TOKEN salvo no Login
    const token = localStorage.getItem("token");
    
    // Tenta pegar o nome salvo (se houver) ou usa o email
    // Nota: Idealmente a API retornaria o nome no login. Por enquanto improvisamos.
    let userName = localStorage.getItem("userName") || localStorage.getItem("userEmail") || "Usuário";

    if (token) {
        // --- USUÁRIO LOGADO ---

        // 1. Alternar visual da Home (Esconde apresentação, mostra dashboard)
        if (heroDefault && heroLogged) {
            heroDefault.classList.add('hidden');
            heroDefault.style.display = 'none'; 
            
            heroLogged.classList.remove('hidden');
            heroLogged.style.display = 'flex';
        }

        // 2. Atualizar Navbar
        if (navRight) {
            // Pega só o primeiro nome se for um nome completo
            const firstName = userName.includes('@') ? userName.split('@')[0] : userName.split(' ')[0];
            
            navRight.innerHTML = `
                <span class="user-greeting" style="margin-right:15px; color:#FFD700; font-weight:bold;">Olá, ${firstName}</span>
                <a href="perfil.html" class="user-icon" style="color:white; margin-right:15px;"><i class="fa-solid fa-user"></i></a>
                <button id="logoutBtn" class="auth-link-logout">Sair</button>
            `;

            // Lógica de Logout
            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    // Limpa tudo
                    localStorage.removeItem("token");
                    localStorage.removeItem("userEmail");
                    localStorage.removeItem("userData");
                    window.location.href = 'autenticacao.html';
                });
            }
        }

        // 3. Esconder botão na página Sobre
        if (btnCriarContaSobre) {
            btnCriarContaSobre.style.display = 'none';
        }

    } else {
        // --- USUÁRIO DESLOGADO ---
        if (heroDefault && heroLogged) {
            heroDefault.classList.remove('hidden');
            heroDefault.style.display = 'flex'; // ou block
            heroLogged.classList.add('hidden');
            heroLogged.style.display = 'none';
        }

        if (btnCriarContaSobre) {
            btnCriarContaSobre.style.display = 'inline-block';
        }
    }
});