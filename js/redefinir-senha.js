document.addEventListener("DOMContentLoaded", function() {

    // --- Seleção de Elementos ---
    const form = document.getElementById("formRedefinir");
    const senhaInput = document.getElementById("senha");
    const confirmarSenhaInput = document.getElementById("confirmarSenha");
    const btnRedefinir = document.getElementById("btnRedefinir");

    const senhaError = document.getElementById("senhaError");
    const confirmarError = document.getElementById("confirmarError");
    const mensagemGeral = document.getElementById("mensagemGeral");
    
    const toggleSenhaIcons = document.querySelectorAll(".toggle-senha");

    // Objeto de Validação
    const validacao = {
        senha: false,
        confirmarSenha: false
    };

    // --- Funções de Validação (Idênticas ao Cadastro) ---
    function validarSenha() {
        const senha = senhaInput.value;
        const regexSenha = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
        if (!regexSenha.test(senha)) {
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
        btnRedefinir.disabled = !todosValidos;
    }

    // --- Lógica de Mostrar/Esconder Senha ---
    toggleSenhaIcons.forEach(icon => {
        icon.addEventListener("click", function() {
            const targetId = this.getAttribute("data-target");
            const targetInput = document.getElementById(targetId);
            if (targetInput.type === "password") {
                targetInput.type = "text";
                this.classList.remove("fa-eye-slash"); this.classList.add("fa-eye");
            } else {
                targetInput.type = "password";
                this.classList.remove("fa-eye"); this.classList.add("fa-eye-slash");
            }
        });
    });

    // --- Event Listeners ---
    senhaInput.addEventListener("input", validarSenha);
    confirmarSenhaInput.addEventListener("input", validarConfirmarSenha);

    // --- Submissão do Formulário (MOCK "AO VIVO") ---
    form.addEventListener("submit", function(event) {
        event.preventDefault();

        btnRedefinir.disabled = true;
        btnRedefinir.textContent = "Salvando...";
        mensagemGeral.textContent = "";

        // --- INÍCIO DO MOCK (com localStorage) ---
        const emailParaRedefinir = localStorage.getItem("emailParaRedefinir");
        const novaSenha = senhaInput.value;

        if (!emailParaRedefinir) {
            mensagemGeral.textContent = "Sessão inválida. Volte e solicite o link novamente.";
            btnRedefinir.disabled = false;
            btnRedefinir.textContent = "Confirmar Alteração";
            return;
        }

        console.log("MOCK: Redefinindo senha para:", emailParaRedefinir);

        setTimeout(() => {
            let usersDB = JSON.parse(localStorage.getItem("usersDB")) || [];
            
            const userIndex = usersDB.findIndex(user => user.email === emailParaRedefinir);

            if (userIndex > -1) {
                
                // --- INÍCIO DA NOVA VALIDAÇÃO ---
                const usuario = usersDB[userIndex];
                if (usuario.senha === novaSenha) {
                    console.log("MOCK: Erro - Nova senha é igual à antiga.");
                    mensagemGeral.textContent = "A nova senha não pode ser igual à senha anterior.";
                    mensagemGeral.style.color = "#ff6b6b"; // Vermelho
                    btnRedefinir.disabled = false;
                    btnRedefinir.textContent = "Confirmar Alteração";
                    return; // Para a execução aqui
                }
                // --- FIM DA NOVA VALIDAÇÃO ---

                // Se passou na validação, atualiza a senha
                usersDB[userIndex].senha = novaSenha;
                
                localStorage.setItem("usersDB", JSON.stringify(usersDB));
                localStorage.removeItem("emailParaRedefinir");

                // Sucesso
                mensagemGeral.textContent = "Senha alterada com sucesso!";
                mensagemGeral.style.color = "#4cff4c"; // Verde

                // Redireciona para o login
                setTimeout(() => {
                    window.location.href = "login.html";
                }, 2000);

            } else {
                // Erro (não deveria acontecer se a tela 1 funcionou)
                mensagemGeral.textContent = "Erro ao encontrar usuário. Tente novamente.";
                btnRedefinir.disabled = false;
                btnRedefinir.textContent = "Confirmar Alteração";
            }
        }, 1500);
        // --- FIM DO MOCK ---

        /* // --- CÓDIGO DA API REAL ---
        // (Basta apagar o bloco MOCK acima e descomentar este bloco)

        // 1. Pega o token da URL (ex: ...html?token=abc123)
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        const novaSenha = senhaInput.value;

        if (!token) {
            mensagemGeral.textContent = "Link de redefinição inválido ou ausente.";
            btnRedefinir.disabled = false;
            btnRedefinir.textContent = "Confirmar Alteração";
            return; // Encerra a função
        }

        // 2. SUBSTITUIR PELA URL DA API QUANDO O BACKEND ESTIVER PRONTO
        const apiUrl = "https://sua-api-real-aqui.com/redefinir-senha";
        
        fetch(apiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                token: token, // O token lido da URL
                novaSenha: novaSenha 
            })
        })
        .then(response => {
            // se a senha for igual à antiga (ex: 422 Unprocessable Entity)
            if (response.status === 422) {
                mensagemGeral.textContent = "A nova senha não pode ser igual à senha anterior.";
                btnRedefinir.disabled = false;
                btnRedefinir.textContent = "Confirmar Alteração";
            } else if (response.ok) {
                mensagemGeral.textContent = "Senha alterada com sucesso!";
                mensagemGeral.style.color = "#4cff4c";
                setTimeout(() => {
                    window.location.href = "login.html";
                }, 2000);
            } else {
                mensagemGeral.textContent = "Link de redefinição inválido ou expirado.";
                btnRedefinir.disabled = false;
                btnRedefinir.textContent = "Confirmar Alteração";
            }
        })
        .catch(error => {
            console.error("Erro na chamada fetch:", error);
            mensagemGagemGeral.textContent = "Erro de conexão com o servidor.";
            btnRedefinir.disabled = false;
            btnRedefinir.textContent = "Confirmar Alteração";
        });
        */
    });
});