// --- 1. FUNÇÃO DE ABAS (GLOBAL) ---
// Definida fora do DOMContentLoaded para garantir que exista sempre
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

    // --- ELEMENTOS UI ---
    const profileUserName = document.getElementById("profileUserName");
    const profileUserHandle = document.getElementById("profileUserHandle");
    const btnSidebarLogout = document.getElementById("btnSidebarLogout");
    
    const inputNome = document.getElementById("nome");
    const inputEmail = document.getElementById("email");
    const formDados = document.getElementById("perfilForm");
    const msgDados = document.getElementById("msgDados"); 

    // Senha (Visual)
    const checkMostrarSenha = document.getElementById("mostrar-senha");
    const inputSenhaAtual = document.getElementById("senhaAtual");
    const inputNovaSenha = document.getElementById("novaSenha");
    const inputConfirmarSenha = document.getElementById("confirmarSenha");

    // Inicializa a aba padrão (Dados)
    const defaultTab = document.querySelector('.nav-item.active') || document.querySelector('.nav-item');
    if(defaultTab) window.switchTab('dados', defaultTab);

    // --- 2. RECUPERAÇÃO DO ID DO USUÁRIO ---
    let userId = null;
    
    if (token) {
        try {
            const storedUser = localStorage.getItem("user");
            console.log("Conteúdo do localStorage 'user':", storedUser); // OLHE NO CONSOLE

            if (storedUser) {
                const parsedUser = JSON.parse(storedUser);
                // Tenta encontrar o ID com diferentes nomes possíveis
                userId = parsedUser.ID_Usuario || parsedUser.id || parsedUser.userId;
                
                if(!userId) {
                    console.warn("Aviso: Objeto usuário existe, mas sem campo de ID compatível.");
                }
            }
        } catch (error) {
            console.error("Erro ao ler dados locais:", error);
        }
    } else {
        alert("Sessão expirada. Faça login novamente.");
        window.location.href = "autenticacao.html";
        return; 
    }

    // --- 3. BUSCAR DADOS (Somente se tiver ID) ---
    if (userId) {
        carregarDados(userId);
    } else {
        console.error("ID não encontrado. Impossível buscar dados.");
        if(profileUserName) profileUserName.textContent = "Erro de Sessão";
        if(profileUserHandle) profileUserHandle.textContent = "Faça login novamente";
    }

    async function carregarDados(id) {
        try {
            console.log(`Buscando dados na API: ${API_BASE_URL}/usuario/${id}`);
            
            const response = await fetch(`${API_BASE_URL}/usuario/${id}`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            if (response.ok) {
                const userData = await response.json();
                console.log("Dados recebidos da API:", userData);

                // Preenche a tela
                if(profileUserName) profileUserName.textContent = userData.Nome_Usuario || "Usuário";
                if(profileUserHandle) profileUserHandle.textContent = userData.Email_Usuario || "";
                if(inputNome) inputNome.value = userData.Nome_Usuario || "";
                if(inputEmail) inputEmail.value = userData.Email_Usuario || "";

                // Atualiza o localStorage para manter sincronizado (opcional)
                // localStorage.setItem("user", JSON.stringify(userData));

            } else {
                console.error("Erro na resposta da API:", response.status);
            }
        } catch (error) {
            console.error("Erro de conexão (fetch):", error);
        }
    }

    // --- 4. ATUALIZAR DADOS (PUT) ---
    if (formDados) {
        formDados.addEventListener("submit", async function(e) {
            e.preventDefault();
            
            if(!userId) {
                alert("Erro: ID de usuário não identificado. Faça login novamente.");
                return;
            }

            const btn = formDados.querySelector("button[type='submit']");
            const oldText = btn.textContent;
            btn.textContent = "Salvando...";
            btn.disabled = true;
            msgDados.textContent = "";

            try {
                const payload = {
                    Nome_Usuario: inputNome.value,
                    Email_Usuario: inputEmail.value
                };

                const response = await fetch(`${API_BASE_URL}/usuario/${userId}`, {
                    method: "PUT", // Se der 404, seu backend pode não ter essa rota ainda
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    const updatedUser = await response.json();
                    msgDados.style.color = "green";
                    msgDados.textContent = "Dados atualizados!";
                    
                    // Atualiza visual
                    if(profileUserName) profileUserName.textContent = updatedUser.Nome_Usuario;
                    // Atualiza cache
                    localStorage.setItem("user", JSON.stringify(updatedUser));
                } else {
                    msgDados.style.color = "red";
                    msgDados.textContent = "Erro ao atualizar.";
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

    // --- 5. OUTRAS FUNCIONALIDADES ---
    
    // Mostrar/Ocultar Senha
    if(checkMostrarSenha) {
        checkMostrarSenha.addEventListener("change", function() {
            const type = this.checked ? "text" : "password";
            if(inputSenhaAtual) inputSenhaAtual.type = type;
            if(inputNovaSenha) inputNovaSenha.type = type;
            if(inputConfirmarSenha) inputConfirmarSenha.type = type;
        });
    }

    // Logout
    if(btnSidebarLogout) {
        btnSidebarLogout.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.clear();
            window.location.href = 'autenticacao.html';
        });
    }
});