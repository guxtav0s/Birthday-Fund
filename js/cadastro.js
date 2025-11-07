document.addEventListener("DOMContentLoaded", function() {

    // --- Seleção de Elementos ---
    const form = document.getElementById("formCadastro");
    const nomeInput = document.getElementById("nome");
    const apelidoInput = document.getElementById("apelido");
    const emailInput = document.getElementById("email");
    const senhaInput = document.getElementById("senha");
    const confirmarSenhaInput = document.getElementById("confirmarSenha");
    const btnCadastrar = document.getElementById("btnCadastrar");
    const nomeError = document.getElementById("nomeError");
    const apelidoError = document.getElementById("apelidoError");
    const emailError = document.getElementById("emailError");
    const senhaError = document.getElementById("senhaError");
    const confirmarError = document.getElementById("confirmarError");
    const mensagemGeral = document.getElementById("mensagemGeral");
    const toggleSenhaIcons = document.querySelectorAll(".toggle-senha");

    // Objeto de Validação
    const validacao = {
        nome: false,
        apelido: false,
        email: false,
        senha: false,
        confirmarSenha: false
    };

    // --- Funções de Validação ---
    // (Todas as funções de validação continuam as mesmas)
    function validarNome() {
        if (nomeInput.value.trim() === "") {
            nomeError.textContent = "O campo Nome completo é obrigatório.";
            nomeError.style.display = "block";
            validacao.nome = false;
        } else {
            nomeError.style.display = "none";
            validacao.nome = true;
        }
        atualizarEstadoBotao();
    }

    function validarApelido() {
        if (apelidoInput.value.trim() === "") {
            apelidoError.textContent = "O campo Apelido é obrigatório.";
            apelidoError.style.display = "block";
            validacao.apelido = false;
        } else {
            apelidoError.style.display = "none";
            validacao.apelido = true;
        }
        atualizarEstadoBotao();
    }

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
        const regexSenha = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
        if (!regexSenha.test(senhaInput.value)) {
            senhaError.textContent = "A senha deve ter no mínimo 8 caracteres, uma letra e um número.";
            senhaError.style.display = "block";
            validacao.senha = false;
        } else {
            senhaError.style.display = "none";
            validacao.senha = true;
        }
        validarConfirmarSenha(); 
    }

    function validarConfirmarSenha() {
        if (confirmarSenhaInput.value !== senhaInput.value || confirmarSenhaInput.value === "") {
            confirmarError.textContent = "As senhas não coincidem.";
            confirmarError.style.display = "block";
            validacao.confirmarSenha = false;
        } else {
            confirmarError.style.display = "none";
            validacao.confirmarSenha = true;
        }
        atualizarEstadoBotao();
    }

    function atualizarEstadoBotao() {
        const todosValidos = Object.values(validacao).every(valido => valido);
        btnCadastrar.disabled = !todosValidos;
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
    nomeInput.addEventListener("input", validarNome);
    apelidoInput.addEventListener("input", validarApelido);
    emailInput.addEventListener("input", validarEmail);
    senhaInput.addEventListener("input", validarSenha);
    confirmarSenhaInput.addEventListener("input", validarConfirmarSenha);

    // --- Submissão do Formulário (COM MOCK) ---
    form.addEventListener("submit", function(event) {
        event.preventDefault();

        btnCadastrar.disabled = true;
        btnCadastrar.textContent = "Cadastrando...";
        mensagemGeral.textContent = "";

        const dadosCadastro = {
            Nome_Usuario: nomeInput.value,
            Apelido_Usuario: apelidoInput.value,
            Email_Usuario: emailInput.value,
            Senha_Usuario: senhaInput.value
        };

        // INÍCIO DO MOCK 
        // Simula o comportamento da API (sucesso ou erro) sem um back-end real.

        // Só mudar para 'true' para simular um erro de "E-mail já existe" (409)
        const simularErroEmailExistente = false;

        console.log("MOCK: Enviando dados...", dadosCadastro);

        // Simula uma espera de 1.5 segundos da rede
        setTimeout(() => {
            if (simularErroEmailExistente) {
                // Simula Erro 409
                console.log("MOCK: Erro 409 - E-mail já existe.");
                mensagemGeral.textContent = "Erro: Este e-mail já está cadastrado.";
                mensagemGeral.style.color = "#ff6b6b";
                btnCadastrar.disabled = false;
                btnCadastrar.textContent = "Cadastrar";
            } else {
                // Simula Sucesso 201
                console.log("MOCK: Sucesso 201 - Cadastro realizado.");
                mensagemGeral.textContent = "Cadastro realizado com sucesso!";
                mensagemGeral.style.color = "#4cff4c";
                
                // Redireciona para o login após 2 segundos
                setTimeout(() => {
                    window.location.href = "login.html"; 
                }, 2000);
            }
        }, 1500);

        // --- FIM DO MOCK ---


        /* --- AQUI JÁ É O CÓDIGO DA API REAL, QUE IREMOS USAR QUANDO O BACKEND E A API ESTIVER PRONTOS ---
            (Só apagar o bloco MOCK acima e descomentar este bloco)

        // ESPAÇO PARA POR A URL DA API QUANDO O BACKEND ESTIVER PRONTO
        const apiUrl = "";

        fetch(apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(dadosCadastro)
        })
        .then(response => {
            if (response.status === 201 || response.status === 200) {
                mensagemGeral.textContent = "Cadastro realizado com sucesso!";
                mensagemGeral.style.color = "#4cff4c";
                setTimeout(() => {
                    window.location.href = "login.html"; 
                }, 2000);
            } else if (response.status === 409) {
                mensagemGeral.textContent = "Erro: Este e-mail já está cadastrado.";
                mensagemGeral.style.color = "#ff6b6b";
                btnCadastrar.disabled = false;
                btnCadastrar.textContent = "Cadastrar";
            } else {
                mensagemGeral.textContent = `Erro ao cadastrar (Código: ${response.status}). Tente novamente.`;
                mensagemGeral.style.color = "#ff6b6b";
                btnCadastrar.disabled = false;
                btnCadastrar.textContent = "Cadastrar";
            }
        })
        .catch(error => {
            console.error("Erro na chamada fetch:", error);
            mensagemGeral.textContent = "Erro de conexão com o servidor. Tente novamente mais tarde.";
            mensagemGeral.style.color = "#ff6b6b";
            btnCadastrar.disabled = false;
            btnCadastrar.textContent = "Cadastrar";
        });
        
        */
    });
});