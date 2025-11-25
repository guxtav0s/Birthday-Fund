document.addEventListener("DOMContentLoaded", function() {
    
    const API_BASE_URL = "http://localhost:3000";
    const token = localStorage.getItem("token");
    let user = null;
    try { user = JSON.parse(localStorage.getItem("user")); } catch (e) {}

    if (!token || !user) { window.location.href = "autenticacao.html"; return; }

    const userId = user.ID_Usuario || user.id || user.userId;
    const userEmail = user.Email_Usuario || user.email;
    const grid = document.getElementById('events-grid');
    
    // Abas
    const btnHosted = document.getElementById('btnHosted');
    const btnInvited = document.getElementById('btnInvited');
    const btnDonations = document.getElementById('btnDonations');
    const allTabs = [btnHosted, btnInvited, btnDonations];

    // Modais
    const editModal = document.getElementById('editEventModal');
    const guestModal = document.getElementById('guestModal'); 
    const pixModal = document.getElementById('pixModal'); 
    const successModal = document.getElementById('successModal');
    
    // Inputs
    const inputEditId = document.getElementById('editEventId');
    const inputEditTitle = document.getElementById('editTitle');
    const inputEditDate = document.getElementById('editDate');
    const inputEditTime = document.getElementById('editTime');
    const inputEditLocation = document.getElementById('editLocation');

    // ======================================================
    // 1. INICIALIZAÇÃO INTELIGENTE (LER URL)
    // ======================================================
    
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    const openPixKey = params.get('openPix');
    const editId = params.get('id');

    if (tabParam === 'donations') {
        // Se veio do dashboard para doar
        if(btnDonations) {
            setActiveTab(btnDonations);
            fetchDonations().then(() => {
                // Se tiver chave pix na URL, abre o modal imediatamente
                if (openPixKey) {
                    window.openPixModal(decodeURIComponent(openPixKey));
                }
            });
        }
    } else {
        // Padrão: Abre Meus Eventos
        if(btnHosted) {
            setActiveTab(btnHosted);
            fetchMyEvents().then(() => {
                // Se tiver ID para editar
                if (editId) window.openEditModal(editId);
            });
        }
    }

    // Limpa a URL para não ficar reabrindo se der F5
    const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
    window.history.replaceState({path:cleanUrl}, '', cleanUrl);


    // Listeners de Abas
    if(btnHosted) btnHosted.addEventListener('click', () => { setActiveTab(btnHosted); fetchMyEvents(); });
    if(btnInvited) btnInvited.addEventListener('click', () => { setActiveTab(btnInvited); fetchInvitedEvents(); });
    if(btnDonations) btnDonations.addEventListener('click', () => { setActiveTab(btnDonations); fetchDonations(); });

    function setActiveTab(activeBtn) {
        allTabs.forEach(btn => { if(btn) btn.classList.remove('active'); });
        if(activeBtn) activeBtn.classList.add('active');
        grid.innerHTML = '<div style="text-align:center; padding:40px; color:white;"><i class="fa-solid fa-spinner fa-spin fa-2x"></i><p>Carregando...</p></div>';
    }

    // --- FETCHS ---
    async function fetchMyEvents() {
        try {
            const res = await fetch(`${API_BASE_URL}/eventos/usuario/${userId}`, { headers: { "Authorization": `Bearer ${token}` } });
            if(res.ok) renderEvents(await res.json(), 'hosted');
            else showError("Erro ao carregar eventos.");
        } catch (error) { showError("Erro de conexão."); }
    }

    async function fetchInvitedEvents() {
        try {
            const res = await fetch(`${API_BASE_URL}/eventos/convites/${userEmail}`, { headers: { "Authorization": `Bearer ${token}` } });
            if(res.ok) renderEvents(await res.json(), 'invited');
            else showError("Erro ao buscar convites.");
        } catch (error) { showError("Erro de conexão."); }
    }

    async function fetchDonations() {
        try {
            const res = await fetch(`${API_BASE_URL}/campanha/ativas`, { headers: { "Authorization": `Bearer ${token}` } });
            if(res.ok) renderDonations(await res.json());
            else showError("Erro ao buscar doações.");
        } catch (error) { showError("Erro de conexão."); }
    }

    function showError(msg) { grid.innerHTML = `<div class="empty-state"><p style="color:#ff6b6b">${msg}</p></div>`; }

    // --- RENDERIZAÇÃO ---
    function renderEvents(events, type) {
        grid.innerHTML = "";
        if (!events || events.length === 0) {
            grid.innerHTML = `<div class="empty-state"><i class="fa-regular fa-folder-open"></i><p>${type === 'hosted' ? "Você não tem eventos." : "Sem convites pendentes."}</p></div>`;
            return;
        }

        events.forEach(evt => {
            const card = document.createElement('div');
            card.className = 'event-card card-item'; 
            
            const dataObj = new Date(evt.Data_Evento);
            const dia = dataObj.toLocaleDateString('pt-BR');
            let hora = "--:--";
            if(evt.Horario_Evento) { try { hora = new Date(evt.Horario_Evento).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'}); } catch(e){} }

            let buttonsHtml = '';
            let badge = '';

            if (type === 'hosted') {
                badge = `<span class="status-badge my-event" style="background:#4CAF50; color:white;">Meu Evento</span>`;
                buttonsHtml = `
                    <div class="card-actions">
                        <button class="btn-icon edit" onclick="window.openEditModal(${evt.ID_Evento})" title="Editar"><i class="fa-solid fa-pen-to-square"></i></button>
                        <button class="btn-icon guest" onclick="window.openGuestModal(${evt.ID_Evento})" title="Convidados"><i class="fa-solid fa-users"></i></button>
                        <button class="btn-icon delete" onclick="window.deleteEvent(${evt.ID_Evento})" title="Excluir"><i class="fa-solid fa-trash-can"></i></button>
                    </div>
                `;
            } else {
                const dono = (evt.UsuarioCriador || evt.Usuario)?.Nome_Usuario || "Anfitrião";
                badge = `<span class="status-badge invited" style="background:#FFD700; color:#333;">Convidado</span>`;
                
                let idConvidado = null;
                if(evt.EventoConvidado && evt.EventoConvidado.length > 0) idConvidado = evt.EventoConvidado[0].ID_Convidado;

                buttonsHtml = `
                    <div style="margin-top:10px;">
                        <p style="font-size:0.85rem; color:#ccc; margin-bottom:8px;">Convidado por: <strong>${dono}</strong></p>
                        <div style="display:flex; gap:10px;">
                            <button class="btn-confirm" style="flex:1; font-size:0.9rem; background:#2ecc71; border:none; padding:8px; border-radius:5px; color:white; cursor:pointer;" 
                                onclick="window.acceptInvite(${evt.ID_Evento}, this)">
                                <i class="fa-solid fa-check"></i> Aceitar
                            </button>
                            <button class="btn-decline" style="flex:1; font-size:0.9rem; background:#ff6b6b; border:none; padding:8px; border-radius:5px; color:white; cursor:pointer;" 
                                onclick="window.declineInvite(${evt.ID_Evento}, ${idConvidado})">
                                <i class="fa-solid fa-xmark"></i> Recusar
                            </button>
                        </div>
                    </div>
                `;
            }

            card.innerHTML = `
                <div class="card-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                    <span class="event-date" style="font-weight:bold; color:#FFD700;">${dia} às ${hora}</span>
                    ${badge}
                </div>
                <div class="card-body">
                    <h3 class="event-title" style="margin:0 0 5px 0;">${evt.Titulo_Evento}</h3>
                    <p class="event-location" style="color:#ccc;"><i class="fa-solid fa-location-dot"></i> ${evt.Local_Evento}</p>
                </div>
                <div class="card-footer">${buttonsHtml}</div>
            `;
            grid.appendChild(card);
        });
    }

    function renderDonations(campanhas) {
        grid.innerHTML = "";
        if (!campanhas || campanhas.length === 0) {
            grid.innerHTML = '<p class="empty-msg">Nenhuma campanha ativa.</p>';
            return;
        }
        campanhas.forEach(camp => {
            const card = document.createElement('div');
            card.className = 'event-card card-item donation-card';
            const title = camp.Evento ? camp.Evento.Titulo_Evento : "Campanha";
            const meta = parseFloat(camp.Meta_Financeira_Campanha).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

            card.innerHTML = `
                <div class="card-header" style="background: linear-gradient(45deg, #FFD700, #FFA500); padding:10px; border-radius:5px 5px 0 0; color:#333; font-weight:bold;">
                    <div style="display:flex; justify-content:space-between;"><span><i class="fa-solid fa-gift"></i> Campanha</span><span>Aberta</span></div>
                </div>
                <div class="card-body" style="padding:15px;">
                    <h3 class="event-title" style="margin-top:0;">${title}</h3>
                    <p class="meta-goal" style="font-size:1.1em;">Meta: <strong>${meta}</strong></p>
                    <p class="donate-text" style="font-size:0.9em; color:#ccc;">Ajude a realizar este sonho!</p>
                </div>
                <div class="card-footer" style="padding:10px;">
                     <button class="btn-donate" style="width:100%; background:#2ecc71; color:white; border:none; padding:10px; border-radius:5px; cursor:pointer; font-weight:bold;" onclick="window.openPixModal('${camp.Chave_Pix_Campanha}')"><i class="fa-brands fa-pix"></i> Doar Agora</button>
                </div>
            `;
            grid.appendChild(card);
        });
    }

    // --- AÇÕES DE CONVITE ---
    window.acceptInvite = async function(idEvento, btnElement) {
        if(btnElement) {
            btnElement.innerHTML = '<i class="fa-solid fa-check-double"></i> Confirmado';
            btnElement.style.background = '#27ae60';
            btnElement.disabled = true;
        }
        alert("Presença confirmada com sucesso!");
    };

    window.declineInvite = async function(idEvento, idConvidado) {
        if(!idConvidado) return alert("Erro: ID do convite não encontrado.");
        if(!confirm("Deseja recusar este convite?")) return;
        try {
            const res = await fetch(`${API_BASE_URL}/convidado/recusar/${idEvento}/${idConvidado}`, {
                method: 'DELETE',
                headers: { "Authorization": `Bearer ${token}` }
            });
            if(res.ok) { alert("Convite recusado."); fetchInvitedEvents(); }
            else alert("Erro ao recusar.");
        } catch (error) { alert("Erro de conexão."); }
    };

    // --- MODAIS ---
    window.openGuestModal = function(id) {
        document.getElementById('currentEventIdGuest').value = id;
        document.getElementById('newGuestEmail').value = "";
        if(guestModal) { guestModal.classList.remove('hidden'); guestModal.style.display='flex'; loadGuestList(id); }
    };
    window.closeGuestModal = function() { if(guestModal) guestModal.classList.add('hidden'); };

    async function loadGuestList(id) {
        const listUl = document.getElementById('guestListUl');
        const msg = document.getElementById('noGuestsMsg');
        if(!listUl) return;
        listUl.innerHTML = '<li style="color:white">Carregando...</li>';
        try {
            const res = await fetch(`${API_BASE_URL}/eventos/${id}/convidados`, { headers: { "Authorization": `Bearer ${token}` } });
            const data = await res.json();
            listUl.innerHTML = "";
            if(data.length === 0) msg.style.display = 'block';
            else {
                msg.style.display = 'none';
                data.forEach(item => {
                    const li = document.createElement('li');
                    li.style.cssText = "color:white; display:flex; justify-content:space-between; padding:5px 0; border-bottom:1px solid rgba(255,255,255,0.1)";
                    li.innerHTML = `<span><i class="fa-solid fa-user"></i> ${item.Convidado.Email_Convidado}</span>
                        <button onclick="window.removeGuestFromEvent(${id}, ${item.Convidado.ID_Convidado})" style="background:none; border:none; color:#ff6b6b; cursor:pointer;"><i class="fa-solid fa-trash"></i></button>`;
                    listUl.appendChild(li);
                });
            }
        } catch (e) { console.error(e); }
    }

    window.addGuest = async function() {
        const id = document.getElementById('currentEventIdGuest').value;
        const email = document.getElementById('newGuestEmail').value.trim();
        if(!email) return alert("Digite um email.");
        try {
            const res = await fetch(`${API_BASE_URL}/eventos/${id}/convidar`, {
                method: 'POST',
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({ email })
            });
            if(res.ok) { document.getElementById('newGuestEmail').value = ""; loadGuestList(id); }
            else { const d = await res.json(); alert(d.error || "Erro ao convidar"); }
        } catch(e) { alert("Erro conexão"); }
    };

    window.removeGuestFromEvent = async function(idEvento, idConvidado) {
        if(!confirm("Remover este convidado?")) return;
        try {
            const res = await fetch(`${API_BASE_URL}/eventos/${idEvento}/convidar/${idConvidado}`, {
                method: 'DELETE',
                headers: { "Authorization": `Bearer ${token}` }
            });
            if(res.ok) loadGuestList(idEvento);
        } catch(e) { console.error(e); }
    };

    window.openEditModal = function(id) {
        fetch(`${API_BASE_URL}/eventos/${id}`, { headers: { "Authorization": `Bearer ${token}` } })
        .then(res => res.json())
        .then(evt => {
            if(inputEditId) inputEditId.value = evt.ID_Evento;
            if(inputEditTitle) inputEditTitle.value = evt.Titulo_Evento;
            if(inputEditLocation) inputEditLocation.value = evt.Local_Evento;
            if(inputEditDate) inputEditDate.value = new Date(evt.Data_Evento).toISOString().split('T')[0];
            if(inputEditTime && evt.Horario_Evento) {
                const d = new Date(evt.Horario_Evento);
                inputEditTime.value = `${String(d.getUTCHours()).padStart(2,'0')}:${String(d.getUTCMinutes()).padStart(2,'0')}`;
            }
            if(editModal) { editModal.classList.remove('hidden'); editModal.style.display='flex'; }
        });
    };
    window.closeEditModal = function() { if(editModal) editModal.classList.add('hidden'); };

    const formEdit = document.getElementById('editEventForm');
    if(formEdit) {
        formEdit.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = inputEditId.value;
            const payload = { Titulo_Evento: inputEditTitle.value, Local_Evento: inputEditLocation.value, Data_Evento: inputEditDate.value, Horario_Evento: inputEditTime.value };
            try {
                const res = await fetch(`${API_BASE_URL}/eventos/${id}`, { method: 'PUT', headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }, body: JSON.stringify(payload) });
                if(res.ok) { alert("Atualizado!"); closeEditModal(); fetchMyEvents(); }
            } catch(e) { console.error(e); }
        });
    }

    window.deleteEvent = async function(id) {
        if(!confirm("Tem certeza?")) return;
        try {
            const res = await fetch(`${API_BASE_URL}/eventos/${id}`, { method: 'DELETE', headers: { "Authorization": `Bearer ${token}` } });
            if(res.ok) fetchMyEvents(); else alert("Erro ao excluir.");
        } catch(e) { alert("Erro conexão"); }
    };

    window.openPixModal = function(chave) {
        if(pixModal) {
            const disp = document.getElementById('displayChavePix');
            if(disp) disp.innerText = chave;
            pixModal.classList.remove('hidden');
            pixModal.style.display = 'flex';
        }
    };
    window.closePixModal = function() { if(pixModal) pixModal.classList.add('hidden'); };

    const btnPixOk = document.getElementById('pixOkBtn');
    if(btnPixOk) btnPixOk.addEventListener('click', () => { window.closePixModal(); if(successModal) successModal.classList.remove('hidden'); });
    const btnCloseSuccess = document.getElementById('btnCloseSuccess');
    if(btnCloseSuccess) btnCloseSuccess.addEventListener('click', () => successModal.classList.add('hidden'));

    document.querySelectorAll('.close-modal-btn').forEach(btn => {
        btn.addEventListener('click', () => { closeEditModal(); if(guestModal) closeGuestModal(); window.closePixModal(); });
    });
});