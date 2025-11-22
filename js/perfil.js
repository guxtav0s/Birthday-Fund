document.addEventListener("DOMContentLoaded", function() {

    const form = document.getElementById("perfilForm");
    const profileUserName = document.getElementById("profileUserName");
    const profileUserHandle = document.getElementById("profileUserHandle");
    const inputNome = document.getElementById("nome");
    const inputUsuario = document.getElementById("usuario");
    const inputEmail = document.getElementById("email");
    const inputSenhaAtual = document.getElementById("senhaAtual");
    const inputNovaSenha = document.getElementById("novaSenha");
    const inputConfirmarSenha = document.getElementById("confirmarSenha");
    const checkMostrarSenha = document.getElementById("mostrar-senha");
    const mensagemGeral = document.getElementById("mensagemGeral");
    
    function carregarPerfilUsuario() {
        const userName = sessionStorage.getItem("currentUserName");
        const userEmail = sessionStorage.getItem("currentUserEmail");
        const userHandle = sessionStorage.getItem("currentUserHandle");

        if (userName && userEmail && userHandle) {
            profileUserName.textContent = userName;
            profileUserHandle.textContent = `@${userHandle}`;
            inputNome.value = userName;
            inputUsuario.value = userHandle;
            inputEmail.value = userEmail;
        } else {
            window.location.href = "autenticacao.html";
        }
    }

    checkMostrarSenha.addEventListener("change", function() {
        const isChecked = this.checked;
        inputSenhaAtual.type = isChecked ? "text" : "password";
        inputNovaSenha.type = isChecked ? "text" : "password";
        inputConfirmarSenha.type = isChecked ? "text" : "password";
    });

    form.addEventListener("submit", function(e) {
        e.preventDefault();
        salvarPerfil();
    });

    function salvarPerfil() {
        mensagemGeral.textContent = "";
        const emailAtual = sessionStorage.getItem("currentUserEmail");
        const usersDB = JSON.parse(localStorage.getItem("usersDB")) || [];
        const userIndex = usersDB.findIndex(user => user.email === emailAtual);

        if (userIndex === -1) {
            mensagemGeral.textContent = "Erro: Utilizador não encontrado.";
            mensagemGeral.style.color = "#ff4d4d";
            return;
        }

        const usuario = usersDB[userIndex];
        
        const nomeAtualizado = inputNome.value;
        const usuarioAtualizado = inputUsuario.value;
        const senhaAtual = inputSenhaAtual.value;
        const novaSenha = inputNovaSenha.value;
        const confirmarSenha = inputConfirmarSenha.value;

        let alteracoesFeitas = false;

        if (usuario.nome !== nomeAtualizado || usuario.usuario !== usuarioAtualizado) {
            usuario.nome = nomeAtualizado;
            usuario.usuario = usuarioAtualizado;
            alteracoesFeitas = true;
        }

        if (senhaAtual || novaSenha || confirmarSenha) {
            if (senhaAtual !== usuario.senha) {
                mensagemGeral.textContent = "A 'Senha atual' está incorreta.";
                mensagemGeral.style.color = "#ff4d4d";
                return;
            }
            if (novaSenha.length < 8) {
                mensagemGeral.textContent = "A 'Nova senha' deve ter pelo menos 8 caracteres.";
                mensagemGeral.style.color = "#ff4d4d";
                return;
            }
            if (novaSenha !== confirmarSenha) {
                mensagemGeral.textContent = "As novas senhas não coincidem.";
                mensagemGeral.style.color = "#ff4d4d";
                return;
            }
            if (novaSenha === usuario.senha) {
                mensagemGeral.textContent = "A nova senha não pode ser igual à senha antiga.";
                mensagemGeral.style.color = "#ff4d4d";
                return;
            }
            
            usuario.senha = novaSenha;
            alteracoesFeitas = true;
        }

        if (alteracoesFeitas) {
            localStorage.setItem("usersDB", JSON.stringify(usersDB));
            sessionStorage.setItem("currentUserName", usuario.nome);
            sessionStorage.setItem("currentUserHandle", usuario.usuario);

            mensagemGeral.textContent = "Alterações salvas com sucesso!";
            mensagemGeral.style.color = "#4CAF50";
            
            inputSenhaAtual.value = "";
            inputNovaSenha.value = "";
            inputConfirmarSenha.value = "";
            
            setTimeout(() => {
                window.location.reload(); 
            }, 1500);
        } else {
            mensagemGeral.textContent = "Nenhuma alteração detetada.";
            mensagemGeral.style.color = "#ffcc00";
        }
    }

    carregarPerfilUsuario();
});