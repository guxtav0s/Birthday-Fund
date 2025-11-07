document.addEventListener("DOMContentLoaded", function() {

    // --- Seleção de Elementos ---
    const form = document.getElementById("formLogin");
    const emailInput = document.getElementById("email");
    const senhaInput = document.getElementById("senha");
    const btnLogin = document.getElementById("btnLogin");
    const emailError = document.getElementById("emailError");
    const senhaError = document.getElementById("senhaError");
    const mensagemGeral = document.getElementById("mensagemGeral");
    const toggleSenhaIcons = document.querySelectorAll(".toggle-senha");

    // Objeto de Validação
    const validacao = {
        email: false,
        senha: false
    };

    // --- Funções de Validação ---
    function validarEmail() {
        const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!regexEmail.test(emailInput.value)) {
            emailError.textContent = "Por favor, insira um e-mail válido.";
            emailError.style.display = "block";
            validacao.email = false;
        } else {
            emailError.style.display = "none";
            validacao.email = true;
        }
        atualizarEstadoBotao();
    }
    function validarSenha() {
        if (senhaInput.value.trim() === "") {
            senhaError.textContent = "O campo Senha é obrigatório.";
            senhaError.style.display = "block";
            validacao.senha = false;
        } else {
            senhaError.style.display = "none";
            validacao.senha = true;
        }
        atualizarEstadoBotao();
    }
    function atualizarEstadoBotao() {
        const todosValidos = Object.values(validacao).every(valido => valido);
        btnLogin.disabled = !todosValidos;
    }

    // --- Lógica de Mostrar/Esconder Senha ---
    toggleSenhaIcons.forEach(icon => {
        icon.addEventListener("click", function() {
            const targetId = this.getAttribute("data-target");
            const targetInput = document.getElementById(targetId);
            if (targetInput.type === "password") {
                targetInput.type = "text";
                this.classList.remove("fa-eye-slash");
                this.classList.add("fa-eye");
            } else {
                targetInput.type = "password";
                this.classList.remove("fa-eye");
                this.classList.add("fa-eye-slash");
            }
        });
    });

    // --- Event Listeners ---
    emailInput.addEventListener("input", validarEmail);
    senhaInput.addEventListener("input", validarSenha);

    // --- Submissão do Formulário (COM MOCK "AO VIVO") ---
    form.addEventListener("submit", function(event) {
        event.preventDefault();

        btnLogin.disabled = true;
        btnLogin.textContent = "Entrando...";
        mensagemGeral.textContent = "";

        const email = emailInput.value;
        const senha = senhaInput.value;

        // --- INÍCIO DO MOCK "AO VIVO"---
        console.log("MOCK: Verificando credenciais no localStorage...");

        setTimeout(() => {
            // Pega do localStorage
            const usersDB = JSON.parse(localStorage.getItem("usersDB")) || [];

            // Procura pelo usuário E senha que batem
            const usuarioEncontrado = usersDB.find(user => user.email === email && user.senha === senha);

            if (usuarioEncontrado) {
                // 3. Simula Sucesso 200 (OK)
                console.log("MOCK: Sucesso 200 - Usuário encontrado no localStorage.");
                mensagemGeral.textContent = "Login efetuado com sucesso!";
                mensagemGeral.style.color = "#4cff4c"; // Verde
                
                setTimeout(() => {
                    window.location.href = "dashboard.html"; 
                }, 2000);

            } else {
                // 4. Simula Erro 401 (Credenciais inválidas)
                console.log("MOCK: Erro 401 - Usuário não encontrado ou senha incorreta.");
                mensagemGeral.textContent = "E-mail ou senha inválidos.";
                mensagemGeral.style.color = "#ff6b6b"; // Vermelho
                btnLogin.disabled = false; // Reabilita o botão
                btnLogin.textContent = "Entrar";
            }
        }, 1500); // 1.5 segundos de simulação de rede
        // --- FIM DO MOCK "AO VIVO" ---


        /* // --- CÓDIGO DA API REAL (Usar quando o Back-end estiver pronto) ---
        // (Basta apagar o bloco MOCK acima e descomentar este bloco)
        
        // SUBSTITUA PELA URL DA API REAL
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
                return response.json(); 
            } else if (response.status === 401) {
                throw new Error("Credenciais inválidas");
            } else {
                throw new Error("Erro no servidor");
            }
        })
        .then(data => {
            // SUCESSO
            // localStorage.setItem("token", data.token); 
            mensagemGeral.textContent = "Login efetuado com sucesso!";
            mensagemGeral.style.color = "#4cff4c";
            setTimeout(() => {
                window.location.href = "dashboard.html"; 
            }, 2000);
        })
        .catch(error => {
            // ERRO
            console.error("Erro no login:", error.message);
            mensagemGeral.textContent = "E-mail ou senha inválidos.";
            mensagemGeral.style.color = "#ff6b6b";
            btnLogin.disabled = false;
            btnLogin.textContent = "Entrar";
        });
        
        */
    });
});