document.addEventListener("DOMContentLoaded", function() {

    const tabLogin = document.getElementById("tabLogin");
    const tabRegister = document.getElementById("tabRegister");
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");
    const switchToRegister = document.getElementById("switchToRegister");
    const switchToLogin = document.getElementById("switchToLogin");
    
    const slider = document.querySelector(".form-slider");

    function showForm(formToShow, tabToActivate) {
        tabLogin.classList.remove("active");
        tabRegister.classList.remove("active");
        
        tabToActivate.classList.add("active");

        if (formToShow === "register") {
            slider.classList.add("show-register");
        } else {
            slider.classList.remove("show-register");
        }
    }

    tabLogin.addEventListener("click", () => showForm("login", tabLogin));
    tabRegister.addEventListener("click", () => showForm("register", tabRegister));
    switchToRegister.addEventListener("click", () => showForm("register", tabRegister));
    switchToLogin.addEventListener("click", () => showForm("login", tabLogin));

    
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

        setTimeout(() => {
            let usersDB = JSON.parse(localStorage.getItem("usersDB")) || [];
            const emailExistente = usersDB.find(user => user.email === dadosCadastro.email);
            
            if (emailExistente) {
                regGeralError.textContent = "Este e-mail já está cadastrado.";
                regBtn.disabled = false;
                regBtn.textContent = "Registrar";
            } else {
                const isAdmin = dadosCadastro.email === 'admin@admin.com';
                usersDB.push({ 
                    id: String(Date.now()).slice(-6),
                    email: dadosCadastro.email, 
                    senha: dadosCadastro.senha,
                    nome: dadosCadastro.nome,
                    usuario: dadosCadastro.usuario,
                    role: isAdmin ? 'admin' : 'user',
                    status: isAdmin ? 'Admin' : 'Ativo',
                    createdAt: new Date().toISOString().split('T')[0]
                });
                localStorage.setItem("usersDB", JSON.stringify(usersDB));
                
                alert("Cadastro realizado com sucesso! Faça o login.");
                showForm("login", tabLogin);
                registerForm.reset();
                
                regBtn.textContent = "Registrar";
                for (let key in regValidacao) { regValidacao[key] = false; }
                regAtualizarBotao();
            }
        }, 1500);

        /* const apiUrl = "https://sua-api-real-aqui.com/usuarios";
        
        fetch(apiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                Nome_Usuario: dadosCadastro.nome,
                Email_Usuario: dadosCadastro.email,
                Apelido_Usuario: dadosCadastro.usuario,
                Senha_Usuario: dadosCadastro.senha
            })
        })
        .then(response => {
            if (response.status === 201 || response.status === 200) {
                alert("Cadastro realizado com sucesso! Faça o login.");
                showForm("login", tabLogin);
                registerForm.reset();
            } else if (response.status === 409) {
                regGeralError.textContent = "Este e-mail já está cadastrado.";
            } else {
                regGeralError.textContent = `Erro ao cadastrar (Código: ${response.status}).`;
            }
        })
        .catch(error => {
            console.error("Erro na chamada fetch:", error);
            regGeralError.textContent = "Erro de conexão com o servidor. Tente novamente.";
        })
        .finally(() => {
            regBtn.disabled = false;
            regBtn.textContent = "Registrar";
        });
        */
    });

    
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

    loginEmail.addEventListener("input", loginValidarEmail);
    loginSenha.addEventListener("input", loginValidarSenha);
    
    loginMostrarSenha.addEventListener("change", function() {
        loginSenha.type = this.checked ? "text" : "password";
    });

    loginForm.addEventListener("submit", function(event) {
        event.preventDefault();
        loginGeralError.textContent = "";

        const email = loginEmail.value;
        const senha = loginSenha.value;

        loginBtn.disabled = true;
        loginBtn.textContent = "Entrando...";

        setTimeout(() => {
            let usersDB = JSON.parse(localStorage.getItem("usersDB")) || [];
            
            if (usersDB.length === 0) {
                const isAdmin = email === 'admin@admin.com';
                const adminUser = { 
                    id: String(Date.now()).slice(-6),
                    email: 'admin@admin.com', 
                    senha: 'admin123', 
                    nome: 'Admin Birthday', 
                    usuario: 'admin', 
                    role: 'admin',
                    status: 'Admin',
                    createdAt: new Date().toISOString().split('T')[0]
                };
                usersDB.push(adminUser);
                localStorage.setItem("usersDB", JSON.stringify(usersDB));
            }

            const usuarioEncontrado = usersDB.find(user => user.email === email && user.senha === senha);

            if (usuarioEncontrado) {
                loginGeralError.textContent = "Login efetuado com sucesso! Redirecionando...";
                loginGeralError.style.color = "green";
                
                const nomeDoUsuario = usuarioEncontrado.nome || usuarioEncontrado.email; 
                const nomeDeUsuario = usuarioEncontrado.usuario || usuarioEncontrado.email.split('@')[0];

                sessionStorage.setItem('currentUserEmail', usuarioEncontrado.email);
                sessionStorage.setItem('currentUserName', nomeDoUsuario);
                sessionStorage.setItem('currentUserHandle', nomeDeUsuario);
                sessionStorage.setItem('currentUserRole', usuarioEncontrado.role || 'user');
                
                setTimeout(() => {
                    window.location.href = "index.html";
                }, 1000);
                
            } else {
                loginGeralError.textContent = "E-mail ou senha inválidos.";
                loginBtn.disabled = false;
                loginBtn.textContent = "Entrar";
            }
        }, 1500);

        /*
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
            if (response.ok) {
                return response.json();
            } else if (response.status === 401) {
                throw new Error("Credenciais inválidas");
            } else {
                throw new Error("Erro no servidor");
            }
        })
        .then(data => {
            const nomeDoUsuario = data.nome || data.email; 
            const nomeDeUsuario = data.usuario || data.email.split('@')[0];

            sessionStorage.setItem('currentUserEmail', data.email);
            sessionStorage.setItem('currentUserName', nomeDoUsuario);
            sessionStorage.setItem('currentUserHandle', nomeDeUsuario);
            sessionStorage.setItem('currentUserRole', data.role || 'user');

            loginGeralError.textContent = "Login efetuado com sucesso! Redirecionando...";
            loginGeralError.style.color = "green";
            
            setTimeout(() => {
                window.location.href = "index.html";
            }, 1000);
        })
        .catch(error => {
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