document.addEventListener("DOMContentLoaded", function() {
    
    // --- CONFIGURAÇÕES ---
    const DB_KEY = 'eventsDB';
    const currentUserEmail = sessionStorage.getItem("currentUserEmail"); 
    const currentUserName = sessionStorage.getItem("currentUserName");

    // Telas
    const heroDefault = document.getElementById('heroDefault');
    const heroLogged = document.getElementById('heroLogged');

    // Elementos
    const eventsListContainer = document.getElementById('eventsList');
    const statInvites = document.getElementById('statInvites');
    const statActive = document.getElementById('statActive');
    const welcomeTitle = document.getElementById('welcomeTitle');

    // Modals
    const detailModal = document.getElementById('eventModal');
    const createModal = document.getElementById('createEventModal');
    const createForm = document.getElementById('createEventForm');

    // --- 1. SEGURANÇA DE LOGIN ---
    if (!currentUserEmail) {
        if(heroDefault) heroDefault.classList.remove('hidden');
        if(heroLogged) heroLogged.classList.add('hidden');
        return; // Para tudo se não estiver logado
    }

    // Se logado, mostra dashboard
    if(heroDefault) heroDefault.classList.add('hidden');
    if(heroLogged) heroLogged.classList.remove('hidden');

    // Saudação
    if(welcomeTitle && currentUserName) {
        const firstName = currentUserName.split(' ')[0];
        welcomeTitle.innerHTML = `Olá, <span style="color:#FFD700">${firstName}</span>!`;
    }

    // Inicia
    loadDashboard();

    // ==========================================
    // 2. GERENCIAMENTO DE DADOS (COM PROTEÇÃO)
    // ==========================================

    function getLocalEvents() {
        const data = localStorage.getItem(DB_KEY);
        if (!data) return null;

        try {
            const parsed = JSON.parse(data);
            
            // TRAVA DE SEGURANÇA:
            // Se existirem dados, mas eles não tiverem a chave nova (ID_Evento),
            // significa que é dado velho. Reseta.
            if (parsed.length > 0 && !parsed[0].hasOwnProperty('ID_Evento')) {
                console.warn("Dados antigos detectados. Resetando banco de dados local.");
                localStorage.removeItem(DB_KEY);
                return null;
            }
            return parsed;
        } catch (e) {
            return null;
        }
    }

    function saveLocalEvents(events) {
        localStorage.setItem(DB_KEY, JSON.stringify(events));
    }

    function loadDashboard() {
        // Spinner
        if(eventsListContainer) {
            eventsListContainer.innerHTML = `
                <div style="padding:40px; text-align:center; color:#ccc;">
                    <i class="fas fa-circle-notch fa-spin"></i> Carregando...
                </div>`;
        }

        setTimeout(() => {
            let allEvents = getLocalEvents();

            // Se vazio ou resetado, cria o Mock Inicial
            if (!allEvents) {
                allEvents = generateInitialMockData();
                saveLocalEvents(allEvents);
            }

            // FILTRO: Dono ou Convidado
            const myEvents = allEvents.filter(evt => {
                const isHost = evt.FK_Usuario === currentUserEmail;
                // Verifica array de convidados
                const isGuest = Array.isArray(evt.Lista_Convidados) && 
                                evt.Lista_Convidados.some(g => g.trim() === currentUserEmail);
                
                return isHost || isGuest;
            });

            // Ordena (Mais recente no topo)
            myEvents.sort((a, b) => new Date(b.Data_Criacao) - new Date(a.Data_Criacao));

            processData(myEvents);
        }, 500);
    }

    function generateInitialMockData() {
        return [
            {
                ID_Evento: 101,
                FK_Usuario: "admin@admin.com", 
                Titulo: "Festa de Inauguração",
                Descricao: "Venha celebrar o lançamento!",
                Local: "Sede Birthday Fund",
                Data: "20/12",
                Hora: "20:00",
                Tipo: "convite", 
                Meta_Arrecadacao: null,
                Valor_Arrecadado: null,
                Lista_Convidados: [currentUserEmail], 
                Confirmado_Presenca: false, 
                Data_Criacao: new Date().toISOString()
            }
        ];
    }

    // ==========================================
    // 3. RENDERIZAÇÃO
    // ==========================================

    function processData(events) {
        // Stats
        const invitesCount = events.filter(e => e.FK_Usuario !== currentUserEmail).length;
        const activeCount = events.length; 

        if(statInvites) statInvites.innerText = invitesCount;
        if(statActive) statActive.innerText = activeCount;

        renderList(events);
    }

    function renderList(events) {
        if (!eventsListContainer) return;
        eventsListContainer.innerHTML = "";

        if (events.length === 0) {
            eventsListContainer.innerHTML = `
                <div class="empty-state" style="text-align:center; padding:30px; color:#888;">
                    <i class="fa-regular fa-calendar-xmark" style="font-size:2rem; margin-bottom:10px;"></i>
                    <p>Nenhum evento encontrado.</p>
                    <button class="btn-small" onclick="openCreateModal()" style="margin-top:10px; padding:8px 20px; background:transparent; border:1px solid white; color:white; border-radius:20px; cursor:pointer;">Criar Novo</button>
                </div>
            `;
            return;
        }

        events.forEach(evt => {
            const isOwner = evt.FK_Usuario === currentUserEmail;
            const isDonation = evt.Meta_Arrecadacao && parseFloat(evt.Meta_Arrecadacao) > 0;
            
            const typeClass = isDonation ? 'donate' : 'invite';
            const badgeText = isDonation ? 'CAMPANHA' : 'CONVITE';
            const iconAction = isDonation ? 'fa-coins' : 'fa-eye';
            const actionClass = isDonation ? 'highlight' : '';

            const ownerBadge = isOwner ? '<i class="fa-solid fa-crown" style="color:#FFD700; margin-left:5px;" title="Organizador"></i>' : '';

            let progressBarHTML = '';
            if (isDonation) {
                const meta = parseFloat(evt.Meta_Arrecadacao);
                const atual = parseFloat(evt.Valor_Arrecadado || 0);
                const percent = Math.min((atual / meta) * 100, 100);
                
                progressBarHTML = `
                    <div class="progress-container">
                        <div class="progress-track">
                            <div class="progress-fill" style="width: ${percent}%;"></div>
                        </div>
                        <div class="progress-meta">
                            <span>R$ ${atual}</span>
                            <span>${Math.round(percent)}%</span>
                        </div>
                    </div>
                `;
            }

            let confirmedIcon = '';
            if (!isDonation && evt.Confirmado_Presenca === true) {
                confirmedIcon = '<i class="fa-solid fa-check-circle" style="color: #4CAF50; margin-left: 5px;" title="Presença Confirmada"></i>';
            }

            const itemHTML = `
                <li class="event-item" onclick="window.openEventModal(${evt.ID_Evento})">
                    <div class="date-box ${typeClass}">
                        <span class="date-day">${evt.Data.split('/')[0]}</span>
                        <span class="date-month">${monthName(evt.Data)}</span>
                    </div>
                    <div class="event-content">
                        <div class="event-header">
                            <span class="event-badge badge-${typeClass}">${badgeText}</span>
                            <span class="event-time"><i class="fa-regular fa-clock"></i> ${evt.Hora}</span>
                        </div>
                        <h4 class="event-title">${evt.Titulo} ${ownerBadge} ${confirmedIcon}</h4>
                        <div class="event-location"><i class="fa-solid fa-location-dot"></i> ${evt.Local}</div>
                        ${progressBarHTML}
                    </div>
                    <div class="event-action">
                        <button class="btn-icon-action ${actionClass}">
                            <i class="fa-solid ${iconAction}"></i>
                        </button>
                    </div>
                </li>
            `;
            eventsListContainer.innerHTML += itemHTML;
        });
    }

    // ==========================================
    // 4. MODAL DETALHES
    // ==========================================

    window.openEventModal = function(id) {
        const allEvents = getLocalEvents() || [];
        const evt = allEvents.find(e => e.ID_Evento === id);
        if(!evt) return;

        const isOwner = evt.FK_Usuario === currentUserEmail;
        const isDonation = evt.Meta_Arrecadacao && parseFloat(evt.Meta_Arrecadacao) > 0;

        const headerColor = document.getElementById('modalHeaderColor');
        const icon = document.getElementById('modalIcon');
        const badge = document.getElementById('modalBadge');
        const donationArea = document.getElementById('modalDonationArea');
        const actionBtn = document.getElementById('modalActionBtn');
        const descElement = document.querySelector('.modal-description');

        document.getElementById('modalTitle').innerText = evt.Titulo;
        document.getElementById('modalDate').innerText = evt.Data;
        document.getElementById('modalTime').innerText = evt.Hora;
        document.getElementById('modalLocation').innerText = evt.Local;
        
        let descText = evt.Descricao || "Sem descrição.";
        if(isOwner && evt.Lista_Convidados && evt.Lista_Convidados.length > 0) {
            descText += `\n\n👥 Convidados: ${evt.Lista_Convidados.join(', ')}`;
        }
        descElement.innerText = descText;

        actionBtn.className = "btn-modal-action"; 
        actionBtn.disabled = false;
        actionBtn.onclick = null;

        if (isOwner) {
            actionBtn.innerText = "Gerenciar Evento";
            // MANDA PARA A PAGINA DE GERENCIAMENTO COM O ID NA URL
            actionBtn.onclick = () => {
                window.location.href = `gerenciamento-eventos.html?editId=${evt.ID_Evento}`;
            };
        } else if (!isDonation) {
            headerColor.classList.remove('gold-theme');
            icon.className = "fa-solid fa-envelope-open-text";
            badge.innerText = "CONVITE";
            badge.style.color = "#fff";
            donationArea.classList.add('hidden');

            if (evt.Confirmado_Presenca === true) {
                actionBtn.innerHTML = '<i class="fa-solid fa-check"></i> Presença Confirmada';
                actionBtn.classList.add('confirmed');
            } else {
                actionBtn.innerText = "Confirmar Presença";
                actionBtn.onclick = function() { confirmAttendance(evt.ID_Evento); };
            }
        } else {
            headerColor.classList.add('gold-theme');
            icon.className = "fa-solid fa-hand-holding-dollar";
            badge.innerText = "CAMPANHA";
            badge.style.color = "#FFD700";
            donationArea.classList.remove('hidden');

            document.getElementById('modalArrecadado').innerText = `R$ ${evt.Valor_Arrecadado || 0}`;
            document.getElementById('modalMeta').innerText = `R$ ${evt.Meta_Arrecadacao}`;
            
            const meta = parseFloat(evt.Meta_Arrecadacao);
            const atual = parseFloat(evt.Valor_Arrecadado || 0);
            const percent = Math.min((atual / meta) * 100, 100);
            document.getElementById('modalProgressBar').style.width = `${percent}%`;

            actionBtn.innerText = "Contribuir Agora";
            actionBtn.classList.add('btn-donate');
            actionBtn.onclick = function() { alert(`PIX para: ${evt.Titulo}`); };
        }

        detailModal.classList.add('active');
    };

    function confirmAttendance(id) {
        const btn = document.getElementById('modalActionBtn');
        btn.innerText = "Salvando...";

        setTimeout(() => {
            let allEvents = getLocalEvents();
            const idx = allEvents.findIndex(e => e.ID_Evento === id);
            if (idx !== -1) {
                allEvents[idx].Confirmado_Presenca = true;
                saveLocalEvents(allEvents);
                
                btn.innerHTML = '<i class="fa-solid fa-check"></i> Presença Confirmada';
                btn.classList.add('confirmed');
                btn.onclick = null;
                
                loadDashboard(); // Atualiza lista atrás
            }
        }, 500);
    }

    // ==========================================
    // 5. CRIAÇÃO DE FESTA
    // ==========================================

    window.openCreateModal = function() {
        createForm.reset(); 
        document.getElementById('metaFieldGroup').classList.add('hidden');
        createModal.classList.add('active');
    };

    window.closeCreateModal = function() {
        createModal.classList.remove('active');
    };

    window.toggleMetaField = function() {
        const type = document.getElementById('newType').value;
        const metaGroup = document.getElementById('metaFieldGroup');
        if(type === 'doacao') metaGroup.classList.remove('hidden');
        else metaGroup.classList.add('hidden');
    };

    createForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const title = document.getElementById('newTitle').value;
        const type = document.getElementById('newType').value;
        const date = document.getElementById('newDate').value;
        const time = document.getElementById('newTime').value;
        const loc = document.getElementById('newLocation').value;
        const desc = document.getElementById('newDescription').value;
        const metaVal = document.getElementById('newMeta').value;
        const guestsInput = document.getElementById('newGuests').value;

        let guestList = [];
        if(guestsInput) {
            guestList = guestsInput.split(',').map(email => email.trim()).filter(e => e !== "");
        }

        const newEvent = {
            ID_Evento: Date.now(),
            FK_Usuario: currentUserEmail,
            Titulo: title,
            Descricao: desc,
            Local: loc,
            Data: date,
            Hora: time,
            Meta_Arrecadacao: type === 'doacao' ? (parseFloat(metaVal) || 0) : null,
            Valor_Arrecadado: type === 'doacao' ? 0 : null,
            Lista_Convidados: guestList,
            Confirmado_Presenca: true, // Dono já confirma
            Data_Criacao: new Date().toISOString()
        };

        let allEvents = getLocalEvents() || [];
        allEvents.push(newEvent);
        saveLocalEvents(allEvents);
        
        window.closeCreateModal();
        loadDashboard();
        alert("Evento criado com sucesso!");
    });

    // ==========================================
    // 6. UTILITÁRIOS
    // ==========================================

    const closeModalBtns = document.querySelectorAll('.close-modal-btn');
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            detailModal.classList.remove('active');
            createModal.classList.remove('active');
        });
    });

    window.addEventListener('click', (e) => {
        if (e.target === detailModal) detailModal.classList.remove('active');
        if (e.target === createModal) createModal.classList.remove('active');
    });

    function monthName(dateStr) {
        const monthMap = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];
        const parts = dateStr.split('/');
        return parts.length > 1 ? monthMap[parseInt(parts[1]) - 1] : "";
    }
});