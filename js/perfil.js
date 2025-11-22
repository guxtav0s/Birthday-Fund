document.addEventListener("DOMContentLoaded", function() {

    // Elementos do DOM
    const form = document.getElementById("perfilForm");
    const profileUserName = document.getElementById("profileUserName");
    const profileUserHandle = document.getElementById("profileUserHandle");
    
    const inputNome = document.getElementById("nome");
    const inputUsuario = document.getElementById("usuario");
    const inputEmail = document.getElementById("email");
    const inputSenhaAtual = document.getElementById("senhaAtual");
    const inputNovaSenha = document.getElementById("novaSenha");
    const inputConfirmarSenha = document.getElementById("confirmarSenha");
    
    const checkMostrarSenha = document.getElementById("mostrar-senha");
    const mensagemGeral = document.getElementById("mensagemGeral");

    // Verifica Sessão
    const sessionEmail = sessionStorage.getItem("currentUserEmail");
    if (!sessionEmail) {
        window.location.href = "autenticacao.html";
        return;
    }

    // ==========================================
    // 1. CARREGAR DADOS DO BANCO
    // ==========================================
    let usersDB = JSON.parse(localStorage.getItem("usersDB")) || [];
    let currentUser = usersDB.find(u => u.Email === sessionEmail);

    // Fallback para Admin Hardcoded
    if (!currentUser && sessionEmail === 'admin@admin.com') {
        currentUser = { 
            Nome: "Administrador", 
            Email: "admin@admin.com", 
            Usuario_Handle: "admin", 
            Senha: "admin" 
        };
    }

    if (currentUser) {
        // Preenche a tela com os dados do objeto DER
        profileUserName.textContent = currentUser.Nome;
        profileUserHandle.textContent = `@${currentUser.Usuario_Handle}`;
        
        inputNome.value = currentUser.Nome;
        inputUsuario.value = currentUser.Usuario_Handle || "";
        inputEmail.value = currentUser.Email; // Readonly
    }

    // ==========================================
    // 2. SALVAR ALTERAÇÕES
    // ==========================================
    form.addEventListener("submit", function(e) {
        e.preventDefault();
        let alteracoes = false;
        mensagemGeral.textContent = "";

        // A. Alteração de Dados Cadastrais
        if (inputNome.value !== currentUser.Nome) {
            currentUser.Nome = inputNome.value;
            alteracoes = true;
        }
        if (inputUsuario.value !== currentUser.Usuario_Handle) {
            currentUser.Usuario_Handle = inputUsuario.value;
            alteracoes = true;
        }

        // B. Alteração de Senha
        if (inputNovaSenha.value) {
            // Validações
            if (inputSenhaAtual.value !== currentUser.Senha) {
                mensagemGeral.textContent = "Senha atual incorreta.";
                mensagemGeral.style.color = "red";
                return;
            }
            if (inputNovaSenha.value !== inputConfirmarSenha.value) {
                mensagemGeral.textContent = "As novas senhas não coincidem.";
                mensagemGeral.style.color = "red";
                return;
            }
            
            currentUser.Senha = inputNovaSenha.value;
            alteracoes = true;
        }

        // C. Persistência
        if (alteracoes) {
            // Se não for o admin fake, salva no localStorage
            if (sessionEmail !== 'admin@admin.com') {
                const index = usersDB.findIndex(u => u.Email === sessionEmail);
                if (index !== -1) {
                    usersDB[index] = currentUser;
                    localStorage.setItem("usersDB", JSON.stringify(usersDB));
                }
            }

            // Atualiza Sessão (para refletir no header imediatamente)
            sessionStorage.setItem("currentUserName", currentUser.Nome);
            sessionStorage.setItem("currentUserHandle", currentUser.Usuario_Handle);

            // Feedback
            mensagemGeral.textContent = "Alterações salvas com sucesso!";
            mensagemGeral.style.color = "green";
            
            // Limpa campos de senha
            inputSenhaAtual.value = "";
            inputNovaSenha.value = "";
            inputConfirmarSenha.value = "";

            setTimeout(() => window.location.reload(), 1000);
        } else {
            mensagemGeral.textContent = "Nenhuma alteração detectada.";
            mensagemGeral.style.color = "#FFD700";
        }
    });

    // Toggle Mostrar Senha
    checkMostrarSenha.addEventListener("change", function() {
        const type = this.checked ? "text" : "password";
        inputSenhaAtual.type = type;
        inputNovaSenha.type = type;
        inputConfirmarSenha.type = type;
    });
});