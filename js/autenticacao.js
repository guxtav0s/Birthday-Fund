document.addEventListener("DOMContentLoaded", function() {

    // --- CONFIGURAÇÃO DA API ---
    const API_BASE_URL = "http://localhost:3000";

    // --- ELEMENTOS DE NAVEGAÇÃO (TABS) ---
    const tabLogin = document.getElementById("tabLogin");
    const tabRegister = document.getElementById("tabRegister");
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");
    const switchToRegister = document.getElementById("switchToRegister");
    const switchToLogin = document.getElementById("switchToLogin");
    const slider = document.querySelector(".form-slider");

    // Função de alternância de abas
    function showForm(formToShow, tabToActivate) {
        tabLogin.classList.remove("active");
        tabRegister.classList.remove("active");
        
        tabToActivate.classList.add("active");

        if (formToShow === "register") {
            slider.classList.add("show-register");
        } else {
            slider.classList.remove("show-register");
        }
        
        // Limpar mensagens de erro ao trocar de aba
        document.getElementById("login-geral-error").textContent = "";
        document.getElementById("reg-geral-error").textContent = "";
    }

    tabLogin.addEventListener("click", () => showForm("login", tabLogin));
    tabRegister.addEventListener("click", () => showForm("register", tabRegister));
    switchToRegister.addEventListener("click", () => showForm("register", tabRegister));
    switchToLogin.addEventListener("click", () => showForm("login", tabLogin));

    // --- FUNCIONALIDADE GLOBAL: MOSTRAR SENHA ---
    // Seleciona todos os ícones de olho e adiciona o evento de clique
    document.querySelectorAll('.toggle-btn').forEach(icon => {
        icon.addEventListener('click', function() {
            // O input está logo antes do ícone no HTML
            const input = this.previousElementSibling;
            
            if (input && (input.type === "password" || input.type === "text")) {
                if (input.type === "password") {
                    input.type = "text";
                    this.classList.remove("fa-eye");
                    this.classList.add("fa-eye-slash");
                } else {
                    input.type = "password";
                    this.classList.remove("fa-eye-slash");
                    this.classList.add("fa-eye");
                }
            }
        });
    });

    // ======================================================
    // 1. LÓGICA DE CADASTRO (REGISTER)
    // ======================================================

    const regNome = document.getElementById("reg-nome");
    const regEmail = document.getElementById("reg-email");
    const regUsuario = document.getElementById("reg-usuario"); // Nota: API atual não usa este campo no JSON, mas mantemos validação
    const regSenha = document.getElementById("reg-senha");
    const regConfirmarSenha = document.getElementById("reg-confirmar-senha");
    const regBtn = document.getElementById("reg-btn");
    const regGeralError = document.getElementById("reg-geral-error");

    // Elementos de erro (existem no HTML do registro)
    const regSenhaError = document.getElementById("reg-senha-error");
    const regConfirmarSenhaError = document.getElementById("reg-confirmar-senha-error");

    // Validação simplificada para habilitar botão
    function checkRegisterValidity() {
        const nomeOk = regNome.value.trim().length >= 3;
        const emailOk = /\S+@\S+\.\S+/.test(regEmail.value);
        const senhaOk = regSenha.value.length >= 6; // Ajustado para ser menos restritivo inicialmente ou siga regra forte
        const confirmOk = regSenha.value === regConfirmarSenha.value && senhaOk;

        // Feedback visual de erro de senha
        if (regSenha.value.length > 0 && !senhaOk) {
             if(regSenhaError) {
                 regSenhaError.textContent = "Senha muito curta.";
                 regSenhaError.style.display = "block";
             }
        } else {
             if(regSenhaError) regSenhaError.style.display = "none";
        }

        // Feedback visual de confirmação
        if (regConfirmarSenha.value.length > 0 && !confirmOk) {
            if(regConfirmarSenhaError) {
                regConfirmarSenhaError.textContent = "Senhas não conferem.";
                regConfirmarSenhaError.style.display = "block";
            }
        } else {
            if(regConfirmarSenhaError) regConfirmarSenhaError.style.display = "none";
        }

        if (nomeOk && emailOk && senhaOk && confirmOk) {
            regBtn.disabled = false;
        } else {
            regBtn.disabled = true;
        }
    }

    [regNome, regEmail, regUsuario, regSenha, regConfirmarSenha].forEach(input => {
        input.addEventListener("input", checkRegisterValidity);
    });

    // --- INTEGRACAO API: CADASTRO ---
    registerForm.addEventListener("submit", async function(event) {
        event.preventDefault();
        regGeralError.textContent = "";
        
        // Preparar dados conforme Postman
        const dadosCadastro = {
            Nome_Usuario: regNome.value,
            Email_Usuario: regEmail.value,
            Senha_Usuario: regSenha.value
        };

        const originalBtnText = regBtn.textContent;
        regBtn.disabled = true;
        regBtn.textContent = "Cadastrando...";

        try {
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(dadosCadastro)
            });

            // Tenta ler JSON, se falhar (ex: erro 500 html), trata vazio
            const data = await response.json().catch(() => null);

            if (response.ok) {
                alert("Cadastro realizado com sucesso! Faça login.");
                showForm("login", tabLogin);
                registerForm.reset();
                checkRegisterValidity(); // Reseta estado do botão
            } else {
                // Tratamento de erros vindos da API
                const msg = data && data.error ? data.error : "Erro ao cadastrar.";
                regGeralError.textContent = msg;
            }
        } catch (error) {
            console.error("Erro Fetch:", error);
            regGeralError.textContent = "Servidor indisponível. Tente mais tarde.";
        } finally {
            regBtn.disabled = false;
            regBtn.textContent = originalBtnText;
        }
    });


    // ======================================================
    // 2. LÓGICA DE LOGIN (LOGIN)
    // ======================================================

    const loginEmail = document.getElementById("login-email");
    const loginSenha = document.getElementById("login-senha");
    const loginBtn = document.getElementById("login-btn");
    const loginGeralError = document.getElementById("login-geral-error");

    // Validação simples do Login
    function checkLoginValidity() {
        if (loginEmail.value.trim() !== "" && loginSenha.value.trim() !== "") {
            loginBtn.disabled = false;
        } else {
            loginBtn.disabled = true;
        }
    }

    loginEmail.addEventListener("input", checkLoginValidity);
    loginSenha.addEventListener("input", checkLoginValidity);

    // --- INTEGRACAO API: LOGIN ---
    loginForm.addEventListener("submit", async function(event) {
        event.preventDefault();
        loginGeralError.textContent = "";
        loginGeralError.style.color = ""; // Reseta cor de erro

        const payload = {
            Email_Usuario: loginEmail.value,
            Senha_Usuario: loginSenha.value
        };

        const originalBtnText = loginBtn.textContent;
        loginBtn.disabled = true;
        loginBtn.textContent = "Entrando...";

        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const data = await response.json().catch(() => null);

            if (response.ok && data && data.token) {
                // SUCESSO
                loginGeralError.style.color = "#2ecc71"; // Verde sucesso
                loginGeralError.textContent = "Login com sucesso! Redirecionando...";
                
                // SALVAR NO LOCALSTORAGE (Essencial para as próximas etapas)
                localStorage.setItem("token", data.token);
                // Opcional: Salvar dados do usuário se a API retornar
                if (data.usuario) {
                    localStorage.setItem("userData", JSON.stringify(data.usuario));
                }

                setTimeout(() => {
                    window.location.href = "index.html"; // Redireciona para Home
                }, 1500);

            } else {
                // ERRO
                const msg = data && data.message ? data.message : "E-mail ou senha inválidos.";
                loginGeralError.textContent = msg;
                loginBtn.textContent = originalBtnText;
                loginBtn.disabled = false;
            }

        } catch (error) {
            console.error("Erro Login:", error);
            loginGeralError.textContent = "Erro de conexão com o servidor.";
            loginBtn.textContent = originalBtnText;
            loginBtn.disabled = false;
        }
    });

});