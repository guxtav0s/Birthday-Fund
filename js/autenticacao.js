document.addEventListener("DOMContentLoaded", function() {

    // --- ELEMENTOS DAS ABAS ---
    const tabLogin = document.getElementById("tabLogin");
    const tabRegister = document.getElementById("tabRegister");
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");
    const switchToRegister = document.getElementById("switchToRegister");
    const switchToLogin = document.getElementById("switchToLogin");

    // --- FUNÇÃO DE TROCA DE ABAS ---
    function showForm(formToShow, tabToActivate) {
        loginForm.classList.remove("active");
        registerForm.classList.remove("active");
        tabLogin.classList.remove("active");
        tabRegister.classList.remove("active");
        formToShow.classList.add("active");
        tabToActivate.classList.add("active");
    }

    // --- EVENT LISTENERS DAS ABAS ---
    tabLogin.addEventListener("click", () => showForm(loginForm, tabLogin));
    tabRegister.addEventListener("click", () => showForm(registerForm, tabRegister));
    switchToRegister.addEventListener("click", () => showForm(registerForm, tabRegister));
    switchToLogin.addEventListener("click", () => showForm(loginForm, tabLogin));

    // ===================================================================
    // --- LÓGICA DO FORMULÁRIO DE CADASTRO (REGISTER) ---
    // ===================================================================
    
    // --- Seleção de Elementos (Cadastro) ---
    const regNome = document.getElementById("reg-nome");
    const regEmail = document.getElementById("reg-email");
    const regUsuario = document.getElementById("reg-usuario");
    const regSenha = document.getElementById("reg-senha");
    const regConfirmarSenha = document.getElementById("reg-confirmar-senha");
    const regMostrarSenha = document.getElementById("reg-mostrar-senha");
    const regBtn = document.getElementById("reg-btn");

    const regNomeError = document.getElementById("reg-nome-error");
    const regEmailError = document.getElementById("reg-email-error");
    const regUsuarioError = document.getElementById("reg-usuario-error");
    const regSenhaError = document.getElementById("reg-senha-error");
    const regConfirmarSenhaError = document.getElementById("reg-confirmar-senha-error");
    const regGeralError = document.getElementById("reg-geral-error");

    const regValidacao = {
        nome: false,
        email: false,
        usuario: false,
        senha: false,
        confirmar: false
    };

    // --- Funções de Validação (Cadastro) ---
    function regValidarNome() {
        if (regNome.value.trim().length < 3) {
            regNomeError.textContent = "Nome completo é obrigatório.";
            regNomeError.style.display = "block";
            regValidacao.nome = false;
        } else {
            regNomeError.style.display = "none";
            regValidacao.nome = true;
        }
        regAtualizarBotao();
    }
    
    function regValidarEmail() {
        const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!regexEmail.test(regEmail.value)) {
            regEmailError.textContent = "Por favor, insira um e-mail válido.";
            regEmailError.style.display = "block";
            regValidacao.email = false;
        } else {
            regEmailError.style.display = "none";
            regValidacao.email = true;
        }
        regAtualizarBotao();
    }
    
    function regValidarUsuario() {
        if (regUsuario.value.trim().length < 3) {
            regUsuarioError.textContent = "Nome de usuário é obrigatório.";
            regUsuarioError.style.display = "block";
            regValidacao.usuario = false;
        } else {
            regUsuarioError.style.display = "none";
            regValidacao.usuario = true;
        }
        regAtualizarBotao();
    }

    function regValidarSenha() {
        const regexSenha = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
        if (!regexSenha.test(regSenha.value)) {
            regSenhaError.textContent = "Mínimo 8 caracteres, 1 letra e 1 número.";
            regSenhaError.style.display = "block";
            regValidacao.senha = false;
        } else {
            regSenhaError.style.display = "none";
            regValidacao.senha = true;
        }
        regValidarConfirmarSenha();
    }

    function regValidarConfirmarSenha() {
        if (regSenha.value !== regConfirmarSenha.value || regConfirmarSenha.value === "") {
            regConfirmarSenhaError.textContent = "As senhas não coincidem.";
            regConfirmarSenhaError.style.display = "block";
            regValidacao.confirmar = false;
        } else {
            regConfirmarSenhaError.style.display = "none";
            regValidacao.confirmar = true;
        }
        regAtualizarBotao();
    }

    function regAtualizarBotao() {
        const todosValidos = Object.values(regValidacao).every(valido => valido);
        regBtn.disabled = !todosValidos;
    }

    // --- Event Listeners (Cadastro) ---
    regNome.addEventListener("input", regValidarNome);
    regEmail.addEventListener("input", regValidarEmail);
    regUsuario.addEventListener("input", regValidarUsuario);
    regSenha.addEventListener("input", regValidarSenha);
    regConfirmarSenha.addEventListener("input", regValidarConfirmarSenha);
    
    regMostrarSenha.addEventListener("change", function() {
        const isChecked = this.checked;
        regSenha.type = isChecked ? "text" : "password";
        regConfirmarSenha.type = isChecked ? "text" : "password";
    });

    // --- Submissão (Cadastro) ---
    registerForm.addEventListener("submit", function(event) {
        event.preventDefault();
        regGeralError.textContent = "";
        
        const dadosCadastro = {
            nome: regNome.value,
            email: regEmail.value,
            usuario: regUsuario.value,
            senha: regSenha.value
        };

        regBtn.disabled = true;
        regBtn.textContent = "Registrando...";

        // --- INÍCIO DO MOCK "AO VIVO" (usando localStorage) ---
        // (Este bloco está ATIVO)
        setTimeout(() => {
            let usersDB = JSON.parse(localStorage.getItem("usersDB")) || [];
            const emailExistente = usersDB.find(user => user.email === dadosCadastro.email);
            
            if (emailExistente) {
                // Erro: E-mail já existe
                regGeralError.textContent = "Este e-mail já está cadastrado.";
                regBtn.disabled = false;
                regBtn.textContent = "Registrar";
            } else {
                // Sucesso: Salva e muda de aba
                // (No mock, só precisamos salvar o que o login usa)
                usersDB.push({ 
                    email: dadosCadastro.email, 
                    senha: dadosCadastro.senha 
                });
                localStorage.setItem("usersDB", JSON.stringify(usersDB));
                
                alert("Cadastro realizado com sucesso! Faça o login.");
                showForm(loginForm, tabLogin); // Muda para a aba de login
                registerForm.reset(); // Limpa o formulário
                
                // Re-habilita o botão e limpa o estado
                regBtn.textContent = "Registrar";
                for (let key in regValidacao) { regValidacao[key] = false; }
                regAtualizarBotao();
            }
        }, 1500);
        // --- FIM DO MOCK ---


        /* // --- CÓDIGO DA API REAL (Usar quando o Back-end estiver pronto) ---
           // (Basta apagar o bloco MOCK acima e descomentar este bloco)

        // 1. SUBSTITUA PELA URL DA API REAL
        const apiUrl = "https://sua-api-real-aqui.com/usuarios"; // ou /cadastro
        
        fetch(apiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                Nome_Usuario: dadosCadastro.nome,
                Email_Usuario: dadosCadastro.email,
                Apelido_Usuario: dadosCadastro.usuario, // DER antigo usava Apelido
                Senha_Usuario: dadosCadastro.senha
            })
        })
        .then(response => {
            if (response.status === 201 || response.status === 200) {
                // SUCESSO
                alert("Cadastro realizado com sucesso! Faça o login.");
                showForm(loginForm, tabLogin);
                registerForm.reset();
            } else if (response.status === 409) {
                // E-mail já existe
                regGeralError.textContent = "Este e-mail já está cadastrado.";
            } else {
                // Outro erro
                regGeralError.textContent = `Erro ao cadastrar (Código: ${response.status}).`;
            }
        })
        .catch(error => {
            console.error("Erro na chamada fetch:", error);
            regGeralError.textContent = "Erro de conexão com o servidor. Tente novamente.";
        })
        .finally(() => {
            // Re-habilita o botão em qualquer cenário
            regBtn.disabled = false;
            regBtn.textContent = "Registrar";
        });
        */
    });

    // ===================================================================
    // --- LÓGICA DO FORMULÁRIO DE LOGIN (LOGIN) ---
    // ===================================================================

    // --- Seleção de Elementos (Login) ---
    const loginEmail = document.getElementById("login-email");
    const loginSenha = document.getElementById("login-senha");
    const loginMostrarSenha = document.getElementById("login-mostrar-senha");
    const loginBtn = document.getElementById("login-btn");
    
    const loginEmailError = document.getElementById("login-email-error");
    const loginSenhaError = document.getElementById("login-senha-error");
    const loginGeralError = document.getElementById("login-geral-error");

    const loginValidacao = {
        email: false,
        senha: false
    };

    // --- Funções de Validação (Login) ---
    function loginValidarEmail() {
        const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!regexEmail.test(loginEmail.value)) {
            loginEmailError.textContent = "Por favor, insira um e-mail válido.";
            loginEmailError.style.display = "block";
            loginValidacao.email = false;
        } else {
            loginEmailError.style.display = "none";
            loginValidacao.email = true;
        }
        loginAtualizarBotao();
    }
    
    function loginValidarSenha() {
        if (loginSenha.value.trim().length === 0) {
            loginSenhaError.textContent = "Senha é obrigatória.";
            loginSenhaError.style.display = "block";
            loginValidacao.senha = false;
        } else {
            loginSenhaError.style.display = "none";
            loginValidacao.senha = true;
        }
        loginAtualizarBotao();
    }

    function loginAtualizarBotao() {
        const todosValidos = Object.values(loginValidacao).every(valido => valido);
        loginBtn.disabled = !todosValidos;
    }

    // --- Event Listeners (Login) ---
    loginEmail.addEventListener("input", loginValidarEmail);
    loginSenha.addEventListener("input", loginValidarSenha);
    
    loginMostrarSenha.addEventListener("change", function() {
        loginSenha.type = this.checked ? "text" : "password";
    });

    // --- Submissão (Login) ---
    loginForm.addEventListener("submit", function(event) {
        event.preventDefault();
        loginGeralError.textContent = "";

        const email = loginEmail.value;
        const senha = loginSenha.value;

        loginBtn.disabled = true;
        loginBtn.textContent = "Entrando...";

        // --- INÍCIO DO MOCK "AO VIVO" (usando localStorage) ---
        // (Este bloco está ATIVO)
        setTimeout(() => {
            const usersDB = JSON.parse(localStorage.getItem("usersDB")) || [];
            const usuarioEncontrado = usersDB.find(user => user.email === email && user.senha === senha);

            if (usuarioEncontrado) {
                loginGeralError.textContent = "Login efetuado com sucesso! Redirecionando...";
                loginGeralError.style.color = "green";
                
                setTimeout(() => {
                    window.location.href = "inicio.html"; 
                }, 1000);
                
            } else {
                // Erro: Credenciais inválidas
                loginGeralError.textContent = "E-mail ou senha inválidos.";
                loginBtn.disabled = false;
                loginBtn.textContent = "Entrar";
            }
        }, 1500);
        // --- FIM DO MOCK ---

        /* // --- CÓDIGO DA API REAL (Usar quando o Back-end estiver pronto) ---
           // (Basta apagar o bloco MOCK acima e descomentar este bloco)

        // 1. SUBSTITUA PELA URL DA API REAL
        const apiUrl = "https://sua-api-real-aqui.com/login";
        
        fetch(apiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                Email_Usuario: email,
                Senha_Usuario: senha
            })
        })
        .then(response => {
            if (response.ok) { // Status 200-299
                return response.json(); // Pega o token, por exemplo
            } else if (response.status === 401) {
                throw new Error("Credenciais inválidas");
            } else {
                throw new Error("Erro no servidor");
            }
        })
        .then(data => {
            // SUCESSO
            // Ex: Salvar o token
            // localStorage.setItem("token", data.token);

            loginGeralError.textContent = "Login efetuado com sucesso! Redirecionando...";
            loginGeralError.style.color = "green";
            
            setTimeout(() => {
                window.location.href = "dashboard.html"; // Mude para sua página de dashboard
            }, 1000);
        })
        .catch(error => {
            // ERRO
            console.error("Erro no login:", error.message);
            loginGeralError.textContent = "E-mail ou senha inválidos.";
        })
        .finally(() => {
            loginBtn.disabled = false;
            loginBtn.textContent = "Entrar";
        });
        */
    });

});