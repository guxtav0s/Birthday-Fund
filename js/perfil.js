function toggleMenu() {
  const nav = document.getElementById('navLinks');
  nav.classList.toggle('active');
}

function toggleSenha() {
  const section = document.getElementById('senha-section');
  section.classList.toggle('active');
}

function checkStrength() {
  const senha = document.getElementById("novaSenha").value;
  const nivel = document.getElementById("nivel");
  const forca = document.getElementById("forcaSenha");

  let score = 0;
  if (senha.length >= 8) score++;
  if (/[A-Z]/.test(senha)) score++;
  if (/[0-9]/.test(senha)) score++;
  if (/[^A-Za-z0-9]/.test(senha)) score++;

  switch (score) {
    case 0:
    case 1:
      nivel.textContent = "Fraca";
      forca.style.color = "#ff4d4d";
      break;
    case 2:
      nivel.textContent = "Média";
      forca.style.color = "#ffcc00";
      break;
    case 3:
    case 4:
      nivel.textContent = "Forte";
      forca.style.color = "#4CAF50";
      break;
  }
}

function salvarPerfil() {
  const nome = document.getElementById("nome").value;
  const email = document.getElementById("email").value;

  if (!nome || !email) {
    alert("Por favor, preencha os campos obrigatórios (Nome e Email).");
    return;
  }

  alert("Perfil atualizado com sucesso!");
}

function cancelarAlteracoes() {
  const confirmacao = confirm("Deseja descartar as alterações não salvas?");
  if (confirmacao) window.location.href = "inicio.html";
}
