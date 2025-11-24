document.addEventListener("DOMContentLoaded", function() {
    
    // --- CONFIGURAÇÕES ---
    const DB_KEY = 'eventsDB';
    const USERS_KEY = 'usersDB'; // Banco de usuários para buscar o PIX
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
    
    // Modal de Edição/Detalhes
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

    // VARIÁVEIS DO MODAL PIX
    const pixModal = document.getElementById('pixModal');
    const pixTimerDisplay = document.getElementById('pixTimer');
    const pixOkBtn = document.getElementById('pixOkBtn');
    const closePixModalBtn = document.getElementById('closePixModalBtn');
    const pixCodeInput = document.getElementById('pixCode'); // Input Copia e Cola
    const pixQrImage = document.getElementById('pixQrImage')
    let pixCountdown; 
    let currentPixEventId = null;

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

        // DELEGAÇÃO DE EVENTOS
        grid.addEventListener('click', function(e) {
            const btn = e.target.closest('.js-open-modal');
            
            if (btn) {
                const id = btn.getAttribute('data-id');
                if (id) {
                    openEventModal(parseInt(id));
                }
            }
        });

        // Verifica URL para parâmetros
        const urlParams = new URLSearchParams(window.location.search);
        const openId = urlParams.get('editId');
        
        // --- NOVOS PARÂMETROS PARA PIX ---
        const openPix = urlParams.get('openPix');
        const eventId = urlParams.get('eventId');

        loadAndRender();

        if(openId) {
            openEventModal(parseInt(openId));
            window.history.replaceState({}, document.title, "gerenciamento-eventos.html");
        }

        // --- LÓGICA DE ABERTURA AUTOMÁTICA DO PIX ---
        if(openPix === 'true' && eventId) {
            const id = parseInt(eventId);
            
            // 1. Muda para aba de doações
            switchTab('donations');

            // 2. Define o ID e inicia o fluxo
            currentPixEventId = id;
            if(btnContribute) btnContribute.dataset.eventId = id;

            // 3. Atualiza dados do Pix (Chave real) e abre modal
            updatePixDataFromOwner(id);
            
            if(pixModal) {
                pixModal.classList.remove('hidden');
                pixModal.classList.add('active'); 
                startPixTimer();
            }

            // 4. Limpa a URL
            window.history.replaceState({}, document.title, "gerenciamento-eventos.html");
        }
    }

    // ==========================================
    // INTEGRAÇÃO PIX: BUSCAR DADOS REAIS
    // ==========================================
    function updatePixDataFromOwner(eventId) {
        const allEvents = getEvents();
        const evt = allEvents.find(e => e.ID_Evento === eventId);
        
        let chavePixExibida = "CHAVE-PADRAO-DO-SISTEMA"; // Fallback
        
        if (evt) {
            // Busca o usuário dono do evento
            const users = JSON.parse(localStorage.getItem(USERS_KEY)) || [];
            const owner = users.find(u => u.Email === evt.FK_Usuario);

            // Se o dono tiver configurado a chave no perfil
            if (owner && owner.Dados_Bancarios && owner.Dados_Bancarios.Chave) {
                chavePixExibida = owner.Dados_Bancarios.Chave;
            }
        }

        // Atualiza o input "Copia e Cola"
        if (pixCodeInput) {
            pixCodeInput.value = chavePixExibida;
        }

        // Atualiza o QR Code visualmente (usando API de QR Code)
        if (pixQrImage) {
            // Gera um QR Code real com o texto da chave
            pixQrImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(chavePixExibida)}`;
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
    // RENDERIZAÇÃO
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
    // LÓGICA DO MODAL PIX (COMUM)
    // ==========================================
    window.closePixModal = function() {
        if(pixCountdown) clearInterval(pixCountdown);
        if(pixModal) {
            pixModal.classList.add('hidden');
            pixModal.classList.remove('active'); 
        }
        if(pixTimerDisplay) pixTimerDisplay.innerText = "10:00"; 
    };

    window.copyPixCode = function() {
        const pixCodeInput = document.getElementById('pixCode');
        if (pixCodeInput) {
            pixCodeInput.select();
            navigator.clipboard.writeText(pixCodeInput.value)
                .then(() => alert('Código PIX Copiado!'))
                .catch(() => alert('Erro ao copiar. Tente manualmente.'));
        }
    };

    function startPixTimer() {
        let timeLeft = 600; // 10 minutos em segundos
        if(pixCountdown) clearInterval(pixCountdown);

        pixCountdown = setInterval(() => {
            timeLeft--;
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            if(pixTimerDisplay) pixTimerDisplay.innerText = timeStr;

            if (timeLeft <= 0) {
                clearInterval(pixCountdown);
                alert("Tempo esgotado para o pagamento Pix. Tente novamente.");
                window.closePixModal();
            }
        }, 1000);
    }
    
    function processDonationSimulated(id) {
        let allEvents = getEvents();
        const idx = allEvents.findIndex(e => e.ID_Evento === id);

        if (idx !== -1) {
            const amount = 50.00; // Valor fixo de doação simulado
            const atual = parseFloat(allEvents[idx].Valor_Arrecadado || 0);
            allEvents[idx].Valor_Arrecadado = atual + amount;
            saveEvents(allEvents);
            
            // 1. Fecha o modal do Pix
            window.closePixModal();

            // 2. Abre o Modal de Sucesso
            const successModal = document.getElementById('successModal');
            if(successModal) {
                successModal.classList.remove('hidden');
            } else {
                // Fallback se não tiver o modal de sucesso no HTML ainda
                alert(`Pagamento PIX Simulado efetuado. Doação de R$ ${amount} computada!`);
            }
            
            loadAndRender(); 
        }
    }

    if (pixOkBtn) {
        pixOkBtn.addEventListener('click', () => {
            // Se veio da URL (currentPixEventId) ou do dataset do botão (btnContribute)
            let id = currentPixEventId;
            if (!id && btnContribute && btnContribute.dataset.eventId) {
                id = parseInt(btnContribute.dataset.eventId);
            }

            if(id) processDonationSimulated(id);
        });
    }

    if(closePixModalBtn) {
        closePixModalBtn.addEventListener('click', window.closePixModal);
    }

    // Fechar modal de sucesso
    const btnCloseSuccess = document.getElementById('btnCloseSuccess');
    const successModal = document.getElementById('successModal');
    if(btnCloseSuccess && successModal) {
        btnCloseSuccess.addEventListener('click', () => {
            successModal.classList.add('hidden');
        });
    }

    // ==========================================
    // MODAL DE DETALHES
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
            modalTitleText.innerText = "Gerenciar Evento";
            const inputs = editForm.querySelectorAll('input:not([type=hidden]), textarea');
            inputs.forEach(i => i.disabled = false);
            
            hostControls.classList.remove('hidden');
            ownerActions.classList.remove('hidden');
            
            tempGuestList = Array.isArray(evt.Lista_Convidados) ? [...evt.Lista_Convidados] : [];
            renderGuestList();

        } else if (isDonation) {
            modalTitleText.innerText = "Campanha Solidária";
            const inputs = editForm.querySelectorAll('input:not([type=hidden]), textarea');
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

            if(btnContribute) {
                btnContribute.dataset.eventId = id;
                btnContribute.onclick = () => {
                    // Chama a função de atualizar dados e abre o modal
                    updatePixDataFromOwner(id);
                    currentPixEventId = id;
                    
                    if(editModal) editModal.classList.add('hidden');
                    if(pixModal) {
                        pixModal.classList.remove('hidden');
                        pixModal.classList.add('active');
                        startPixTimer();
                    }
                };
            }

        } else {
            // CONVITE (Mantido)
            modalTitleText.innerText = "Convite de Festa";
            const inputs = editForm.querySelectorAll('input:not([type=hidden]), textarea');
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

    window.closeEditModal = function() {
        editModal.classList.add('hidden');
    };

    // ==========================================
    // AÇÕES EXTRAS (RSVP, DONO)
    // ==========================================
    function rsvpEvent(id, status) {
        // ... (Lógica de RSVP mantida igual) ...
        let allEvents = getEvents();
        const idx = allEvents.findIndex(e => e.ID_Evento === id);
        if(idx !== -1) {
            if(status) { allEvents[idx].Confirmado_Presenca = true; alert("Presença confirmada!"); }
            else { if(confirm("Recusar?")) allEvents[idx].Lista_Convidados = allEvents[idx].Lista_Convidados.filter(e=>e!==currentUserEmail); else return; }
            saveEvents(allEvents); closeEditModal(); loadAndRender();
        }
    }

    if(btnAddGuest) {
        btnAddGuest.addEventListener('click', () => {
            const email = newGuestInput.value.trim();
            if (email && email.includes('@')) {
                if (!tempGuestList.includes(email)) {
                    tempGuestList.push(email); renderGuestList(); newGuestInput.value = '';
                } else alert('Já adicionado.');
            } else alert('E-mail inválido.');
        });
    }

    function renderGuestList() {
        guestListDisplay.innerHTML = '';
        tempGuestList.forEach((email, index) => {
            const li = document.createElement('li');
            li.innerHTML = `<span>${email}</span><i class="fa-solid fa-trash remove-guest-icon" data-index="${index}"></i>`;
            guestListDisplay.appendChild(li);
        });
        document.querySelectorAll('.remove-guest-icon').forEach(icon => {
            icon.addEventListener('click', function() {
                const idx = this.getAttribute('data-index');
                tempGuestList.splice(idx, 1); renderGuestList();
            });
        });
    }

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
            saveEvents(allEvents); closeEditModal(); loadAndRender(); alert('Evento atualizado!');
        }
    });

    if(btnDelete) {
        btnDelete.addEventListener('click', () => {
            if(confirm("Excluir evento?")) {
                const id = parseInt(inputId.value);
                let allEvents = getEvents();
                allEvents = allEvents.filter(e => e.ID_Evento !== id);
                saveEvents(allEvents); closeEditModal(); loadAndRender();
            }
        });
    }

    if(closeBtn) closeBtn.addEventListener('click', closeEditModal);
    
    window.addEventListener('click', (e) => { 
        if (e.target === editModal) closeEditModal(); 
        if (e.target === pixModal) window.closePixModal();
        if (e.target === successModal) successModal.classList.add('hidden');
    });

    function monthName(dateStr) {
        if(!dateStr) return "";
        const monthMap = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];
        const parts = dateStr.split('/');
        return parts.length > 1 ? monthMap[parseInt(parts[1]) - 1] : "";
    }
});