document.addEventListener("DOMContentLoaded", function() {

    // --- CONFIGURAÇÃO API ---
    const API_BASE_URL = "http://localhost:3000";
    const token = localStorage.getItem("token");

    // --- VERIFICAÇÃO DE SESSÃO ---
    if (!token) {
        alert("Você precisa estar logado.");
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
    const msgDados = document.getElementById("msgDados"); 

    // Formulário Banco
    const formBanco = document.getElementById("bancoForm");
    const inputTipoPix = document.getElementById("tipoPix");
    const inputChavePix = document.getElementById("chavePix");
    const inputTitularPix = document.getElementById("titularPix");
    const msgBanco = document.getElementById("msgBanco");

    // --- FUNÇÕES AUXILIARES ---
    function getUserIdFromToken() {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
            const decoded = JSON.parse(jsonPayload);
            return decoded.id || decoded.ID_Usuario || 1; 
        } catch (e) {
            return 1;
        }
    }

    function showMessage(element, text, color) {
        if(element) {
            element.textContent = text;
            element.style.color = color;
            setTimeout(() => { element.textContent = ""; }, 4000);
        } else {
            alert(text);
        }
    }

    // --- 1. CARREGAR DADOS (GET) ---
    async function loadProfile() {
        const userId = getUserIdFromToken();
        
        try {
            const response = await fetch(`${API_BASE_URL}/usuario/${userId}`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            if (response.ok) {
                const user = await response.json();
                if (user) {
                    localStorage.setItem("user", JSON.stringify(user));
                }
                
                // Popula UI Lateral
                if(profileUserName) profileUserName.textContent = user.Nome_Usuario || user.Nome || "Usuário";
                if(profileUserHandle) profileUserHandle.textContent = user.Email_Usuario || user.Email;

                // Popula Formulário Dados
                if(inputNome) inputNome.value = user.Nome_Usuario || user.Nome || "";
                if(inputEmail) inputEmail.value = user.Email_Usuario || user.Email || "";
                
                // Se a API retornar esses campos no futuro, basta mapear aqui:
                if(inputUsuario && user.Nickname) inputUsuario.value = user.Nickname;
                
                if(inputChavePix && user.Chave_Pix) inputChavePix.value = user.Chave_Pix;
                if(inputTitularPix && user.Titular_Pix) inputTitularPix.value = user.Titular_Pix;
                if(inputTipoPix && user.Tipo_Pix) inputTipoPix.value = user.Tipo_Pix;

            } else {
                console.error("Erro ao carregar perfil:", response.status);
            }
        } catch (error) {
            console.error("Erro de conexão:", error);
        }
    }

    // Inicializa
    loadProfile();


    // --- 2. ATUALIZAR DADOS (PUT - Simulação/Preparação) ---
    if(formDados) {
        formDados.addEventListener("submit", async function(e) {
            e.preventDefault();
            
            // Validação simples de senha
            if (inputNovaSenha.value && inputNovaSenha.value !== inputConfirmarSenha.value) {
                showMessage(msgDados, "As novas senhas não coincidem.", "red");
                return;
            }

            const userId = getUserIdFromToken();
            const payload = {
                Nome_Usuario: inputNome.value,
                // Envia senha nova apenas se o usuário digitou
                ...(inputSenhaAtual.value ? { senhaAtual: inputSenhaAtual.value } : {}),
                ...(inputNovaSenha.value ? { novaSenha: inputNovaSenha.value } : {})
            };

            const btn = formDados.querySelector("button");
            const oldText = btn.textContent;
            btn.textContent = "Salvando...";
            btn.disabled = true;

            try {
                // ATENÇÃO: Esta rota (PUT) não estava no seu Postman, mas é o padrão.
                // Se der 404, é porque o backend ainda não criou a rota.
                const response = await fetch(`${API_BASE_URL}/auth/update-profile`, {
                    method: "PUT", // ou PATCH
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    showMessage(msgDados, "Dados atualizados com sucesso!", "#2ecc71");
                    // Atualiza nome no localStorage para refletir na navbar sem refresh
                    localStorage.setItem("userName", inputNome.value);
                    if(inputEmail.value) localStorage.setItem("userEmail", inputEmail.value);
                } else {
                    let msg = await response.json();
                    showMessage(msgDados, msg.error, "red");
                }
            } catch (error) {
                showMessage(msgDados, "Erro de conexão.", "red");
            } finally {
                btn.textContent = oldText;
                btn.disabled = false;
            }
        });
    }

    // --- 3. DADOS BANCÁRIOS ---
    if(formBanco) {
        formBanco.addEventListener("submit", async function(e) {
            e.preventDefault();
            
            const userId = getUserIdFromToken();
            const payload = {
                Tipo_Pix: inputTipoPix.value,
                Chave_Pix: inputChavePix.value,
                Titular_Pix: inputTitularPix.value
            };

            const btn = formBanco.querySelector("button");
            const oldText = btn.textContent;
            btn.textContent = "Salvando...";
            btn.disabled = true;

            try {
                // Tentativa de salvar dados bancários na mesma rota de usuário ou específica
                const response = await fetch(`${API_BASE_URL}/usuario/${userId}`, {
                    method: "PUT", // Assumindo atualização do objeto usuário
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    showMessage(msgBanco, "Dados bancários salvos!", "#2ecc71");
                } else {
                    showMessage(msgBanco, "Erro ao salvar (Verifique API).", "red");
                }
            } catch (error) {
                showMessage(msgBanco, "Erro de conexão.", "red");
            } finally {
                btn.textContent = oldText;
                btn.disabled = false;
            }
        });
    }

    // --- VISUAL: MOSTRAR SENHA ---
    if(checkMostrarSenha) {
        checkMostrarSenha.addEventListener("change", function() {
            const type = this.checked ? "text" : "password";
            if(inputSenhaAtual) inputSenhaAtual.type = type;
            if(inputNovaSenha) inputNovaSenha.type = type;
            if(inputConfirmarSenha) inputConfirmarSenha.type = type;
        });
    }

    // --- NAVEGAÇÃO DE ABAS (Dados Pessoais vs Bancários) ---
    window.switchTab = function(tabName, btnElement) {
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        if(btnElement) btnElement.classList.add('active');

        document.querySelectorAll('.tab-view').forEach(el => el.classList.add('hidden'));
        const targetView = document.getElementById(`view-${tabName}`);
        if(targetView) targetView.classList.remove('hidden');
    }

    // Logout Lateral
    if(btnSidebarLogout) {
        btnSidebarLogout.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.clear();
            window.location.href = "autenticacao.html";
        });
    }
});