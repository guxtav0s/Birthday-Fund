document.addEventListener("DOMContentLoaded", function() {

    // --- Seleção de Elementos ---
    const formContainer = document.getElementById("formContainer");
    const successMessage = document.getElementById("successMessage");
    const form = document.getElementById("formEsqueci");
    const emailInput = document.getElementById("email");
    const btnSeguir = document.getElementById("btnSeguir");
    const emailError = document.getElementById("emailError");
    const mensagemGeral = document.getElementById("mensagemGeral");

    // Objeto de Validação
    const validacao = { email: false };

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

    function atualizarEstadoBotao() {
        btnSeguir.disabled = !validacao.email;
    }

    // --- Event Listener ---
    emailInput.addEventListener("input", validarEmail);

    // --- Submissão do Formulário (MOCK "AO VIVO") ---
    form.addEventListener("submit", function(event) {
        event.preventDefault();

        btnSeguir.disabled = true;
        btnSeguir.textContent = "Verificando...";
        mensagemGeral.textContent = "";

        const email = emailInput.value;

        // --- INÍCIO DO MOCK (com localStorage) ---
        console.log("MOCK: Verificando se o e-mail existe...", email);
        
        setTimeout(() => {
            const usersDB = JSON.parse(localStorage.getItem("usersDB")) || [];
            const usuarioEncontrado = usersDB.find(user => user.email === email);

            if (usuarioEncontrado) {
                // SUCESSO: E-mail encontrado
                console.log("MOCK: E-mail encontrado. Simulando envio de link.");
                
                // Salva o e-mail que precisa ser redefinido
                localStorage.setItem("emailParaRedefinir", email);

                // Esconde o formulário e mostra a msg de sucesso (Design 2)
                formContainer.style.display = "none";
                successMessage.style.display = "block";

                // Simula o "clique no link" redirecionando após 3s
                setTimeout(() => {
                    window.location.href = "redefinir-senha.html";
                }, 3000); // 3 segundos para o usuário ler a mensagem

            } else {
                // ERRO: E-mail não cadastrado
                console.log("MOCK: E-mail não encontrado no localStorage.");
                mensagemGeral.textContent = "E-mail não cadastrado no sistema.";
                btnSeguir.disabled = false;
                btnSeguir.textContent = "Seguir";
            }
        }, 1500);
        // --- FIM DO MOCK ---

        /* // --- CÓDIGO DA API REAL (Quando o Back-end estiver pronto) ---

        const apiUrl = "";
        fetch(apiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ Email_Usuario: email })
        })
        .then(response => {
            if (response.ok) {
                formContainer.style.display = "none";
                successMessage.style.display = "block";
                // A API real enviaria o link, não haveria redirecionamento
            } else {
                mensagemGeral.textContent = "E-mail não cadastrado.";
                btnSeguir.disabled = false;
                btnSeguir.textContent = "Seguir";
            }
        })
        .catch(error => {
            mensagemGeral.textContent = "Erro de conexão com o servidor.";
            btnSeguir.disabled = false;
            btnSeguir.textContent = "Seguir";
        });
        */
    });
});