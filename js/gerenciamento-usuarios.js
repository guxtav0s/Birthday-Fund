document.addEventListener("DOMContentLoaded", function() {
    
    // --- 1. SEGURANÇA & NAVBAR ---
    const currentUserEmail = sessionStorage.getItem("currentUserEmail");
    const currentUserName = sessionStorage.getItem("currentUserName");
    const userRole = sessionStorage.getItem("currentUserRole");

    if (!currentUserEmail || (userRole !== 'Admin' && userRole !== 'admin')) {
        alert("Acesso Negado.");
        window.location.href = 'index.html';
        return;
    }

    // Preenche Navbar
    const navRight = document.querySelector('.nav-right');
    if(navRight && currentUserName) {
        const firstName = currentUserName.split(' ')[0];
        navRight.innerHTML = `
            <span style="margin-right:15px; color:#FFD700; font-weight:bold;">Olá, ${firstName}</span>
            <a href="perfil.html" style="color:white; margin-right:15px;"><i class="fa-solid fa-user"></i></a>
            <button id="logoutBtn" class="auth-link-logout">Sair</button>
        `;
        document.getElementById('logoutBtn').addEventListener('click', () => {
            sessionStorage.clear();
            window.location.href = 'autenticacao.html';
        });
    }

    // --- 2. CONFIGURAÇÕES ---
    const USERS_KEY = 'usersDB';
    const EVENTS_KEY = 'eventsDB';
    let chartInstance = null;

    // Sidebar e Views
    const navItems = document.querySelectorAll('.nav-item');
    const views = document.querySelectorAll('.admin-view');

    // Tabela e Inputs
    const tbody = document.getElementById('usersTableBody');
    const searchInput = document.getElementById('userSearch');
    const countBadge = document.getElementById('userCountBadge');

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
        
        // Carrega a primeira tela
        updateKPIs();
        renderChart();
    }

    // ==========================================
    // NAVEGAÇÃO (SIDEBAR)
    // ==========================================
    function setupNavigation() {
        navItems.forEach(item => {
            item.addEventListener('click', function() {
                // UI Active
                navItems.forEach(n => n.classList.remove('active'));
                this.classList.add('active');

                // View Switch
                const target = this.getAttribute('data-target');
                views.forEach(v => v.classList.add('hidden'));
                
                const viewToShow = document.getElementById(`view-${target}`);
                if(viewToShow) viewToShow.classList.remove('hidden');

                // Load Content
                if(target === 'overview') { updateKPIs(); renderChart(); }
                if(target === 'users') renderTable();
                if(target === 'financial') renderChart();
                if(target === 'logs') renderLogs();
            });
        });
    }

    // ==========================================
    // DADOS
    // ==========================================
    function getUsers() { return JSON.parse(localStorage.getItem(USERS_KEY)) || []; }
    function saveUsers(d) { localStorage.setItem(USERS_KEY, JSON.stringify(d)); }
    function getEvents() { return JSON.parse(localStorage.getItem(EVENTS_KEY)) || []; }

    function checkSeedData() {
        const users = getUsers();
        // Se vazio ou inválido (bug antigo), recria
        if (users.length === 0 || !users[0].hasOwnProperty('ID_Usuario')) {
            const seed = [
                { ID_Usuario: 1, Nome: "Admin Principal", Email: "admin@admin.com", Usuario_Handle: "admin", Senha: "123", Tipo_Usuario: "Admin", Data_Criacao: new Date().toISOString() },
                { ID_Usuario: 2, Nome: "João Silva", Email: "joao@email.com", Usuario_Handle: "joao123", Senha: "123", Tipo_Usuario: "Comum", Data_Criacao: new Date().toISOString() }
            ];
            saveUsers(seed);
        }
    }

    // ==========================================
    // TELAS
    // ==========================================
    
    // 1. OVERVIEW / KPIs
    function updateKPIs() {
        const users = getUsers();
        const events = getEvents();

        document.getElementById('kpiTotalUsers').innerText = users.length;
        
        const donations = events.filter(e => e.Meta_Arrecadacao && e.Meta_Arrecadacao > 0);
        document.getElementById('kpiActiveEvents').innerText = donations.length;

        const total = events.reduce((acc, e) => acc + (parseFloat(e.Valor_Arrecadado) || 0), 0);
        document.getElementById('kpiTotalFunds').innerText = `R$ ${total.toLocaleString('pt-BR', {minimumFractionDigits:2})}`;
    }

    // 2. USUÁRIOS (TABLE)
    function renderTable() {
        if(!tbody) return;
        const users = getUsers();
        const term = searchInput ? searchInput.value.toLowerCase() : '';
        tbody.innerHTML = '';
        let count = 0;

        users.forEach(u => {
            if(u.Nome.toLowerCase().includes(term) || u.Email.toLowerCase().includes(term)) {
                const tr = document.createElement('tr');
                const date = u.Data_Criacao ? new Date(u.Data_Criacao).toLocaleDateString() : '-';
                const roleClass = u.Tipo_Usuario === 'Admin' ? 'admin' : 'comum';

                tr.innerHTML = `
                    <td>${u.ID_Usuario}</td>
                    <td>
                        <div style="font-weight:bold; color:white">${u.Nome}</div>
                        <small style="color:#888">@${u.Usuario_Handle}</small>
                    </td>
                    <td>${u.Email}</td>
                    <td><span class="badge ${roleClass}">${u.Tipo_Usuario}</span></td>
                    <td>${date}</td>
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

    // 3. MODAL AÇÕES
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
        if(confirm("Remover usuário permanentemente?")) {
            let users = getUsers();
            if(users.find(u => u.ID_Usuario === id).Email === currentUserEmail) {
                alert("Não pode excluir a si mesmo."); return;
            }
            users = users.filter(u => u.ID_Usuario !== id);
            saveUsers(users);
            renderTable();
            updateKPIs();
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
            if(users.some(u => u.Email === newData.Email)) { alert("E-mail já existe"); return; }
            users.push(newData);
        }

        saveUsers(users);
        modal.classList.add('hidden');
        renderTable();
        updateKPIs();
        alert("Salvo!");
    });

    if(btnNewUser) btnNewUser.addEventListener('click', () => {
        userForm.reset();
        inputId.value = "";
        modalTitle.innerText = "Novo Usuário";
        modal.classList.remove('hidden');
    });

    closeBtns.forEach(btn => btn.addEventListener('click', () => modal.classList.add('hidden')));

    // 4. CHART & LOGS (MOCK)
    function renderChart() {
        const ctx = document.getElementById('financialChart') || document.getElementById('overviewChart');
        if(!ctx) return;
        if(chartInstance) chartInstance.destroy();

        chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Jan','Fev','Mar','Abr','Mai','Jun'],
                datasets: [{
                    label: 'Entradas (R$)',
                    data: [500, 1200, 900, 1500, 2200, 3000],
                    borderColor: '#5b2be0',
                    backgroundColor: 'rgba(91,43,224,0.1)',
                    fill: true, tension: 0.4
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: 'white' } } }, scales: { y: { ticks: { color: '#aaa' }, grid: { color: '#333' } }, x: { ticks: { color: '#aaa' }, grid: { color: '#333' } } } }
        });
    }

    function renderLogs() {
        const list = document.getElementById('logsList');
        if(!list) return;
        // Mock
        const logs = [
            {t:"Admin: Login realizado", i:"fa-user-shield", time:"Agora"},
            {t:"Evento 'Festa Surpresa' criado", i:"fa-calendar-plus", time:"15 min"},
            {t:"Novo usuário: Pedro", i:"fa-user-plus", time:"1h"}
        ];
        list.innerHTML = logs.map(l => `
            <div class="log-item">
                <div class="log-icon"><i class="fa-solid ${l.i}"></i></div>
                <div class="log-content"><h4>${l.t}</h4><small>${l.time}</small></div>
            </div>
        `).join('');
    }
});