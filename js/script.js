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
    const token = localStorage.getItem("token");
    
    // Tenta pegar o objeto user salvo
    const storedUser = localStorage.getItem("user");
    let userData = null;
    let firstName = "Usuário";

    // Proteção para não quebrar se o JSON for inválido
    if (storedUser) {
        try {
            userData = JSON.parse(storedUser);
            // Pega o nome correto vindo do Banco (Nome_Usuario) ou falback para outras versões
            const fullName = userData.Nome_Usuario || userData.userName || userData.nome || "Visitante";
            firstName = fullName.split(' ')[0];
        } catch (e) {
            console.error("Erro ao ler usuário:", e);
        }
    }

    if (token && userData) {
        // --- USUÁRIO LOGADO ---

        // 1. Alternar visual da Home
        if (heroDefault && heroLogged) {
            heroDefault.classList.add('hidden');
            heroDefault.style.display = 'none'; 
            
            heroLogged.classList.remove('hidden');
            heroLogged.style.display = 'flex';
        }

        // 2. Atualizar Barra de Navegação
        if (navRight) {
            navRight.innerHTML = `
                <span class="user-greeting" style="margin-right:15px; color:#FFD700; font-weight:bold;">Olá, ${firstName}</span>
                <a href="perfil.html" class="user-icon" style="color:white; margin-right:15px;" title="Meu Perfil"><i class="fa-solid fa-user"></i></a>
                <a href="#" id="logoutBtn" class="auth-link-logout" style="background:none; border:none; cursor:pointer; color: white; font-size:16px;">Sair</a>
            `;

            // Lógica de Logout
            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    // Limpa tudo
                    localStorage.removeItem("token");
                    localStorage.removeItem("userEmail");
                    localStorage.removeItem("user");
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
            heroDefault.style.display = 'flex'; 
            heroLogged.classList.add('hidden');
            heroLogged.style.display = 'none';
        }

        if (btnCriarContaSobre) {
            btnCriarContaSobre.style.display = 'inline-block';
        }
    }
});