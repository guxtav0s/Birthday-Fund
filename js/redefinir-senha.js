document.addEventListener("DOMContentLoaded", function() {

    // Verifica se veio do fluxo correto
    const emailToReset = sessionStorage.getItem("resetEmail");
    if (!emailToReset) {
        alert("Fluxo inválido. Inicie pelo 'Esqueci minha senha'.");
        window.location.href = "autenticacao.html";
        return;
    }

    const form = document.getElementById("formRedefinir");
    const senhaInput = document.getElementById("senha");
    const confirmarSenhaInput = document.getElementById("confirmarSenha");
    const btnRedefinir = document.getElementById("btnRedefinir");

    const senhaError = document.getElementById("senhaError");
    const confirmarError = document.getElementById("confirmarError");
    const mensagemGeral = document.getElementById("mensagemGeral");
    
    // Toggle Senha
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
        
        // Força da Senha
        const regexSenha = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
        if (!regexSenha.test(senhaInput.value)) {
            senhaError.textContent = "Mínimo 8 caracteres, letra e número.";
            valid = false;
        } else {
            senhaError.textContent = "";
        }

        // Confirmação
        if (confirmarSenhaInput.value !== senhaInput.value) {
            confirmarError.textContent = "As senhas não coincidem.";
            valid = false;
        } else {
            confirmarError.textContent = "";
        }

        // Habilitar botão
        if (senhaInput.value === "" || confirmarSenhaInput.value === "") valid = false;
        
        btnRedefinir.disabled = !valid;
    }

    senhaInput.addEventListener("input", validarFormulario);
    confirmarSenhaInput.addEventListener("input", validarFormulario);

    // Submit
    form.addEventListener("submit", function(e) {
        e.preventDefault();
        btnRedefinir.disabled = true;
        btnRedefinir.textContent = "Atualizando...";

        setTimeout(() => {
            let usersDB = JSON.parse(localStorage.getItem("usersDB")) || [];
            const userIndex = usersDB.findIndex(u => u.Email === emailToReset);

            if (userIndex !== -1) {
                // Atualiza Senha
                usersDB[userIndex].Senha = senhaInput.value;
                localStorage.setItem("usersDB", JSON.stringify(usersDB));

                // Limpa sessão
                sessionStorage.removeItem("resetEmail");

                mensagemGeral.style.color = "#4CAF50";
                mensagemGeral.textContent = "Senha redefinida com sucesso!";

                setTimeout(() => {
                    window.location.href = "autenticacao.html";
                }, 2000);
            } else {
                mensagemGeral.textContent = "Erro ao encontrar usuário.";
                btnRedefinir.disabled = false;
            }
        }, 1000);
    });
});