document.addEventListener("DOMContentLoaded", function() {
    
    // --- 1. SEGURANÇA ---
    const currentUserEmail = sessionStorage.getItem("currentUserEmail");
    const currentUserName = sessionStorage.getItem("currentUserName");
    const userRole = sessionStorage.getItem("currentUserRole");

    if (!currentUserEmail || (userRole !== 'Admin' && userRole !== 'admin')) {
        alert("Acesso Restrito.");
        window.location.href = 'index.html';
        return;
    }

    // Navbar
    const navRight = document.querySelector('.nav-right');
    if(navRight && currentUserName) {
        const firstName = currentUserName.split(' ')[0];
        navRight.innerHTML = `
            <span class="user-greeting" style="margin-right:15px; color:#FFD700; font-weight:bold;">Olá, ${firstName}</span>
            <a href="perfil.html" class="user-icon" style="color:white; margin-right:15px;"><i class="fa-solid fa-user"></i></a>
            <button id="logoutBtn" class="auth-link-logout">Sair</button>
        `;
        document.getElementById('logoutBtn').addEventListener('click', () => {
            sessionStorage.clear();
            window.location.href = 'autenticacao.html';
        });
    }

    // --- 2. VARIAVEIS GLOBAIS ---
    const USERS_KEY = 'usersDB';
    const EVENTS_KEY = 'eventsDB';
    let chartInstance = null; // Para destruir e recriar o gráfico

    const navItems = document.querySelectorAll('.nav-item');
    const views = document.querySelectorAll('.admin-view');

    // Elementos
    const tbody = document.getElementById('usersTableBody');
    const searchInput = document.getElementById('userSearch');
    const countBadge = document.getElementById('userCountBadge');
    const logsList = document.getElementById('logsList');

    // KPIs
    const kpiUsers = document.getElementById('kpiTotalUsers');
    const kpiFunds = document.getElementById('kpiTotalFunds');
    const kpiCampaigns = document.getElementById('kpiActiveEvents');

    // Modal
    const modal = document.getElementById('userModal');
    const userForm = document.getElementById('userForm');
    const btnNewUser = document.getElementById('btnNewUser');
    const closeBtns = document.querySelectorAll('.close-modal');
    const modalTitle = document.getElementById('modalTitle');
    
    const inputId = document.getElementById('userId');
    const inputName = document.getElementById('userName');
    const inputEmail = document.getElementById('userEmail');
    const inputHandle = document.getElementById('userHandle');
    const inputPass = document.getElementById('userPass');
    const inputRole = document.getElementById('userRole');

    // --- 3. INICIALIZAÇÃO ---
    init();

    function init() {
        checkSeedData();
        setupNavigation();
        updateKPIs(); // Carrega KPIs iniciais
        
        // Se a view inicial for overview, renderiza gráfico
        const activeView = document.querySelector('.nav-item.active').getAttribute('data-target');
        if (activeView === 'overview' || activeView === 'financial') {
            setTimeout(renderChart, 100);
        }
    }

    // --- 4. NAVEGAÇÃO ---
    function setupNavigation() {
        navItems.forEach(item => {
            item.addEventListener('click', function() {
                navItems.forEach(n => n.classList.remove('active'));
                this.classList.add('active');

                const target = this.getAttribute('data-target');
                views.forEach(v => v.classList.add('hidden'));
                
                const viewToShow = document.getElementById(`view-${target}`);
                if(viewToShow) viewToShow.classList.remove('hidden');

                // Renderiza conteúdo específico ao abrir a aba
                if(target === 'overview') { updateKPIs(); renderChart(); }
                if(target === 'users') renderTable();
                if(target === 'financial') renderChart();
                if(target === 'logs') renderLogs();
            });
        });
    }

    // --- 5. DADOS (Helpers) ---
    function getUsers() { return JSON.parse(localStorage.getItem(USERS_KEY)) || []; }
    function saveUsers(d) { localStorage.setItem(USERS_KEY, JSON.stringify(d)); }
    function getEvents() { return JSON.parse(localStorage.getItem(EVENTS_KEY)) || []; }

    function checkSeedData() {
        const users = getUsers();
        if (users.length === 0) {
            // Se vazio, cria admin padrão
            const seed = [{ ID_Usuario: 1, Nome: "Admin", Email: "admin@admin.com", Usuario_Handle: "admin", Senha: "123", Tipo_Usuario: "Admin", Data_Criacao: new Date().toISOString() }];
            saveUsers(seed);
        }
    }

    // --- 6. KPIS EM TEMPO REAL ---
    function updateKPIs() {
        const users = getUsers();
        const events = getEvents();

        if(kpiUsers) kpiUsers.innerText = users.length;
        
        const donations = events.filter(e => e.Meta_Arrecadacao && parseFloat(e.Meta_Arrecadacao) > 0);
        if(kpiCampaigns) kpiCampaigns.innerText = donations.length;

        const total = events.reduce((acc, e) => acc + (parseFloat(e.Valor_Arrecadado) || 0), 0);
        if(kpiFunds) kpiFunds.innerText = `R$ ${total.toLocaleString('pt-BR', {minimumFractionDigits:2})}`;
    }

    // --- 7. TABELA (CRUD) ---
    function renderTable() {
        if(!tbody) return;
        const users = getUsers();
        const term = searchInput ? searchInput.value.toLowerCase() : '';
        tbody.innerHTML = '';
        let count = 0;

        users.forEach(u => {
            if(u.Nome.toLowerCase().includes(term) || u.Email.toLowerCase().includes(term)) {
                const tr = document.createElement('tr');
                const dateStr = u.Data_Criacao ? new Date(u.Data_Criacao).toLocaleDateString() : '-';
                const roleClass = u.Tipo_Usuario === 'Admin' ? 'admin' : 'comum';

                tr.innerHTML = `
                    <td>${u.ID_Usuario}</td>
                    <td>
                        <div style="font-weight:bold; color:white">${u.Nome}</div>
                        <small style="color:#888">@${u.Usuario_Handle}</small>
                    </td>
                    <td>${u.Email}</td>
                    <td><span class="badge ${roleClass}">${u.Tipo_Usuario}</span></td>
                    <td>${dateStr}</td>
                    <td>
                        <button class="action-btn edit-btn" onclick="openEditUser(${u.ID_Usuario})"><i class="fa-solid fa-pen"></i></button>
                        <button class="action-btn del-btn" onclick="deleteUser(${u.ID_Usuario})"><i class="fa-solid fa-trash"></i></button>
                    </td>
                `;
                tbody.appendChild(tr);
                count++;
            }
        });
        if(countBadge) countBadge.innerText = `${count} usuários`;
    }

    if(searchInput) searchInput.addEventListener('keyup', renderTable);

    window.openEditUser = function(id) {
        const users = getUsers();
        const user = users.find(u => u.ID_Usuario === id);
        if(user) {
            inputId.value = user.ID_Usuario;
            inputName.value = user.Nome;
            inputEmail.value = user.Email;
            inputHandle.value = user.Usuario_Handle || "";
            inputRole.value = user.Tipo_Usuario;
            inputPass.value = ""; 
            modalTitle.innerText = "Editar Usuário";
            modal.classList.remove('hidden');
        }
    };

    window.deleteUser = function(id) {
        if(confirm("Remover usuário?")) {
            let users = getUsers();
            if(users.find(u => u.ID_Usuario === id).Email === currentUserEmail) {
                alert("Não pode excluir a si mesmo."); return;
            }
            users = users.filter(u => u.ID_Usuario !== id);
            saveUsers(users);
            renderTable(); updateKPIs();
        }
    };

    userForm.addEventListener('submit', (e) => {
        e.preventDefault();
        let users = getUsers();
        const id = inputId.value ? parseInt(inputId.value) : Date.now();
        const idx = users.findIndex(u => u.ID_Usuario === id);

        const newData = {
            ID_Usuario: id,
            Nome: inputName.value,
            Email: inputEmail.value,
            Usuario_Handle: inputHandle.value,
            Tipo_Usuario: inputRole.value,
            Senha: inputPass.value ? inputPass.value : (idx !== -1 ? users[idx].Senha : "123456"),
            Data_Criacao: idx !== -1 ? users[idx].Data_Criacao : new Date().toISOString()
        };

        if(idx !== -1) users[idx] = newData;
        else {
            if(users.some(u => u.Email === newData.Email)) { alert("Email já existe"); return; }
            users.push(newData);
        }

        saveUsers(users);
        modal.classList.add('hidden');
        renderTable(); updateKPIs(); renderLogs(); // Atualiza logs ao criar user
        alert("Salvo!");
    });

    if(btnNewUser) btnNewUser.addEventListener('click', () => {
        userForm.reset(); inputId.value = ""; modalTitle.innerText = "Novo Usuário"; modal.classList.remove('hidden');
    });
    closeBtns.forEach(btn => btn.addEventListener('click', () => modal.classList.add('hidden')));

    // ==========================================
    // 8. GRÁFICO REAL-TIME (Últimos 6 meses)
    // ==========================================
    function renderChart() {
        const ctx = document.getElementById('financialChart') || document.getElementById('overviewChart');
        if(!ctx) return;

        if(chartInstance) chartInstance.destroy(); // Evita sobreposição

        // Lógica de Cálculo Mensal
        const events = getEvents();
        const labels = [];
        const dataValues = [];
        const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
        const today = new Date();

        // Gera os últimos 6 meses
        for (let i = 5; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const mIndex = d.getMonth();
            const year = d.getFullYear();
            
            labels.push(monthNames[mIndex]);

            // Soma Valor_Arrecadado dos eventos criados neste mês/ano
            const totalMonth = events.reduce((acc, evt) => {
                const eDate = new Date(evt.Data_Criacao);
                if (eDate.getMonth() === mIndex && eDate.getFullYear() === year) {
                    return acc + (parseFloat(evt.Valor_Arrecadado) || 0);
                }
                return acc;
            }, 0);
            dataValues.push(totalMonth);
        }

        chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Entradas (R$)',
                    data: dataValues,
                    borderColor: '#5b2be0',
                    backgroundColor: (context) => {
                        const ctx = context.chart.ctx;
                        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
                        gradient.addColorStop(0, 'rgba(91, 43, 224, 0.5)');
                        gradient.addColorStop(1, 'rgba(91, 43, 224, 0.0)');
                        return gradient;
                    },
                    fill: true, tension: 0.4, pointBackgroundColor: '#FFD700'
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { labels: { color: '#ccc' } } },
                scales: { y: { ticks: { color: '#888' }, grid: { color: 'rgba(255,255,255,0.05)' } }, x: { ticks: { color: '#888' }, grid: { display: false } } }
            }
        });
    }

    // ==========================================
    // 9. LOGS DE ATIVIDADES REAIS
    // ==========================================
    function renderLogs() {
        if(!logsList) return;
        
        const users = getUsers();
        const events = getEvents();
        let activities = [];

        // Mapeia usuários criados
        users.forEach(u => {
            activities.push({
                text: `Novo usuário: <strong style="color:white">${u.Nome.split(' ')[0]}</strong>`,
                date: new Date(u.Data_Criacao),
                icon: 'fa-user-plus', color: '#bda4ff'
            });
        });

        // Mapeia eventos e doações
        events.forEach(e => {
            // Evento criado
            activities.push({
                text: `Evento criado: <strong style="color:white">${e.Titulo}</strong>`,
                date: new Date(e.Data_Criacao),
                icon: 'fa-calendar-plus', color: '#5b2be0'
            });

            // Se teve doação
            if (parseFloat(e.Valor_Arrecadado) > 0) {
                activities.push({
                    text: `Doação recebida: <strong style="color:#FFD700">R$ ${e.Valor_Arrecadado}</strong>`,
                    date: new Date(e.Data_Criacao), // Usando data de criação como aproximação
                    icon: 'fa-sack-dollar', color: '#FFD700'
                });
            }
        });

        // Ordena por mais recente
        activities.sort((a, b) => b.date - a.date);
        
        // Pega os últimos 15
        const recent = activities.slice(0, 15);

        if(recent.length === 0) {
            logsList.innerHTML = '<p style="text-align:center; color:#888; padding:20px;">Nenhuma atividade registrada.</p>';
            return;
        }

        logsList.innerHTML = recent.map(log => `
            <div class="log-item">
                <div class="log-icon" style="color:${log.color}"><i class="fa-solid ${log.icon}"></i></div>
                <div class="log-content">
                    <h4>${log.text}</h4>
                    <small>${timeSince(log.date)}</small>
                </div>
            </div>
        `).join('');
    }

    function timeSince(date) {
        const seconds = Math.floor((new Date() - date) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " anos atrás";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " meses atrás";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " dias atrás";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " horas atrás";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " min atrás";
        return "Agora mesmo";
    }
});