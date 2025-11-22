document.addEventListener("DOMContentLoaded", function() {
    
    // ==========================================
    // 1. CONFIGURAÇÕES E SELETORES
    // ==========================================
    
    const DB_KEY = 'eventsDB'; // Simula a Tabela 'Evento'
    const currentUserEmail = sessionStorage.getItem("currentUserEmail"); // Simula o ID do Usuário Logado
    const currentUserName = sessionStorage.getItem("currentUserName");

    // Telas
    const heroDefault = document.getElementById('heroDefault');
    const heroLogged = document.getElementById('heroLogged');

    // Elementos DOM
    const eventsListContainer = document.getElementById('eventsList');
    const statInvites = document.getElementById('statInvites');
    const statActive = document.getElementById('statActive');
    const welcomeTitle = document.getElementById('welcomeTitle');

    // Modals
    const detailModal = document.getElementById('eventModal');
    const createModal = document.getElementById('createEventModal');
    const createForm = document.getElementById('createEventForm');

    // Config API
    const USE_API = false; 

    // ==========================================
    // 2. INICIALIZAÇÃO E SEGURANÇA
    // ==========================================

    if (!currentUserEmail) {
        if(heroDefault) heroDefault.classList.remove('hidden');
        if(heroLogged) heroLogged.classList.add('hidden');
        return; 
    }

    if(heroDefault) heroDefault.classList.add('hidden');
    if(heroLogged) heroLogged.classList.remove('hidden');

    if(welcomeTitle && currentUserName) {
        const firstName = currentUserName.split(' ')[0];
        welcomeTitle.innerHTML = `Olá, <span style="color:#FFD700">${firstName}</span>!`;
    }

    loadDashboard();

    // ==========================================
    // 3. GERENCIAMENTO DE DADOS (SEGUINDO O DER)
    // ==========================================

    function getLocalEvents() {
        const data = localStorage.getItem(DB_KEY);
        return data ? JSON.parse(data) : null;
    }

    function saveLocalEvents(events) {
        localStorage.setItem(DB_KEY, JSON.stringify(events));
    }

    function loadDashboard() {
        if(eventsListContainer) {
            eventsListContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-circle-notch fa-spin"></i>
                    <p>Sincronizando com o Banco de Dados...</p>
                </div>
            `;
        }

        if (USE_API) {
            // fetch...
        } else {
            setTimeout(() => {
                let allEvents = getLocalEvents();

                if (!allEvents) {
                    allEvents = generateInitialMockData();
                    saveLocalEvents(allEvents);
                }

                // FILTRO SQL SIMULADO: SELECT * FROM Evento WHERE FK_Usuario = '...' OR convidado...
                const myEvents = allEvents.filter(evt => {
                    // Verifica se é o dono (FK_Usuario)
                    const isHost = evt.FK_Usuario === currentUserEmail;
                    
                    // Verifica se está na lista de convidados (Simulação da Tabela Convidado)
                    const isGuest = evt.Lista_Convidados && evt.Lista_Convidados.some(g => g.trim() === currentUserEmail);
                    
                    return isHost || isGuest;
                });

                // Ordena por Data (Decrescente)
                myEvents.sort((a, b) => new Date(b.Data_Criacao) - new Date(a.Data_Criacao));

                processData(myEvents);
            }, 600);
        }
    }

    // DADOS SEGUINDO ESTRITAMENTE O DIAGRAMA DAS IMAGENS
    function generateInitialMockData() {
        return [
            {
                ID_Evento: 101,
                FK_Usuario: "admin@admin.com", 
                Titulo: "Festa de Inauguração",
                Descricao: "Venha celebrar o lançamento da nossa plataforma!",
                Local: "Sede Birthday Fund",
                Data: "20/12",
                Hora: "20:00",
                Tipo: "convite", // Campo lógico para o frontend (não obrigatório no banco, mas útil)
                Meta_Arrecadacao: null,
                Valor_Arrecadado: null,
                Lista_Convidados: [currentUserEmail], // Simula tabela N:N Convidado
                Confirmado_Presenca: false, // Simula status na tabela Convidado
                Data_Criacao: new Date().toISOString()
            },
            {
                ID_Evento: 102,
                FK_Usuario: currentUserEmail, 
                Titulo: "Meu Aniversário",
                Descricao: "Contribua com o que puder para a festa!",
                Local: "Minha Casa",
                Data: "15/01",
                Hora: "19:00",
                Tipo: "doacao",
                Meta_Arrecadacao: 1000.00,
                Valor_Arrecadado: 250.00,
                Lista_Convidados: [],
                Confirmado_Presenca: true, 
                Data_Criacao: new Date().toISOString()
            }
        ];
    }

    // ==========================================
    // 4. RENDERIZAÇÃO (UI)
    // ==========================================

    function processData(events) {
        // Filtros visuais
        const invitesCount = events.filter(e => e.FK_Usuario !== currentUserEmail).length; // Se não sou dono, é convite
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
                <div class="empty-state">
                    <i class="fa-regular fa-calendar-xmark"></i>
                    <p>Nenhum evento encontrado.</p>
                    <button class="btn-small" onclick="openCreateModal()">Criar Novo</button>
                </div>
            `;
            return;
        }

        events.forEach(evt => {
            // Lógica de UI baseada nos dados do Diagrama
            const isOwner = evt.FK_Usuario === currentUserEmail;
            
            // Define se é Doação ou Convite baseado na Meta_Arrecadacao (conforme diagrama)
            // Se tem Meta > 0, é arrecadação. Se nulo ou 0, é festa comum.
            const isDonation = evt.Meta_Arrecadacao && parseFloat(evt.Meta_Arrecadacao) > 0;
            
            const typeClass = isDonation ? 'donate' : 'invite';
            const badgeText = isDonation ? 'CAMPANHA' : 'CONVITE';
            const iconAction = isDonation ? 'fa-coins' : 'fa-eye';
            const actionClass = isDonation ? 'highlight' : '';

            const ownerBadge = isOwner ? '<i class="fa-solid fa-crown" style="color:#FFD700; margin-left:5px;" title="Organizador"></i>' : '';

            // Barra de Progresso (Usando Meta_Arrecadacao e Valor_Arrecadado)
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

            // Ícone de Check
            let confirmedIcon = '';
            if (!isDonation && evt.Confirmado_Presenca) {
                confirmedIcon = '<i class="fa-solid fa-check-circle" style="color: #4CAF50; margin-left: 5px;" title="Presença Confirmada"></i>';
            }

            // Mapeamento de Campos: evt.Titulo, evt.Data, etc.
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
    // 5. DETALHES (USANDO NOMES DO DIAGRAMA)
    // ==========================================

    window.openEventModal = function(id) {
        const allEvents = getLocalEvents() || [];
        const evt = allEvents.find(e => e.ID_Evento === id);
        if(!evt) return;

        const isOwner = evt.FK_Usuario === currentUserEmail;
        const isDonation = evt.Meta_Arrecadacao && parseFloat(evt.Meta_Arrecadacao) > 0;

        // Elementos
        const headerColor = document.getElementById('modalHeaderColor');
        const icon = document.getElementById('modalIcon');
        const badge = document.getElementById('modalBadge');
        const donationArea = document.getElementById('modalDonationArea');
        const actionBtn = document.getElementById('modalActionBtn');
        const descElement = document.querySelector('.modal-description');

        // Preenchimento (Mapeamento Correto)
        document.getElementById('modalTitle').innerText = evt.Titulo;
        document.getElementById('modalDate').innerText = evt.Data;
        document.getElementById('modalTime').innerText = evt.Hora;
        document.getElementById('modalLocation').innerText = evt.Local;
        
        let descText = evt.Descricao || "Sem descrição.";
        if(isOwner && evt.Lista_Convidados && evt.Lista_Convidados.length > 0) {
            descText += `\n\n👥 Convidados: ${evt.Lista_Convidados.join(', ')}`;
        }
        descElement.innerText = descText;

        // Reset
        actionBtn.className = "btn-modal-action"; 
        actionBtn.disabled = false;
        actionBtn.onclick = null;

        if (isOwner) {
            actionBtn.innerText = "Gerenciar Evento";
            actionBtn.onclick = () => alert("Painel de gestão (Futuro)");
        } else if (!isDonation) {
            // CONVITE
            headerColor.classList.remove('gold-theme');
            icon.className = "fa-solid fa-envelope-open-text";
            badge.innerText = "CONVITE";
            badge.style.color = "#fff";
            donationArea.classList.add('hidden');

            if (evt.Confirmado_Presenca) {
                actionBtn.innerHTML = '<i class="fa-solid fa-check"></i> Presença Confirmada';
                actionBtn.classList.add('confirmed');
            } else {
                actionBtn.innerText = "Confirmar Presença";
                actionBtn.onclick = function() { confirmAttendance(evt.ID_Evento); };
            }
        } else {
            // DOAÇÃO
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
                // Atualiza propriedade seguindo lógica do mock
                allEvents[idx].Confirmado_Presenca = true;
                saveLocalEvents(allEvents);
                
                btn.innerHTML = '<i class="fa-solid fa-check"></i> Presença Confirmada';
                btn.classList.add('confirmed');
                btn.onclick = null;
                
                loadDashboard();
            }
        }, 500);
    }

    // ==========================================
    // 6. CRIAÇÃO (MAPEAR FORM PARA SCHEMA DO BANCO)
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

        // Inputs
        const title = document.getElementById('newTitle').value;
        const type = document.getElementById('newType').value; // logico frontend
        const date = document.getElementById('newDate').value;
        const time = document.getElementById('newTime').value;
        const loc = document.getElementById('newLocation').value;
        const desc = document.getElementById('newDescription').value;
        const metaVal = document.getElementById('newMeta').value;
        const guestsInput = document.getElementById('newGuests').value;

        let guestList = [];
        if(guestsInput) {
            guestList = guestsInput.split(',').map(email => email.trim());
        }

        // OBJETO NO FORMATO DO DIAGRAMA
        const newEvent = {
            ID_Evento: Date.now(), // Mock de ID Auto-Increment
            FK_Usuario: currentUserEmail, // Chave Estrangeira
            Titulo: title,
            Descricao: desc,
            Local: loc,
            Data: date,
            Hora: time,
            Meta_Arrecadacao: type === 'doacao' ? (parseFloat(metaVal) || 0) : null,
            Valor_Arrecadado: type === 'doacao' ? 0 : null,
            // Campos lógicos para simulação local (Convidados/Presença)
            Lista_Convidados: guestList,
            Confirmado_Presenca: true,
            Data_Criacao: new Date().toISOString()
        };

        // Salvar
        let allEvents = getLocalEvents() || [];
        allEvents.push(newEvent);
        saveLocalEvents(allEvents);
        
        window.closeCreateModal();
        loadDashboard();
        alert("Evento criado com sucesso!");
    });

    // Listeners
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