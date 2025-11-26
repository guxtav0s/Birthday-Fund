document.addEventListener("DOMContentLoaded", function() {

    const API_BASE_URL = "http://localhost:3000";

    // --- FUNÇÃO PARA OBTER PARÂMETROS DA URL ---
    const getUrlParameter = (name) => {
        // Função para ler o valor dos parâmetros (ex: ?token=VALOR&email=VALOR)
        name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
        const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
        const results = regex.exec(location.search);
        return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
    };
    // ------------------------------------------

    // Tenta obter o token e email da URL
    const urlToken = getUrlParameter('token');
    const urlEmail = getUrlParameter('email');
    
    let emailToReset = null;

    if (urlToken && urlEmail) {
        // FLUXO 1: Via link de e-mail (URL)
        emailToReset = urlEmail;
    } else {
        // FLUXO 2: Via sessão (o fluxo original, caso o usuário tenha digitado o código)
        emailToReset = sessionStorage.getItem("resetEmail");
    }
    
    // --- VALIDAÇÃO DE FLUXO ---
    // Se não tiver email de jeito nenhum, redireciona.
    if (!emailToReset) {
        alert("Fluxo inválido. Por favor, inicie pelo 'Esqueci minha senha'.");
        window.location.href = "esqueci-senha.html"; 
        return;
    }


    const form = document.getElementById("formRedefinir");
    const tokenInput = document.getElementById("token");
    const senhaInput = document.getElementById("senha");
    const confirmarSenhaInput = document.getElementById("confirmarSenha");
    const btnRedefinir = document.getElementById("btnRedefinir");

    const senhaError = document.getElementById("senhaError");
    const confirmarError = document.getElementById("confirmarError");
    const mensagemGeral = document.getElementById("mensagemGeral");
    
    // --- PREENCHE TOKEN SE VIER DA URL ---
    if (urlToken && tokenInput) {
        tokenInput.value = urlToken;
        // Opcional: Se o campo 'token' for visível, você pode torná-lo somente leitura
        // tokenInput.readOnly = true; 
    }

    // Toggle Senha (Visualizar/Ocultar)
    document.querySelectorAll('.toggle-btn').forEach(icon => {
        icon.addEventListener('click', function() {
            const input = this.previousElementSibling;
            if (input.type === "password") {
                input.type = "text";
                this.classList.remove("fa-eye");
                this.classList.add("fa-eye-slash");
            } else {
                input.type = "password";
                this.classList.remove("fa-eye-slash");
                this.classList.add("fa-eye");
            }
        });
    });

    // Validações (Mantenha as suas validações de senha aqui)
    const validateFields = () => {
        let isValid = true;
        // ... (Insira suas regras de validação aqui) ...
        
        // Exemplo de validação mínima (6 caracteres)
        if (senhaInput.value.length < 6) {
            senhaError.textContent = "A senha deve ter no mínimo 6 caracteres.";
            isValid = false;
        } else {
            senhaError.textContent = "";
        }
        
        if (senhaInput.value !== confirmarSenhaInput.value) {
            confirmarError.textContent = "As senhas não coincidem.";
            isValid = false;
        } else {
            confirmarError.textContent = "";
        }

        btnRedefinir.disabled = !isValid;
    };

    senhaInput.addEventListener('input', validateFields);
    confirmarSenhaInput.addEventListener('input', validateFields);


    // --- ATUALIZAÇÃO DA SUBMISSÃO DO FORMULÁRIO ---
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        if (btnRedefinir.disabled) return; // Não submete se estiver inválido

        btnRedefinir.disabled = true;
        const originalText = btnRedefinir.textContent;
        btnRedefinir.textContent = "Redefinindo...";
        mensagemGeral.textContent = ""; // Limpa mensagens de erro anteriores

        try {
            // Prioriza o token da URL, se existir, caso contrário, usa o valor do input (session)
            const tokenValue = urlToken || tokenInput.value;
            
            if (!tokenValue) {
                mensagemGeral.textContent = "Token de redefinição não encontrado ou expirado.";
                mensagemGeral.style.color = "#ff6b6b";
                btnRedefinir.disabled = false;
                btnRedefinir.textContent = originalText;
                return;
            }

            const payload = {
                Email_Usuario: emailToReset, // Usa o email obtido (URL ou Session)
                token: tokenValue, // Usa o token obtido (URL ou Input)
                newPassword: senhaInput.value
            };

            const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const data = await response.json().catch(() => ({}));

            if (response.ok) {
                // SUCESSO
                mensagemGeral.style.color = "#4CAF50";
                mensagemGeral.textContent = "Senha redefinida com sucesso!";
                sessionStorage.removeItem("resetEmail"); // Limpa sessão

                setTimeout(() => {
                    window.location.href = "autenticacao.html";
                }, 2000);
            } else {
                // ERRO (Ex: Token inválido)
                mensagemGeral.textContent = data.message || "Código inválido ou expirado.";
                mensagemGeral.style.color = "#ff6b6b";
                btnRedefinir.disabled = false;
                btnRedefinir.textContent = originalText;
            }

        } catch (error) {
            console.error(error);
            mensagemGeral.textContent = "Erro de conexão. Tente novamente.";
            btnRedefinir.disabled = false;
            btnRedefinir.textContent = originalText;
        }
    });
});