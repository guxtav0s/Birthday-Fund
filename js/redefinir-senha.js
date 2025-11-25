document.addEventListener("DOMContentLoaded", function() {

    const API_BASE_URL = "http://localhost:3000";

    // Verifica se veio do fluxo correto
    const emailToReset = sessionStorage.getItem("resetEmail");
    if (!emailToReset) {
        alert("Fluxo inválido. Por favor, inicie pelo 'Esqueci minha senha'.");
        window.location.href = "esqueci-senha.html"; // Redireciona para o início do fluxo
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

    // Validações
    function validarFormulario() {
        let valid = true;
        
        // Senha tamanho
        if (senhaInput.value.length > 0 && senhaInput.value.length < 6) {
            senhaError.textContent = "A senha deve ter no mínimo 6 caracteres.";
            valid = false;
        } else {
            senhaError.textContent = "";
        }

        // Senhas iguais
        if (confirmarSenhaInput.value.length > 0 && senhaInput.value !== confirmarSenhaInput.value) {
            confirmarError.textContent = "As senhas não coincidem.";
            valid = false;
        } else {
            confirmarError.textContent = "";
        }

        // Token preenchido
        if (!tokenInput.value) valid = false;
        if (senhaInput.value === "" || confirmarSenhaInput.value === "") valid = false;
        
        btnRedefinir.disabled = !valid;
    }

    tokenInput.addEventListener("input", validarFormulario);
    senhaInput.addEventListener("input", validarFormulario);
    confirmarSenhaInput.addEventListener("input", validarFormulario);

    // Submit
    form.addEventListener("submit", async function(e) {
        e.preventDefault();
        
        const originalText = btnRedefinir.textContent;
        btnRedefinir.disabled = true;
        btnRedefinir.textContent = "Atualizando...";
        mensagemGeral.textContent = "";
        mensagemGeral.style.color = ""; // Reset cor

        try {
            const payload = {
                email: emailToReset,
                token: tokenInput.value,
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
                
                // Limpa sessão
                sessionStorage.removeItem("resetEmail");

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