document.addEventListener("DOMContentLoaded", function() {
    
    const DB_KEY = 'eventsDB';
    const currentUserEmail = sessionStorage.getItem("currentUserEmail"); 
    const currentUserName = sessionStorage.getItem("currentUserName");

    const heroDefault = document.getElementById('heroDefault');
    const heroLogged = document.getElementById('heroLogged');
    const eventsListContainer = document.getElementById('eventsList');
    const statInvites = document.getElementById('statInvites');
    const statActive = document.getElementById('statActive');
    const welcomeTitle = document.getElementById('welcomeTitle');
    const createModal = document.getElementById('createEventModal');
    const createForm = document.getElementById('createEventForm');
    const detailModal = document.getElementById('eventModal');

    // LOGIN CHECK
    if (!currentUserEmail) {
        if(heroDefault) heroDefault.classList.remove('hidden');
        if(heroLogged) heroLogged.classList.add('hidden');
        return; 
    }

    if(heroDefault) heroDefault.classList.add('hidden');
    if(heroLogged) heroLogged.classList.remove('hidden');

    const navRight = document.querySelector('.nav-right');
    if (navRight && currentUserName) {
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

    if(welcomeTitle && currentUserName) {
        const firstName = currentUserName.split(' ')[0];
        welcomeTitle.innerHTML = `Olá, <span style="color:#FFD700">${firstName}</span>!`;
    }

    loadDashboard();

    function getLocalEvents() {
        try { return JSON.parse(localStorage.getItem(DB_KEY)) || []; } 
        catch (e) { return []; }
    }

    function saveLocalEvents(events) {
        localStorage.setItem(DB_KEY, JSON.stringify(events));
    }

    function loadDashboard() {
        if(eventsListContainer) {
            eventsListContainer.innerHTML = '<div style="padding:40px; text-align:center; color:#ccc;"><i class="fas fa-circle-notch fa-spin"></i></div>';
        }

        setTimeout(() => {
            let allEvents = getLocalEvents();

            if (!allEvents || allEvents.length === 0) {
                allEvents = [{
                    ID_Evento: 101,
                    FK_Usuario: "admin@admin.com", 
                    Titulo: "Evento Exemplo",
                    Local: "App",
                    Data: "20/12", Hora: "20:00",
                    Lista_Convidados: [currentUserEmail], 
                    Confirmado_Presenca: false, 
                    Data_Criacao: new Date().toISOString()
                }];
                saveLocalEvents(allEvents);
            }

            const myEvents = allEvents.filter(evt => {
                const isHost = evt.FK_Usuario === currentUserEmail;
                const isGuest = Array.isArray(evt.Lista_Convidados) && 
                                evt.Lista_Convidados.some(g => g.trim() === currentUserEmail);
                return isHost || isGuest;
            });

            myEvents.sort((a, b) => new Date(b.Data_Criacao) - new Date(a.Data_Criacao));
            processData(myEvents);
        }, 500);
    }

    function processData(events) {
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

            const ownerBadge = isOwner ? '<i class="fa-solid fa-crown" style="color:#FFD700; margin-left:5px;" title="Você organiza"></i>' : '';

            let progressBarHTML = '';
            if (isDonation) {
                const meta = parseFloat(evt.Meta_Arrecadacao);
                const atual = parseFloat(evt.Valor_Arrecadado || 0);
                const percent = Math.min((atual / meta) * 100, 100);
                progressBarHTML = `<div class="progress-container"><div class="progress-track"><div class="progress-fill" style="width: ${percent}%;"></div></div></div>`;
            }

            let confirmedIcon = '';
            if (!isDonation && !isOwner && evt.Confirmado_Presenca) {
                confirmedIcon = '<i class="fa-solid fa-check-circle" style="color: #4CAF50; margin-left: 8px;" title="Confirmado"></i>';
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
                            <span class="event-time">${evt.Hora}</span>
                        </div>
                        <h4 class="event-title">${evt.Titulo} ${ownerBadge} ${confirmedIcon}</h4>
                        <div class="event-location">${evt.Local}</div>
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

    window.openEventModal = function(id) {
        const allEvents = getLocalEvents();
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
            actionBtn.onclick = () => {
                window.location.href = `gerenciamento-eventos.html?editId=${evt.ID_Evento}`;
            };
        } else if (!isDonation) {
            headerColor.classList.remove('gold-theme');
            icon.className = "fa-solid fa-envelope-open-text";
            badge.innerText = "CONVITE";
            badge.style.color = "#fff";
            donationArea.classList.add('hidden');

            if (evt.Confirmado_Presenca) {
                actionBtn.innerHTML = '<i class="fa-solid fa-check"></i> Presença Confirmada';
                actionBtn.classList.add('confirmed');
                actionBtn.style.background = "#4CAF50";
            } else {
                actionBtn.innerText = "Confirmar Presença";
                actionBtn.style.background = "#5b2be0";
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
            // AQUI: Removido o prompt, doação automática
            actionBtn.onclick = function() { 
                donateToEvent(id, 50.00); 
            };
        }

        if(detailModal) detailModal.classList.add('active');
    };

    function donateToEvent(id, amount) {
        let allEvents = getLocalEvents();
        const idx = allEvents.findIndex(e => e.ID_Evento === id);
        if (idx !== -1) {
            const atual = parseFloat(allEvents[idx].Valor_Arrecadado || 0);
            allEvents[idx].Valor_Arrecadado = atual + amount;
            saveLocalEvents(allEvents);
            
            // Atualiza Modal
            document.getElementById('modalArrecadado').innerText = `R$ ${allEvents[idx].Valor_Arrecadado}`;
            const meta = parseFloat(allEvents[idx].Meta_Arrecadacao);
            const percent = Math.min((allEvents[idx].Valor_Arrecadado / meta) * 100, 100);
            document.getElementById('modalProgressBar').style.width = `${percent}%`;

            alert(`Chave PIX gerada!\n(Simulação: Doação de R$ ${amount} computada)`);
            loadDashboard(); // Atualiza lista atrás
        }
    }

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
                btn.style.background = "#4CAF50";
                btn.onclick = null;
                
                loadDashboard(); 
            }
        }, 500);
    }

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
            Confirmado_Presenca: true, 
            Data_Criacao: new Date().toISOString()
        };

        let allEvents = getLocalEvents();
        allEvents.push(newEvent);
        saveLocalEvents(allEvents);
        
        window.closeCreateModal();
        loadDashboard();
        alert("Evento criado com sucesso!");
    });

    document.querySelectorAll('.close-modal-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if(detailModal) detailModal.classList.remove('active');
            if(createModal) createModal.classList.remove('active');
        });
    });

    window.addEventListener('click', (e) => {
        if (e.target === detailModal) detailModal.classList.remove('active');
        if (e.target === createModal) createModal.classList.remove('active');
    });

    function monthName(dateStr) {
        if(!dateStr) return "";
        const monthMap = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];
        const parts = dateStr.split('/');
        return parts.length > 1 ? monthMap[parseInt(parts[1]) - 1] : "";
    }
});