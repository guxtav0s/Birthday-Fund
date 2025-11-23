document.addEventListener("DOMContentLoaded", function() {

    // --- VERIFICAÇÃO DE SESSÃO ---
    const sessionEmail = sessionStorage.getItem("currentUserEmail");
    if (!sessionEmail) {
        window.location.href = "autenticacao.html";
        return;
    }

    // --- ELEMENTOS UI ---
    const profileUserName = document.getElementById("profileUserName");
    const profileUserHandle = document.getElementById("profileUserHandle");
    const btnSidebarLogout = document.getElementById("btnSidebarLogout");
    
    // Formulário Dados Pessoais
    const formDados = document.getElementById("perfilForm");
    const inputNome = document.getElementById("nome");
    const inputUsuario = document.getElementById("usuario");
    const inputEmail = document.getElementById("email");
    const inputSenhaAtual = document.getElementById("senhaAtual");
    const inputNovaSenha = document.getElementById("novaSenha");
    const inputConfirmarSenha = document.getElementById("confirmarSenha");
    const checkMostrarSenha = document.getElementById("mostrar-senha");
    const msgDados = document.getElementById("msgDados"); // Span de feedback

    // Formulário Banco
    const formBanco = document.getElementById("bancoForm");
    const inputTipoPix = document.getElementById("tipoPix");
    const inputChavePix = document.getElementById("chavePix");
    const inputTitularPix = document.getElementById("titularPix");
    const msgBanco = document.getElementById("msgBanco"); // Span de feedback

    // --- INICIALIZAÇÃO ---
    let usersDB = [];
    let currentUser = null;
    let currentUserIndex = -1;

    init();

    function init() {
        // 1. Carrega Banco
        usersDB = JSON.parse(localStorage.getItem("usersDB")) || [];

        // 2. Busca Usuário
        currentUserIndex = usersDB.findIndex(u => u.Email === sessionEmail);

        // 3. CORREÇÃO: Se for Admin e não estiver no banco, CRIA ELE AGORA
        if (currentUserIndex === -1 && sessionEmail === 'admin@admin.com') {
            const newAdmin = {
                ID_Usuario: 1,
                Nome: "Administrador",
                Email: "admin@admin.com",
                Usuario_Handle: "admin",
                Senha: "admin",
                Tipo_Usuario: "Admin",
                Data_Criacao: new Date().toISOString(),
                Dados_Bancarios: {}
            };
            usersDB.push(newAdmin);
            localStorage.setItem("usersDB", JSON.stringify(usersDB));
            currentUserIndex = usersDB.length - 1; // Pega o índice do novo
        }

        // 4. Define o objeto de referência
        if (currentUserIndex !== -1) {
            currentUser = usersDB[currentUserIndex];
            preencherCampos();
        } else {
            alert("Erro: Usuário não encontrado na base de dados.");
            sessionStorage.clear();
            window.location.href = "autenticacao.html";
        }
    }

    function preencherCampos() {
        // Header
        if(profileUserName) profileUserName.textContent = currentUser.Nome;
        if(profileUserHandle) profileUserHandle.textContent = `@${currentUser.Usuario_Handle}`;
        
        // Dados Pessoais
        if(inputNome) inputNome.value = currentUser.Nome;
        if(inputUsuario) inputUsuario.value = currentUser.Usuario_Handle || "";
        if(inputEmail) inputEmail.value = currentUser.Email;

        // Dados Bancários (Se existirem)
        if (currentUser.Dados_Bancarios) {
            if(inputTipoPix) inputTipoPix.value = currentUser.Dados_Bancarios.Tipo || 'cpf';
            if(inputChavePix) inputChavePix.value = currentUser.Dados_Bancarios.Chave || '';
            if(inputTitularPix) inputTitularPix.value = currentUser.Dados_Bancarios.Titular || '';
        }
    }

    // --- SALVAR DADOS PESSOAIS ---
    if (formDados) {
        formDados.addEventListener("submit", function(e) {
            e.preventDefault();
            let alteracoes = false;
            showMessage(msgDados, "", ""); // Limpa msg

            // 1. Atualiza Nome/Handle
            if (inputNome.value !== currentUser.Nome) { 
                currentUser.Nome = inputNome.value; 
                alteracoes = true; 
            }
            if (inputUsuario.value !== currentUser.Usuario_Handle) { 
                currentUser.Usuario_Handle = inputUsuario.value; 
                alteracoes = true; 
            }

            // 2. Atualiza Senha (com validações)
            if (inputNovaSenha.value) {
                if (inputSenhaAtual.value !== currentUser.Senha) {
                    showMessage(msgDados, "Senha atual incorreta.", "#ff4d4d");
                    return;
                }
                if (inputNovaSenha.value !== inputConfirmarSenha.value) {
                    showMessage(msgDados, "As novas senhas não coincidem.", "#ff4d4d");
                    return;
                }
                currentUser.Senha = inputNovaSenha.value;
                alteracoes = true;
            }

            // 3. Persiste
            if (alteracoes) {
                saveToDB();
                
                // Atualiza Sessão
                sessionStorage.setItem("currentUserName", currentUser.Nome);
                sessionStorage.setItem("currentUserHandle", currentUser.Usuario_Handle);
                
                // Atualiza UI Imediata
                profileUserName.textContent = currentUser.Nome;
                profileUserHandle.textContent = `@${currentUser.Usuario_Handle}`;
                
                // Limpa campos de senha
                inputSenhaAtual.value = "";
                inputNovaSenha.value = "";
                inputConfirmarSenha.value = "";

                showMessage(msgDados, "Perfil atualizado com sucesso!", "#4CAF50");
            } else {
                showMessage(msgDados, "Nenhuma alteração detectada.", "#FFD700");
            }
        });
    }

    // --- SALVAR DADOS BANCÁRIOS ---
    if (formBanco) {
        formBanco.addEventListener("submit", function(e) {
            e.preventDefault();
            
            // Atualiza objeto na memória
            currentUser.Dados_Bancarios = {
                Tipo: inputTipoPix.value,
                Chave: inputChavePix.value,
                Titular: inputTitularPix.value
            };

            // Persiste
            saveToDB();
            
            showMessage(msgBanco, "Dados bancários salvos com sucesso!", "#4CAF50");
        });
    }

    // --- FUNÇÕES AUXILIARES ---
    function saveToDB() {
        // Como 'currentUser' é uma referência direta ao objeto dentro de 'usersDB',
        // basta salvar o array 'usersDB' de volta no localStorage.
        localStorage.setItem("usersDB", JSON.stringify(usersDB));
    }

    function showMessage(element, text, color) {
        if(element) {
            element.textContent = text;
            element.style.color = color;
            // Limpa mensagem após 3s
            setTimeout(() => { element.textContent = ""; }, 3000);
        } else {
            // Fallback se o span não existir
            if(text) alert(text);
        }
    }

    // Toggle Senha
    if(checkMostrarSenha) {
        checkMostrarSenha.addEventListener("change", function() {
            const type = this.checked ? "text" : "password";
            inputSenhaAtual.type = type;
            inputNovaSenha.type = type;
            inputConfirmarSenha.type = type;
        });
    }

    // Navegação de Abas
    window.switchTab = function(tabName, btnElement) {
        // UI Botões
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        if(btnElement) btnElement.classList.add('active');

        // UI Seções
        document.querySelectorAll('.tab-view').forEach(el => el.classList.add('hidden'));
        const targetView = document.getElementById(`view-${tabName}`);
        if(targetView) targetView.classList.remove('hidden');
    }

    // Logout
    if(btnSidebarLogout) {
        btnSidebarLogout.addEventListener('click', () => {
            sessionStorage.clear();
            window.location.href = 'autenticacao.html';
        });
    }
});