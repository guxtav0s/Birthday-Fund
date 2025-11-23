document.addEventListener("DOMContentLoaded", function() {
    
    // --- CONFIGURAÇÕES ---
    const DB_KEY = 'eventsDB';
    const currentUserEmail = sessionStorage.getItem("currentUserEmail");
    const currentUserName = sessionStorage.getItem("currentUserName");

    // Proteção de Rota
    if (!currentUserEmail) {
        window.location.href = "autenticacao.html";
        return;
    }

    // Navbar
    const navRight = document.querySelector('.nav-right');
    if(navRight) {
        navRight.innerHTML = `
            <span style="margin-right:10px; font-weight:bold; color:#FFD700">Olá, ${currentUserName.split(' ')[0]}</span>
            <a href="autenticacao.html" class="auth-link" style="border:1px solid white; padding:5px 15px; border-radius:20px; text-decoration:none; font-size:0.9rem;">Sair</a>
        `;
    }

    // Elementos DOM
    const grid = document.getElementById('events-grid');
    const btnHosted = document.getElementById('btnHosted');
    const btnInvited = document.getElementById('btnInvited');
    const btnDonations = document.getElementById('btnDonations');
    
    // Modal
    const editModal = document.getElementById('editEventModal');
    const editForm = document.getElementById('editForm');
    const modalTitleText = document.getElementById('modalTitleText');
    const modalHeaderBg = document.querySelector('.modal-header-bg');
    const modalIcon = document.getElementById('modalIcon');
    
    // Campos Modal
    const inputTitle = document.getElementById('editTitle');
    const inputDate = document.getElementById('editDate');
    const inputTime = document.getElementById('editTime');
    const inputLocation = document.getElementById('editLocation');
    const inputDescription = document.getElementById('editDescription');
    const inputId = document.getElementById('editId');

    // Áreas Específicas
    const metaDisplayArea = document.getElementById('metaDisplayArea');
    const hostControls = document.getElementById('hostControls');
    const guestListDisplay = document.getElementById('guestListDisplay');
    const newGuestInput = document.getElementById('newGuestEmail');
    const btnAddGuest = document.getElementById('btnAddGuest');

    // Botões de Ação
    const ownerActions = document.getElementById('ownerActions');
    const guestActions = document.getElementById('guestActions');
    const donationActions = document.getElementById('donationActions');
    
    const btnDelete = document.getElementById('btnDelete');
    const btnConfirm = document.getElementById('btnConfirm');
    const btnDecline = document.getElementById('btnDecline');
    const btnContribute = document.getElementById('btnContribute');
    const closeBtn = document.querySelector('.close-modal-btn');

    // Estado
    let currentTab = 'hosted'; 
    let tempGuestList = [];

    // --- INICIALIZAÇÃO ---
    init();

    function init() {
        // Listeners das Abas
        btnHosted.addEventListener('click', () => switchTab('hosted'));
        btnInvited.addEventListener('click', () => switchTab('invited'));
        btnDonations.addEventListener('click', () => switchTab('donations'));

        // DELEGAÇÃO DE EVENTOS (CORREÇÃO DO BUG DO CLIQUE)
        // Ao invés de colocar onclick em cada botão, vigiamos a grid inteira.
        grid.addEventListener('click', function(e) {
            // Procura se o clique foi dentro de um botão com a classe 'js-open-modal'
            const btn = e.target.closest('.js-open-modal');
            
            if (btn) {
                const id = btn.getAttribute('data-id');
                if (id) {
                    openEventModal(parseInt(id));
                }
            }
        });

        // Verifica URL
        const urlParams = new URLSearchParams(window.location.search);
        const openId = urlParams.get('editId');

        loadAndRender();

        if(openId) {
            openEventModal(parseInt(openId));
            window.history.replaceState({}, document.title, "gerenciamento-eventos.html");
        }
    }

    // ==========================================
    // DADOS
    // ==========================================
    function getEvents() {
        try { return JSON.parse(localStorage.getItem(DB_KEY)) || []; } 
        catch (e) { return []; }
    }

    function saveEvents(events) {
        localStorage.setItem(DB_KEY, JSON.stringify(events));
    }

    function switchTab(tab) {
        currentTab = tab;
        btnHosted.classList.toggle('active', tab === 'hosted');
        btnInvited.classList.toggle('active', tab === 'invited');
        btnDonations.classList.toggle('active', tab === 'donations');
        loadAndRender();
    }

    // ==========================================
    // RENDERIZAÇÃO (Sem onclick inline)
    // ==========================================
    function loadAndRender() {
        const allEvents = getEvents();
        grid.innerHTML = '';

        const filteredEvents = allEvents.filter(evt => {
            const isOwner = evt.FK_Usuario === currentUserEmail;
            const isCampaign = evt.Meta_Arrecadacao && parseFloat(evt.Meta_Arrecadacao) > 0;
            
            let isGuest = false;
            if (Array.isArray(evt.Lista_Convidados)) {
                isGuest = evt.Lista_Convidados.some(email => email && email.trim() === currentUserEmail);
            }

            if (currentTab === 'hosted') return isOwner;
            else if (currentTab === 'invited') return isGuest && !isOwner && !isCampaign;
            else if (currentTab === 'donations') return isCampaign && !isOwner;
            return false;
        });

        if (filteredEvents.length === 0) {
            let msg = '';
            if(currentTab === 'hosted') msg = 'Você ainda não criou nenhum evento.';
            else if(currentTab === 'invited') msg = 'Nenhum convite pendente.';
            else msg = 'Nenhuma campanha disponível.';
            
            grid.innerHTML = `<p style="grid-column:1/-1; text-align:center; color:#ccc; padding:40px;">${msg}</p>`;
            return;
        }

        filteredEvents.forEach(evt => {
            const isOwner = evt.FK_Usuario === currentUserEmail;
            const isDonation = evt.Meta_Arrecadacao && parseFloat(evt.Meta_Arrecadacao) > 0;
            
            const stripClass = isDonation ? 'donate' : 'hosted';
            const stripClassFinal = (!isOwner && !isDonation) ? 'invited' : stripClass;

            let roleText = isOwner ? 'Organizador' : (isDonation ? 'Campanha' : (evt.Confirmado_Presenca ? 'Confirmado' : 'Pendente'));
            
            let btnText = '', btnClass = '', btnIcon = '';
            if (isOwner) { btnText = 'Gerenciar'; btnClass = 'btn-edit'; btnIcon = 'fa-pen'; }
            else if (isDonation) { btnText = 'Ver & Doar'; btnClass = 'btn-view'; btnIcon = 'fa-heart'; }
            else { btnText = 'Responder'; btnClass = 'btn-view'; btnIcon = 'fa-envelope'; }

            let progressHTML = '';
            if (isDonation) {
                const meta = parseFloat(evt.Meta_Arrecadacao);
                const atual = parseFloat(evt.Valor_Arrecadado || 0);
                const pct = Math.min((atual/meta)*100, 100);
                progressHTML = `<div style="height:4px; background:#444; border-radius:2px; margin-top:10px;"><div style="width:${pct}%; height:100%; background:#FFD700; border-radius:2px;"></div></div>`;
            }

            const card = document.createElement('div');
            card.className = 'manage-card';
            
            // AQUI ESTÁ A CORREÇÃO: Usamos data-id e classe js-open-modal
            card.innerHTML = `
                <div class="status-strip ${stripClassFinal}"></div>
                <div class="card-header">
                    <div class="date-badge">
                        <span class="d">${evt.Data ? evt.Data.split('/')[0] : '--'}</span>
                        <span class="m">${monthName(evt.Data)}</span>
                    </div>
                    <div class="role-badge">${roleText}</div>
                </div>
                <div class="card-body">
                    <h3>${evt.Titulo}</h3>
                    <p><i class="fa-regular fa-clock"></i> ${evt.Hora}</p>
                    <p><i class="fa-solid fa-location-dot"></i> ${evt.Local}</p>
                    ${progressHTML}
                </div>
                <div class="card-actions">
                    <button class="btn-action ${btnClass} js-open-modal" data-id="${evt.ID_Evento}">
                        <i class="fa-solid ${btnIcon}"></i> ${btnText}
                    </button>
                </div>
            `;
            grid.appendChild(card);
        });
    }

    // ==========================================
    // MODAL LOGIC
    // ==========================================
    function openEventModal(id) {
        const allEvents = getEvents();
        const evt = allEvents.find(e => e.ID_Evento === id);
        if (!evt) return;

        const isOwner = evt.FK_Usuario === currentUserEmail;
        const isDonation = evt.Meta_Arrecadacao && parseFloat(evt.Meta_Arrecadacao) > 0;

        inputId.value = evt.ID_Evento;
        inputTitle.value = evt.Titulo;
        inputDate.value = evt.Data;
        inputTime.value = evt.Hora;
        inputLocation.value = evt.Local;
        inputDescription.value = evt.Descricao || "";

        const inputs = editForm.querySelectorAll('input:not([type=hidden]), textarea');

        // Reset UI
        ownerActions.classList.add('hidden');
        guestActions.classList.add('hidden');
        donationActions.classList.add('hidden');
        hostControls.classList.add('hidden');
        metaDisplayArea.classList.add('hidden');
        
        modalHeaderBg.style.background = "linear-gradient(135deg, #5b2be0, #8A2BE2)";
        modalIcon.className = "fa-solid fa-calendar-day";
        modalIcon.style.color = "rgba(255,255,255,0.3)";

        if (isOwner) {
            // DONO
            modalTitleText.innerText = "Gerenciar Evento";
            inputs.forEach(i => i.disabled = false);
            
            hostControls.classList.remove('hidden');
            ownerActions.classList.remove('hidden');
            
            tempGuestList = Array.isArray(evt.Lista_Convidados) ? [...evt.Lista_Convidados] : [];
            renderGuestList();

        } else if (isDonation) {
            // DOAÇÃO
            modalTitleText.innerText = "Campanha Solidária";
            inputs.forEach(i => i.disabled = true);
            
            donationActions.classList.remove('hidden');
            metaDisplayArea.classList.remove('hidden');
            
            modalHeaderBg.style.background = "linear-gradient(135deg, #FFD700, #FDB931)";
            modalIcon.className = "fa-solid fa-hand-holding-heart";
            modalIcon.style.color = "#1A1F45";

            const meta = parseFloat(evt.Meta_Arrecadacao);
            const atual = parseFloat(evt.Valor_Arrecadado || 0);
            const pct = Math.min((atual/meta)*100, 100);
            document.getElementById('modalProgressFill').style.width = `${pct}%`;
            document.getElementById('modalRaisedValue').innerText = `Arrecadado: R$ ${atual}`;
            document.getElementById('modalMetaValue').innerText = `Meta: R$ ${meta}`;

            btnContribute.onclick = () => donateToEvent(id, 50.00); // Valor fixo

        } else {
            // CONVITE
            modalTitleText.innerText = "Convite de Festa";
            inputs.forEach(i => i.disabled = true);
            guestActions.classList.remove('hidden');

            if (evt.Confirmado_Presenca) {
                btnConfirm.innerHTML = '<i class="fa-solid fa-check"></i> Confirmado';
                btnConfirm.style.background = "#4CAF50";
                btnConfirm.disabled = true;
            } else {
                btnConfirm.innerHTML = 'Confirmar Presença';
                btnConfirm.style.background = "#5b2be0";
                btnConfirm.disabled = false;
                btnConfirm.onclick = () => rsvpEvent(id, true);
            }
            
            btnDecline.onclick = () => rsvpEvent(id, false);
        }

        editModal.classList.remove('hidden');
    }

    function closeEditModal() {
        editModal.classList.add('hidden');
    }

    // ==========================================
    // AÇÕES
    // ==========================================
    function donateToEvent(id, amount) {
        let allEvents = getEvents();
        const idx = allEvents.findIndex(e => e.ID_Evento === id);
        if (idx !== -1) {
            const atual = parseFloat(allEvents[idx].Valor_Arrecadado || 0);
            allEvents[idx].Valor_Arrecadado = atual + amount;
            saveEvents(allEvents);
            alert(`Doação de R$ ${amount} registrada!`);
            closeEditModal();
            loadAndRender();
        }
    }

    function rsvpEvent(id, status) {
        let allEvents = getEvents();
        const idx = allEvents.findIndex(e => e.ID_Evento === id);

        if(idx !== -1) {
            if(status) {
                allEvents[idx].Confirmado_Presenca = true;
                alert("Presença confirmada!");
            } else {
                if(confirm("Recusar convite?")) {
                    allEvents[idx].Lista_Convidados = allEvents[idx].Lista_Convidados.filter(e => e !== currentUserEmail);
                } else return;
            }
            saveEvents(allEvents);
            closeEditModal();
            loadAndRender();
        }
    }

    // --- Dono: Convidados ---
    if(btnAddGuest) {
        btnAddGuest.addEventListener('click', () => {
            const email = newGuestInput.value.trim();
            if (email && email.includes('@')) {
                if (!tempGuestList.includes(email)) {
                    tempGuestList.push(email);
                    renderGuestList();
                    newGuestInput.value = '';
                } else alert('Já adicionado.');
            } else alert('E-mail inválido.');
        });
    }

    function renderGuestList() {
        guestListDisplay.innerHTML = '';
        tempGuestList.forEach((email, index) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${email}</span>
                <i class="fa-solid fa-trash remove-guest-icon" data-index="${index}"></i>
            `;
            guestListDisplay.appendChild(li);
        });

        // Adiciona listener nos ícones de lixo gerados dinamicamente
        document.querySelectorAll('.remove-guest-icon').forEach(icon => {
            icon.addEventListener('click', function() {
                const idx = this.getAttribute('data-index');
                tempGuestList.splice(idx, 1);
                renderGuestList();
            });
        });
    }

    // --- Salvar / Excluir ---
    editForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const id = parseInt(inputId.value);
        let allEvents = getEvents();
        const idx = allEvents.findIndex(ev => ev.ID_Evento === id);

        if (idx !== -1) {
            allEvents[idx].Titulo = inputTitle.value;
            allEvents[idx].Data = inputDate.value;
            allEvents[idx].Hora = inputTime.value;
            allEvents[idx].Local = inputLocation.value;
            allEvents[idx].Descricao = inputDescription.value;
            allEvents[idx].Lista_Convidados = tempGuestList;

            saveEvents(allEvents);
            closeEditModal();
            loadAndRender();
            alert('Evento atualizado!');
        }
    });

    if(btnDelete) {
        btnDelete.addEventListener('click', () => {
            if(confirm("Excluir evento permanentemente?")) {
                const id = parseInt(inputId.value);
                let allEvents = getEvents();
                allEvents = allEvents.filter(e => e.ID_Evento !== id);
                saveEvents(allEvents);
                closeEditModal();
                loadAndRender();
            }
        });
    }

    // Utils
    if(closeBtn) closeBtn.addEventListener('click', closeEditModal);
    window.addEventListener('click', (e) => { if (e.target === editModal) closeEditModal(); });

    function monthName(dateStr) {
        if(!dateStr) return "";
        const monthMap = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];
        const parts = dateStr.split('/');
        return parts.length > 1 ? monthMap[parseInt(parts[1]) - 1] : "";
    }
});