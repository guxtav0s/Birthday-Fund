document.addEventListener("DOMContentLoaded", function() {

    const API_BASE_URL = "http://localhost:3000";

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
            btnSeguir.disabled = !isValid;
        }
    }

    emailInput.addEventListener("input", validarEmail);

    form.addEventListener("submit", async function(event) {
        event.preventDefault();

        const email = emailInput.value;
        const originalText = btnSeguir.textContent;

        btnSeguir.disabled = true;
        btnSeguir.textContent = "Enviando...";
        mensagemGeral.textContent = "";

        try {
            // Chamada à API para solicitar recuperação
            const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email }) // Postman geralmente espera 'email' aqui
            });

            const data = await response.json().catch(() => ({}));

            if (response.ok) {
                // SUCESSO
                // Salva o email para usar na próxima etapa
                sessionStorage.setItem("resetEmail", email);

                // UI Sucesso
                formContainer.style.display = "none";
                successMessage.style.display = "block";

                // AJUDA PARA TESTE (Se a API devolver o token na resposta, mostramos num alert)
                if(data.token) {
                    alert(`[MODO TESTE] O Token gerado foi: ${data.token}\nCopie este código para a próxima etapa.`);
                }

                // Redireciona
                setTimeout(() => {
                    window.location.href = "redefinir-senha.html";
                }, 3000);

            } else {
                // ERRO (Ex: Email não existe)
                mensagemGeral.textContent = data.message || "Não foi possível enviar o código. Verifique o e-mail.";
                btnSeguir.disabled = false;
                btnSeguir.textContent = originalText;
            }

        } catch (error) {
            console.error(error);
            mensagemGeral.textContent = "Erro de conexão com o servidor.";
            btnSeguir.disabled = false;
            btnSeguir.textContent = originalText;
        }
    });
});