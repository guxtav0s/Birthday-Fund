document.addEventListener("DOMContentLoaded", function() {

    const formContainer = document.getElementById("formContainer");
    const successMessage = document.getElementById("successMessage");
    const form = document.getElementById("formEsqueci");
    const emailInput = document.getElementById("email");
    const btnSeguir = document.getElementById("btnSeguir");
    const emailError = document.getElementById("emailError");
    const mensagemGeral = document.getElementById("mensagemGeral");

    // Validação em tempo real
    function validarEmail() {
        const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const isValid = regexEmail.test(emailInput.value);
        
        if (!isValid && emailInput.value !== "") {
            emailError.textContent = "Por favor, insira um e-mail válido.";
            btnSeguir.disabled = true;
        } else {
            emailError.textContent = "";
            btnSeguir.disabled = !isValid; // Habilita se válido
        }
    }

    emailInput.addEventListener("input", validarEmail);

    form.addEventListener("submit", function(event) {
        event.preventDefault();

        btnSeguir.disabled = true;
        btnSeguir.textContent = "Verificando...";
        mensagemGeral.textContent = "";

        const email = emailInput.value;

        setTimeout(() => {
            // 1. Busca no Banco de Dados
            const usersDB = JSON.parse(localStorage.getItem("usersDB")) || [];
            const userExists = usersDB.some(u => u.Email === email);

            if (userExists) {
                // 2. Salva e-mail na sessão para a próxima etapa
                sessionStorage.setItem("resetEmail", email);

                // 3. UI Sucesso
                formContainer.style.display = "none";
                successMessage.style.display = "block";

                // 4. Redireciona (Simulação de clique no link do email)
                setTimeout(() => {
                    window.location.href = "redefinir-senha.html";
                }, 2500);

            } else {
                // Erro
                mensagemGeral.textContent = "E-mail não encontrado em nossa base.";
                btnSeguir.disabled = false;
                btnSeguir.textContent = "Enviar Link";
            }
        }, 1000);
    });
});