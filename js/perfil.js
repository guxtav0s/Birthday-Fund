// Mantida fora do DOMContentLoaded para garantir que o HTML encontre a função
window.switchTab = function(tabName, btnElement) {
    // Remove active de todos os botões
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    
    // Adiciona ao clicado (se passado)
    if(btnElement) btnElement.classList.add('active');

    // Esconde todas as views
    document.querySelectorAll('.tab-view').forEach(el => {
        el.classList.add('hidden');
        el.style.display = 'none'; 
    });
    
    // Mostra a view alvo
    const targetView = document.getElementById(`view-${tabName}`);
    if(targetView) {
        targetView.classList.remove('hidden');
        targetView.style.display = 'block'; 
    }
};

document.addEventListener("DOMContentLoaded", function() {

    // --- CONFIGURAÇÃO API ---
    const API_BASE_URL = "http://localhost:3000";
    const token = localStorage.getItem("token");

    // --- VERIFICAÇÃO DE SESSÃO ---
    if (!token) {
        window.location.href = "autenticacao.html";
        return;
    }

    // --- ELEMENTOS UI (Perfil Pessoal) ---
    const profileUserName = document.getElementById("profileUserName");
    const profileUserHandle = document.getElementById("profileUserHandle");
    const btnSidebarLogout = document.getElementById("btnSidebarLogout");
    
    const formDados = document.getElementById("perfilForm");
    const inputNome = document.getElementById("nome");
    const inputEmail = document.getElementById("email");
    const msgDados = document.getElementById("msgDados"); 

    // Senhas
    const checkMostrarSenha = document.getElementById("mostrar-senha");
    const inputSenhaAtual = document.getElementById("senhaAtual");
    const inputNovaSenha = document.getElementById("novaSenha");
    const inputConfirmarSenha = document.getElementById("confirmarSenha");

    // --- ELEMENTOS UI (Dados Bancários) ---
    const formBanco = document.getElementById("bancoForm");
    const inputTipoPix = document.getElementById("tipoPix");
    const inputChavePix = document.getElementById("chavePix");
    const inputTitularPix = document.getElementById("titularPix");
    const msgBanco = document.getElementById("msgBanco");

    // Inicializa a aba padrão (Dados)
    const defaultTab = document.querySelector('.nav-item.active') || document.querySelector('.nav-item');
    if(defaultTab) window.switchTab('dados', defaultTab);

    // --- RECUPERAÇÃO DO ID DO USUÁRIO ---
    let userId = null;
    try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            userId = parsedUser.ID_Usuario || parsedUser.id || parsedUser.userId;
        }
    } catch (error) {
        console.error("Erro ao ler dados locais:", error);
    }

    if (userId) {
        carregarDados(userId);
    } else {
        console.error("ID não encontrado.");
    }

    // --- 2. BUSCAR DADOS (GET) ---
    async function carregarDados(id) {
        try {
            const response = await fetch(`${API_BASE_URL}/usuario/${id}`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            if (response.ok) {
                const userData = await response.json();
                
                // Preenche a tela
                if(profileUserName) profileUserName.textContent = userData.Nome_Usuario || "Usuário";
                if(profileUserHandle) profileUserHandle.textContent = userData.Email_Usuario || "";
                
                if(inputNome) inputNome.value = userData.Nome_Usuario || "";
                if(inputEmail) inputEmail.value = userData.Email_Usuario || "";

                // Se houver dados bancários salvos no usuário, preencher aqui também
                // (Depende se o backend retorna isso no GET /usuario/:id)

            } else {
                console.error("Erro na resposta da API:", response.status);
            }
        } catch (error) {
            console.error("Erro de conexão (fetch):", error);
        }
    }

    // --- 3. ATUALIZAR DADOS PESSOAIS (USANDO A NOVA ROTA /auth/update-profile) ---
    if (formDados) {
        formDados.addEventListener("submit", async function(e) {
            e.preventDefault();
            msgDados.textContent = "";

            // Inputs de senha
            const senhaAtual = inputSenhaAtual.value.trim();
            const novaSenha = inputNovaSenha.value.trim();
            const confirmar = inputConfirmarSenha.value.trim();

            // Validação de Senha no Frontend
            if (novaSenha || confirmar) {
                if (!senhaAtual) {
                    msgDados.style.color = "red";
                    msgDados.textContent = "Para alterar a senha, informe a senha ATUAL.";
                    return;
                }
                if (novaSenha !== confirmar) {
                    msgDados.style.color = "red";
                    msgDados.textContent = "A nova senha e a confirmação não coincidem.";
                    return;
                }
            }

            const btn = formDados.querySelector("button[type='submit']");
            const oldText = btn.textContent;
            btn.textContent = "Salvando...";
            btn.disabled = true;

            try {
                // Monta o payload exatamente como sua rota espera
                const payload = {
                    Nome_Usuario: inputNome.value
                };

                // Só envia senha se tiver preenchido
                if (senhaAtual && novaSenha) {
                    payload.senhaAtual = senhaAtual;
                    payload.novaSenha = novaSenha;
                }

                // CHAMA A ROTA ESPECÍFICA DO AUTH.JS
                const response = await fetch(`${API_BASE_URL}/auth/update-profile`, {
                    method: "PUT",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(payload)
                });

                const data = await response.json();

                if (response.ok) {
                    msgDados.style.color = "green";
                    msgDados.textContent = "Perfil atualizado com sucesso!";
                    
                    // Limpa campos de senha
                    inputSenhaAtual.value = "";
                    inputNovaSenha.value = "";
                    inputConfirmarSenha.value = "";

                    // Atualiza visual e localStorage
                    if(data.usuario) {
                        if(profileUserName) profileUserName.textContent = data.usuario.Nome_Usuario;
                        
                        // Atualiza o objeto user no localStorage mantendo o ID
                        const currentUser = JSON.parse(localStorage.getItem("user")) || {};
                        const newUser = { ...currentUser, ...data.usuario };
                        localStorage.setItem("user", JSON.stringify(newUser));
                    }
                } else {
                    msgDados.style.color = "red";
                    msgDados.textContent = data.error || "Erro ao atualizar.";
                }

            } catch (error) {
                console.error(error);
                msgDados.style.color = "red";
                msgDados.textContent = "Erro de conexão.";
            } finally {
                btn.textContent = oldText;
                btn.disabled = false;
            }
        });
    }

    // --- 4. SALVAR DADOS BANCÁRIOS (Preservado) ---
    if (formBanco) {
        formBanco.addEventListener("submit", async function(e) {
            e.preventDefault();
            msgBanco.textContent = "";

            const btn = formBanco.querySelector("button[type='submit']");
            const oldText = btn.textContent;
            btn.textContent = "Salvando...";
            btn.disabled = true;

            try {
                // Aqui você implementará a lógica de salvar banco futuramente
                // Por enquanto simulamos um delay
                await new Promise(r => setTimeout(r, 1000));
                
                msgBanco.style.color = "orange";
                msgBanco.textContent = "Integração bancária em breve!";
                
            } catch (error) {
                console.error(error);
                msgBanco.style.color = "red";
                msgBanco.textContent = "Erro ao salvar.";
            } finally {
                btn.textContent = oldText;
                btn.disabled = false;
            }
        });
    }

    // --- 5. VISUAL: MOSTRAR SENHA ---
    if(checkMostrarSenha) {
        checkMostrarSenha.addEventListener("change", function() {
            const type = this.checked ? "text" : "password";
            if(inputSenhaAtual) inputSenhaAtual.type = type;
            if(inputNovaSenha) inputNovaSenha.type = type;
            if(inputConfirmarSenha) inputConfirmarSenha.type = type;
        });
    }

    // --- 6. LOGOUT ---
    if(btnSidebarLogout) {
        btnSidebarLogout.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.clear();
            window.location.href = 'autenticacao.html';
        });
    }
});