document.addEventListener("DOMContentLoaded", function() {

    // ==========================================
    // 1. SELETORES E NAVEGAÇÃO
    // ==========================================
    const tabLogin = document.getElementById("tabLogin");
    const tabRegister = document.getElementById("tabRegister");
    
    const loginFormContainer = document.getElementById("loginFormContainer");
    const registerFormContainer = document.getElementById("registerFormContainer");
    
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");
    
    const switchToRegister = document.getElementById("switchToRegister");
    const switchToLogin = document.getElementById("switchToLogin");

    // Inputs Login
    const loginEmail = document.getElementById("login-email");
    const loginSenha = document.getElementById("login-senha");
    const loginBtn = document.getElementById("login-btn");
    const loginError = document.getElementById("login-geral-error");
    const rememberMe = document.getElementById("rememberMe");

    // Inputs Registro
    const regNome = document.getElementById("reg-nome");
    const regEmail = document.getElementById("reg-email");
    const regUsuario = document.getElementById("reg-usuario");
    const regSenha = document.getElementById("reg-senha");
    const regConfirmar = document.getElementById("reg-confirmar-senha");
    const regBtn = document.getElementById("reg-btn");
    const regGeralError = document.getElementById("reg-geral-error");
    const regSenhaError = document.getElementById("reg-senha-error");
    const regConfirmarError = document.getElementById("reg-confirmar-senha-error");

    // --- Alternar Abas ---
    function showLogin() {
        tabLogin.classList.add("active");
        tabRegister.classList.remove("active");
        loginFormContainer.style.display = "block";
        registerFormContainer.style.display = "none";
        loginError.textContent = "";
    }

    function showRegister() {
        tabRegister.classList.add("active");
        tabLogin.classList.remove("active");
        registerFormContainer.style.display = "block";
        loginFormContainer.style.display = "none";
        regGeralError.textContent = "";
    }

    tabLogin.addEventListener("click", showLogin);
    tabRegister.addEventListener("click", showRegister);
    switchToRegister.addEventListener("click", showRegister);
    switchToLogin.addEventListener("click", showLogin);

    // --- Mostrar/Ocultar Senha ---
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

    // --- Lembrar de Mim ---
    const savedEmail = localStorage.getItem("rememberedEmail");
    if (savedEmail) {
        loginEmail.value = savedEmail;
        if (rememberMe) rememberMe.checked = true;
    }

    // ==========================================
    // 2. VALIDAÇÕES DE SEGURANÇA
    // ==========================================
    
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    function validatePasswordStrength(password) {
        const re = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;
        return re.test(password);
    }

    function checkRegisterValidity() {
        let valid = true;
        regGeralError.textContent = "";
        regSenhaError.style.display = "none";
        regConfirmarError.style.display = "none";

        if (!regNome.value || !regEmail.value || !regUsuario.value || !regSenha.value || !regConfirmar.value) {
            valid = false;
        } else if (!validateEmail(regEmail.value)) {
            valid = false;
        } else if (!validatePasswordStrength(regSenha.value)) {
            regSenhaError.textContent = "A senha deve ter 8+ caracteres, letras e números.";
            regSenhaError.style.display = "block";
            valid = false;
        } else if (regSenha.value !== regConfirmar.value) {
            regConfirmarError.textContent = "As senhas não coincidem.";
            regConfirmarError.style.display = "block";
            valid = false;
        }

        regBtn.disabled = !valid;
    }

    [regNome, regEmail, regUsuario, regSenha, regConfirmar].forEach(input => {
        input.addEventListener("input", checkRegisterValidity);
    });

    // ==========================================
    // 3. REGISTRO
    // ==========================================
    registerForm.addEventListener("submit", function(e) {
        e.preventDefault();
        regBtn.disabled = true;
        regGeralError.textContent = "Processando...";

        setTimeout(() => {
            let usersDB = JSON.parse(localStorage.getItem("usersDB")) || [];

            if (usersDB.some(u => u.Email === regEmail.value)) {
                regGeralError.textContent = "Este e-mail já está em uso.";
                regGeralError.style.color = "#D32F2F";
                regBtn.disabled = false;
                return;
            }
            if (usersDB.some(u => u.Usuario_Handle === regUsuario.value)) {
                regGeralError.textContent = "Este usuário já existe.";
                regGeralError.style.color = "#D32F2F";
                regBtn.disabled = false;
                return;
            }

            const newUser = {
                ID_Usuario: Date.now(),
                Nome: regNome.value,
                Email: regEmail.value,
                Usuario_Handle: regUsuario.value,
                Senha: regSenha.value,
                Tipo_Usuario: "Comum",
                Data_Criacao: new Date().toISOString(),
                Dados_Bancarios: {}
            };

            usersDB.push(newUser);
            localStorage.setItem("usersDB", JSON.stringify(usersDB));

            regGeralError.textContent = "Conta criada! Faça login.";
            regGeralError.style.color = "#28a745";
            
            setTimeout(() => {
                registerForm.reset();
                showLogin();
                regBtn.disabled = true;
                regGeralError.textContent = "";
            }, 1500);

        }, 800);
    });

    // ==========================================
    // 4. LOGIN (CORRIGIDO: AUTO-SEED ADMIN)
    // ==========================================
    
    function checkLoginValidity() {
        loginBtn.disabled = !(loginEmail.value && loginSenha.value);
    }
    loginEmail.addEventListener("input", checkLoginValidity);
    loginSenha.addEventListener("input", checkLoginValidity);

    loginForm.addEventListener("submit", function(e) {
        e.preventDefault();
        loginBtn.disabled = true;
        loginError.textContent = "Verificando...";

        const emailVal = loginEmail.value.trim(); // Remove espaços extras
        const passVal = loginSenha.value;

        setTimeout(() => {
            // 1. Carrega Banco
            let usersDB = JSON.parse(localStorage.getItem("usersDB")) || [];

            // --- CORREÇÃO CRÍTICA: SEED ADMIN ---
            // Se o usuário está tentando logar como Admin e o Admin não existe no banco,
            // nós criamos o Admin AGORA e salvamos no banco.
            if (emailVal === "admin@admin.com" && passVal === "admin") {
                const adminExists = usersDB.find(u => u.Email === "admin@admin.com");
                
                if (!adminExists) {
                    console.log("Admin não encontrado. Criando automaticamente...");
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
                    localStorage.setItem("usersDB", JSON.stringify(usersDB)); // Salva no Storage
                }
            }
            // ------------------------------------

            // 2. Busca no Banco (agora o admin com certeza existe se foi digitado corretamente)
            const user = usersDB.find(u => u.Email === emailVal && u.Senha === passVal);

            if (user) {
                finalizeLogin(user);
            } else {
                loginError.textContent = "E-mail ou senha incorretos.";
                loginError.style.color = "#D32F2F";
                loginBtn.disabled = false;
            }
        }, 800);
    });

    function finalizeLogin(user) {
        if (rememberMe.checked) {
            localStorage.setItem("rememberedEmail", user.Email);
        } else {
            localStorage.removeItem("rememberedEmail");
        }

        sessionStorage.setItem("currentUserEmail", user.Email);
        sessionStorage.setItem("currentUserName", user.Nome);
        sessionStorage.setItem("currentUserHandle", user.Usuario_Handle);
        sessionStorage.setItem("currentUserRole", user.Tipo_Usuario);

        loginError.textContent = "Sucesso! Redirecionando...";
        loginError.style.color = "#28a745";

        setTimeout(() => {
            if (user.Tipo_Usuario === 'Admin') {
                window.location.href = "gerenciamento-usuarios.html";
            } else {
                window.location.href = "index.html";
            }
        }, 1000);
    }
});