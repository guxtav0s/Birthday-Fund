document.addEventListener("DOMContentLoaded", function() {
    
    const API_BASE_URL = "http://localhost:3000";
    const token = localStorage.getItem("token");
    let user = null;

    try {
        user = JSON.parse(localStorage.getItem("user"));
    } catch (e) { console.error(e); }

    if (!token || !user) return;

    const userId = user.ID_Usuario || user.id || user.userId;

    // Elementos
    const eventsListContainer = document.getElementById('eventsList');
    const statInvites = document.getElementById('statInvites');
    const statActive = document.getElementById('statActive');
    const welcomeTitle = document.getElementById('welcomeTitle');
    
    // Modais
    const createModal = document.getElementById('createEventModal');
    const createForm = document.getElementById('createEventForm');
    const detailModal = document.getElementById('eventModal');

    // Inputs
    const newTitle = document.getElementById('newTitle');
    const newDate = document.getElementById('newDate');
    const newTime = document.getElementById('newTime');
    const newLocation = document.getElementById('newLocation');
    const newGuests = document.getElementById('newGuests');
    const newDescription = document.getElementById('newDescription');
    const newType = document.getElementById('newType');
    const newMeta = document.getElementById('newMeta');

    // Saudação
    if(welcomeTitle) {
        const rawName = user.Nome_Usuario || user.nome || "Usuário";
        welcomeTitle.innerHTML = `Olá, <span style="color:#FFD700">${rawName.split(' ')[0]}</span>!`;
    }

    // Variável global para armazenar a lista misturada
    window.mixedDashboardList = [];

    loadDashboard();

    async function loadDashboard() {
        if(!eventsListContainer) return;
        
        try {
            // 1. Busca Meus Eventos
            const resEvents = await fetch(`${API_BASE_URL}/eventos/usuario/${userId}`, { headers: { "Authorization": `Bearer ${token}` } });
            const myEvents = await resEvents.json();

            // 2. Busca Campanhas Globais
            const resCampaigns = await fetch(`${API_BASE_URL}/campanha/ativas`, { headers: { "Authorization": `Bearer ${token}` } });
            const campaigns = await resCampaigns.json();

            // 3. Normaliza Campanhas para parecerem Eventos na lista
            const campaignsFormatted = campaigns.map(c => ({
                ID_Evento: c.ID_Evento, // ID original do evento
                Titulo_Evento: c.Evento.Titulo_Evento,
                Data_Evento: c.Evento.Data_Evento,
                Local_Evento: c.Evento.Local_Evento || "Local não informado",
                Descricao_Evento: "Campanha de Arrecadação Ativa", // Descrição padrão
                // Dados extras para identificar que é campanha
                isCampaign: true,
                meta: c.Meta_Financeira_Campanha,
                pixKey: c.Chave_Pix_Campanha
            }));

            // 4. Mistura tudo (Meus Eventos + Campanhas)
            window.mixedDashboardList = [...myEvents, ...campaignsFormatted];

            // Renderiza a lista unificada
            renderMixedList(window.mixedDashboardList);
            updateStats(myEvents);

        } catch (error) {
            console.error("Erro dashboard:", error);
        }
    }

    function renderMixedList(list) {
        eventsListContainer.innerHTML = "";
        
        // Pega os 4 primeiros itens misturados
        const displayList = list.slice(0, 4);

        if (displayList.length === 0) {
            eventsListContainer.innerHTML = '<p style="color:#aaa; font-style:italic;">Nada acontecendo no momento.</p>';
            return;
        }

        displayList.forEach(item => {
            const date = new Date(item.Data_Evento).toLocaleDateString('pt-BR');
            
            // Ícone diferente se for campanha
            const icon = item.isCampaign 
                ? '<i class="fa-solid fa-hand-holding-dollar" style="color:#2ecc71;"></i>' 
                : '<i class="fa-solid fa-calendar-check" style="color:#FFD700;"></i>';
            
            const div = document.createElement('div');
            div.className = 'event-item';
            div.innerHTML = `
                <div class="event-info">
                    <div style="display:flex; align-items:center; gap:10px;">
                        ${icon}
                        <div>
                            <h4 style="margin:0; color:white;">${item.Titulo_Evento}</h4>
                            <p style="margin:0; color:#ccc; font-size:0.8rem;">${date} - ${item.Local_Evento}</p>
                        </div>
                    </div>
                </div>
                <button class="btn-details" onclick="window.openDetailModal(${item.ID_Evento}, ${item.isCampaign ? 'true' : 'false'})">Ver</button>
            `;
            eventsListContainer.appendChild(div);
        });
    }

    function updateStats(events) {
        if(statActive) statActive.innerText = events.length;
        if(statInvites) statInvites.innerText = "-"; 
    }

    // --- MODAL DE DETALHES INTELIGENTE ---
    window.openDetailModal = function(id, isCampaign) {
        // Acha o evento na lista misturada
        const evt = window.mixedDashboardList.find(e => e.ID_Evento == id && (!!e.isCampaign == isCampaign));
        if(!evt) return;

        document.getElementById('modalTitle').innerText = evt.Titulo_Evento;
        document.getElementById('modalLocation').innerText = evt.Local_Evento;
        document.getElementById('modalDate').innerText = new Date(evt.Data_Evento).toLocaleDateString('pt-BR');
        
        const descEl = document.getElementById('modalDescription');
        if(descEl) descEl.innerText = evt.Descricao_Evento || "Sem descrição.";

        // LÓGICA DO BOTÃO DE AÇÃO DO MODAL
        // Precisamos achar onde injetar o botão ou criar um footer dinâmico
        let modalFooter = detailModal.querySelector('.modal-footer-action');
        
        // Se não tiver footer no HTML, cria um dinamicamente
        if(!modalFooter) {
            modalFooter = document.createElement('div');
            modalFooter.className = 'modal-footer-action';
            modalFooter.style.marginTop = '20px';
            modalFooter.style.textAlign = 'right';
            detailModal.querySelector('.modal-content').appendChild(modalFooter);
        }

        // Limpa botões anteriores
        modalFooter.innerHTML = '';

        if (isCampaign) {
            // SE FOR CAMPANHA -> Botão "Quero Doar" que redireciona
            const btnDonate = document.createElement('button');
            btnDonate.className = 'btn-confirm';
            btnDonate.style.background = '#2ecc71';
            btnDonate.style.width = '100%';
            btnDonate.innerHTML = '<i class="fa-brands fa-pix"></i> Quero Doar';
            
            // O PULO DO GATO: Redireciona passando parâmetros na URL
            btnDonate.onclick = function() {
                window.location.href = `gerenciamento-eventos.html?tab=donations&openPix=${encodeURIComponent(evt.pixKey)}`;
            };
            modalFooter.appendChild(btnDonate);

        } else {
            // SE FOR EVENTO MEU -> Botão "Gerenciar"
            const btnManage = document.createElement('button');
            btnManage.className = 'btn-details'; // Estilo padrão
            btnManage.innerText = 'Gerenciar Evento';
            btnManage.onclick = function() {
                window.location.href = `gerenciamento-eventos.html?id=${id}`;
            };
            modalFooter.appendChild(btnManage);
        }

        detailModal.classList.remove('hidden');
        detailModal.classList.add('active');
        detailModal.style.display = 'flex';
    };

    // --- CRIAÇÃO (MANTIDA) ---
    if(createForm) {
        createForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btnSubmit = createForm.querySelector('button[type="submit"]');
            btnSubmit.textContent = "Criando...";
            btnSubmit.disabled = true;

            const payload = {
                ID_Usuario_Criador: userId,
                Titulo_Evento: newTitle.value,
                Data_Evento: newDate.value,
                Horario_Evento: newTime.value,
                Local_Evento: newLocation.value,
                Descricao_Evento: newDescription ? newDescription.value : ""
            };

            if(newGuests && newGuests.value.trim() !== "") {
                payload.Convidados = newGuests.value.split(',').map(email => email.trim());
            }

            if (newType && newType.value === 'doacao' && newMeta && newMeta.value > 0) {
                payload.Campanha = {
                    meta: parseFloat(newMeta.value),
                    chavePix: "Chave PIX do Perfil" 
                };
            }

            try {
                const res = await fetch(`${API_BASE_URL}/eventos`, {
                    method: 'POST',
                    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                    body: JSON.stringify(payload)
                });

                if(res.ok) {
                    alert("Criado com sucesso!");
                    createForm.reset();
                    window.closeCreateModal();
                    loadDashboard(); 
                } else {
                    const err = await res.json();
                    alert("Erro: " + (err.error || "Verifique dados."));
                }
            } catch (error) { alert("Erro conexão."); } 
            finally { btnSubmit.textContent = "Criar Evento"; btnSubmit.disabled = false; }
        });
    }

    // Modais auxiliares
    window.openCreateModal = function() {
        if(createForm) createForm.reset(); 
        if(document.getElementById('metaFieldGroup')) document.getElementById('metaFieldGroup').classList.add('hidden');
        if(createModal) { createModal.classList.remove('hidden'); createModal.style.display='flex'; }
    };
    window.closeCreateModal = function() { if(createModal) createModal.classList.add('hidden'); };

    window.toggleMetaField = function() {
        const type = document.getElementById('newType').value;
        const grp = document.getElementById('metaFieldGroup');
        if(grp) { type === 'doacao' ? grp.classList.remove('hidden') : grp.classList.add('hidden'); }
    };
    if(newType) newType.addEventListener('change', window.toggleMetaField);

    document.querySelectorAll('.close-modal-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if(detailModal) { detailModal.classList.add('hidden'); detailModal.style.display='none'; }
            if(createModal) window.closeCreateModal();
        });
    });
    window.addEventListener('click', (e) => {
        if(e.target === detailModal) { detailModal.classList.add('hidden'); detailModal.style.display='none'; }
        if(e.target === createModal) window.closeCreateModal();
    });
});