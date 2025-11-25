document.addEventListener("DOMContentLoaded", function() {
    
    // --- CONFIGURAÇÕES API ---
    const API_BASE_URL = "http://localhost:3000";
    const token = localStorage.getItem("token");
    const userEmail = localStorage.getItem("userEmail"); // Necessário para saber se fui convidado

    // --- PROTEÇÃO DE ROTA ---
    if (!token) {
        window.location.href = "autenticacao.html";
        return;
    }

    // --- ELEMENTOS DOM (Conferidos com o HTML) ---
    const grid = document.getElementById('events-grid');
    
    // Botões de Filtro (Abas)
    const btnHosted = document.getElementById('btnHosted');
    const btnInvited = document.getElementById('btnInvited');
    const btnDonations = document.getElementById('btnDonations');
    
    // Modais
    const editModal = document.getElementById('editEventModal');
    const pixModal = document.getElementById('pixModal');
    const successModal = document.getElementById('successModal');

    // Elementos do Formulário de Edição
    const inputId = document.getElementById('editEventId');
    const inputTitle = document.getElementById('editTitle');
    const inputDate = document.getElementById('editDate');
    const inputTime = document.getElementById('editTime');
    const inputLocation = document.getElementById('editLocation');
    const inputDescription = document.getElementById('editDescription');
    
    const btnSave = document.getElementById('btn-save'); // Verifique se adicionou este ID no HTML
    const btnDelete = document.getElementById('btn-delete'); // Verifique se adicionou este ID no HTML
    const btnContribute = document.getElementById('btnContribute'); // Verifique se adicionou este ID no HTML

    // Variáveis de Estado
    let currentView = 'hosted'; // 'hosted', 'invited', 'donations'
    let allEventsCache = [];
    let currentEditingEvent = null;

    // --- FUNÇÕES AUXILIARES ---
    function getUserIdFromToken() {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
            return JSON.parse(jsonPayload).id || 1; 
        } catch (e) { return 1; }
    }

    const myId = getUserIdFromToken();

    // --- 1. CARREGAR EVENTOS (GET) ---
    async function fetchEvents() {
        grid.innerHTML = '<div style="color:white; text-align:center; grid-column:1/-1; padding: 20px;">Carregando eventos...</div>';
        
        try {
            const response = await fetch(`${API_BASE_URL}/eventos`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            
            if (!response.ok) throw new Error("Erro ao buscar eventos");
            
            const events = await response.json();
            allEventsCache = events;
            renderEvents();

        } catch (error) {
            console.error(error);
            grid.innerHTML = '<div style="color:#ff6b6b; text-align:center; grid-column:1/-1">Falha de conexão com a API. Verifique se o servidor está rodando.</div>';
        }
    }

    // --- 2. RENDERIZAR NA TELA (Lógica das Abas) ---
    function renderEvents() {
        grid.innerHTML = "";
        
        let filteredEvents = [];
        const emptyMessage = {
            'hosted': "Você ainda não criou nenhum evento.",
            'invited': "Você não possui convites pendentes.",
            'donations': "Nenhuma campanha de arrecadação pública disponível no momento."
        };
        
        // --- LÓGICA DE FILTRAGEM ---
        if (currentView === 'hosted') {
            // MEUS EVENTOS: Criado por mim
            filteredEvents = allEventsCache.filter(e => e.ID_Usuario_Criador == myId);

        } else if (currentView === 'invited') {
            // CONVITES: Não sou o criador E meu email está na lista (ou lista está vazia se for teste)
            filteredEvents = allEventsCache.filter(e => {
                const isNotMine = e.ID_Usuario_Criador != myId;
                // Verificação segura se Lista_Convidados existe e é array/string
                let isInvited = false;
                if (e.Lista_Convidados) {
                    // Se for string "email1, email2" ou array ["email1", "email2"]
                    const lista = Array.isArray(e.Lista_Convidados) ? e.Lista_Convidados.join(',') : e.Lista_Convidados;
                    isInvited = lista.includes(userEmail);
                }
                return isNotMine && isInvited;
            });

        } else if (currentView === 'donations') {
            // DOAÇÕES (Campanhas Gerais): 
            // 1. Não é meu evento
            // 2. Tem Meta de Arrecadação (significa que pede dinheiro)
            filteredEvents = allEventsCache.filter(e => {
                const isNotMine = e.ID_Usuario_Criador != myId;
                const hasMeta = parseFloat(e.Meta_Arrecadacao) > 0;
                return isNotMine && hasMeta;
            });
        }

        // Renderização Vazia
        if (filteredEvents.length === 0) {
            grid.innerHTML = `
                <div class="empty-state" style="grid-column:1/-1; text-align:center; color:#888; margin-top:50px;">
                    <i class="fa-regular fa-calendar-xmark" style="font-size: 3rem; margin-bottom: 15px;"></i>
                    <p>${emptyMessage[currentView]}</p>
                </div>`;
            return;
        }

        // Renderização dos Cards
        filteredEvents.forEach(evt => {
            const id = evt.ID_Evento || evt.id;
            const titulo = evt.Titulo_Evento || evt.Titulo;
            const dataStr = evt.Data_Evento || evt.Data;
            const local = evt.Local_Evento || evt.Local;
            
            // Valores monetários
            const meta = parseFloat(evt.Meta_Arrecadacao || 0);
            const arrecadado = parseFloat(evt.Valor_Arrecadado || 0);
            const percent = meta > 0 ? (arrecadado / meta) * 100 : 0;
            
            // Data Legível
            const dia = new Date(dataStr).getDate() || "--";
            const mes = new Date(dataStr).toLocaleDateString('pt-BR',{month:'short'}).replace('.','').toUpperCase();

            // Lógica do Botão (Dono Edita / Outros Doam)
            let actionBtn = "";
            
            if (currentView === 'hosted') {
                // Se é meu, eu edito
                actionBtn = `<button class="btn-action btn-edit" onclick="openEditModal(${id})"><i class="fa-solid fa-pen"></i> Editar</button>`;
            } else {
                // Se é convite ou doação pública, eu doo
                // Só mostra botão doar se tiver meta
                if (meta > 0) {
                    actionBtn = `<button class="btn-action btn-donate" onclick="openPixModal(${id}, '${titulo}', ${meta - arrecadado})"><i class="fa-solid fa-hand-holding-dollar"></i> Doar</button>`;
                } else {
                    actionBtn = `<button class="btn-action" style="cursor:default; opacity:0.7">Apenas Presença</button>`;
                }
            }

            const cardHTML = `
                <div class="event-card">
                    <div class="card-header">
                        <div class="date-badge">
                            <span class="day">${dia}</span>
                            <span class="month">${mes}</span>
                        </div>
                        <div class="status-badge ${percent >= 100 ? 'status-complete' : 'status-active'}">
                            ${percent >= 100 ? 'Concluído' : 'Ativo'}
                        </div>
                    </div>
                    
                    <div class="card-body">
                        <h3>${titulo}</h3>
                        <p class="location"><i class="fa-solid fa-location-dot"></i> ${local}</p>
                        
                        <div class="progress-container" ${meta <= 0 ? 'style="display:none"' : ''}>
                            <div class="progress-labels">
                                <span>R$ ${arrecadado.toFixed(2)}</span>
                                <span>Meta: R$ ${meta.toFixed(2)}</span>
                            </div>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${Math.min(percent, 100)}%"></div>
                            </div>
                        </div>
                    </div>

                    <div class="card-footer">
                        ${actionBtn}
                    </div>
                </div>
            `;
            grid.innerHTML += cardHTML;
        });
    }

    // --- CONTROLE DE ABAS ---
    function setActiveTab(tab) {
        // Remove active visual de todos
        [btnHosted, btnInvited, btnDonations].forEach(btn => btn.classList.remove('active'));
        
        // Adiciona ao clicado
        if(tab === 'hosted') btnHosted.classList.add('active');
        if(tab === 'invited') btnInvited.classList.add('active');
        if(tab === 'donations') btnDonations.classList.add('active');
        
        currentView = tab;
        renderEvents();
    }

    if(btnHosted) btnHosted.addEventListener('click', () => setActiveTab('hosted'));
    if(btnInvited) btnInvited.addEventListener('click', () => setActiveTab('invited'));
    if(btnDonations) btnDonations.addEventListener('click', () => setActiveTab('donations'));

    // --- 3. MODAIS E AÇÕES ---
    
    // Abrir Edição
    window.openEditModal = function(id) {
        const evt = allEventsCache.find(e => (e.ID_Evento || e.id) == id);
        if(!evt) return;

        currentEditingEvent = evt;
        
        if(inputId) inputId.value = id;
        if(inputTitle) inputTitle.value = evt.Titulo_Evento || "";
        if(inputLocation) inputLocation.value = evt.Local_Evento || "";
        if(inputDescription) inputDescription.value = evt.Descricao || ""; // Caso exista
        
        if(inputDate && evt.Data_Evento) inputDate.value = evt.Data_Evento.split('T')[0];
        
        if(inputTime && evt.Horario_Evento) {
            // Extrai hora HH:MM da string ISO
            const timePart = evt.Horario_Evento.includes('T') ? evt.Horario_Evento.split('T')[1] : evt.Horario_Evento;
            inputTime.value = timePart.substring(0,5);
        }

        editModal.classList.remove('hidden');
        editModal.style.display = 'flex';
    };

    window.closeEditModal = function() {
        editModal.classList.add('hidden');
        editModal.style.display = 'none';
        currentEditingEvent = null;
    };

    // Botão Salvar (PUT)
    if(btnSave) {
        btnSave.addEventListener('click', async function(e) {
            e.preventDefault();
            if(!currentEditingEvent) return;
            const id = currentEditingEvent.ID_Evento || currentEditingEvent.id;
            
            // Constrói Data ISO
            const dataISO = inputDate.value ? `${inputDate.value}T00:00:00Z` : currentEditingEvent.Data_Evento;
            const horarioISO = (inputDate.value && inputTime.value) ? `${inputDate.value}T${inputTime.value}:00Z` : currentEditingEvent.Horario_Evento;

            const payload = {
                Titulo_Evento: inputTitle.value,
                Local_Evento: inputLocation.value,
                Data_Evento: dataISO,
                Horario_Evento: horarioISO
                // Adicione outros campos se a API suportar (Ex: Descricao, Meta)
            };

            btnSave.textContent = "Salvando...";
            try {
                const response = await fetch(`${API_BASE_URL}/eventos/${id}`, {
                    method: 'PUT',
                    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                    body: JSON.stringify(payload)
                });
                if(response.ok) {
                    alert("Atualizado com sucesso!");
                    closeEditModal();
                    fetchEvents();
                } else {
                    alert("Erro ao atualizar.");
                }
            } catch (e) { alert("Erro de conexão."); }
            finally { btnSave.textContent = "Salvar Alterações"; }
        });
    }

    // Botão Excluir (DELETE)
    if(btnDelete) {
        btnDelete.addEventListener('click', async function(e) {
            e.preventDefault(); // Evita submit de form se estiver dentro de um
            if(!currentEditingEvent) return;
            if(!confirm("Tem certeza? Essa ação não pode ser desfeita.")) return;

            const id = currentEditingEvent.ID_Evento || currentEditingEvent.id;
            
            try {
                const response = await fetch(`${API_BASE_URL}/eventos/${id}`, {
                    method: 'DELETE',
                    headers: { "Authorization": `Bearer ${token}` }
                });
                if(response.ok) {
                    alert("Evento excluído.");
                    closeEditModal();
                    fetchEvents();
                } else {
                    alert("Erro ao excluir.");
                }
            } catch(e) { alert("Erro de conexão."); }
        });
    }
    // Botão Contribuir (abrir modal Pix)
    if (btnContribute) {
        btnContribute.addEventListener('click', function() {
            // 1. Verifica se existe um evento aberto no modal
            if (!currentEditingEvent) return;

            // 2. Fecha o modal de detalhes atual (para abrir o do Pix)
            closeEditModal();
            // 3. Pega os dados do evento atual para preencher o Pix
            const id = currentEditingEvent.ID_Evento || currentEditingEvent.id;
            const titulo = currentEditingEvent.Titulo_Evento || currentEditingEvent.Titulo;
            const meta = parseFloat(currentEditingEvent.Meta_Arrecadacao || 0);
            const arrecadado = parseFloat(currentEditingEvent.Valor_Arrecadado || 0);
            const restante = meta - arrecadado;

            // 4. Abre o modal de Pagamento (Pix)
            // A função openPixModal já foi criada no passo anterior
            openPixModal(id, titulo, restante);
        });
    }

    // --- FLUXO DE DOAÇÃO ---
    window.openPixModal = function(id, title, remaining) {
        // Lógica visual do PIX
        pixModal.classList.remove('hidden');
        pixModal.style.display = 'flex';
        // Aqui você poderia colocar o ID do evento num input hidden dentro do modal Pix se fosse enviar pro backend
    };

    window.closePixModal = function() {
        pixModal.classList.add('hidden');
        pixModal.style.display = 'none';
    };

    // Botão "Já fiz o PIX"
    const btnConfirmPix = document.getElementById('pixOkBtn'); // Verifique ID no HTML
    if(btnConfirmPix) {
        btnConfirmPix.addEventListener('click', function() {
            closePixModal();
            successModal.classList.remove('hidden');
            successModal.style.display = 'flex';
        });
    }

    const btnCloseSuccess = document.getElementById('btnCloseSuccess'); // Verifique ID no HTML
    if(btnCloseSuccess) {
        btnCloseSuccess.addEventListener('click', function() {
            successModal.classList.add('hidden');
            successModal.style.display = 'none';
            // Recarrega para ver se (num caso real) o valor atualizou
            fetchEvents();
        });
    }

    // Fechar modais clicando fora ou no X
    document.querySelectorAll('.close-modal-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            closeEditModal();
            closePixModal();
        });
    });
    
    window.addEventListener('click', (e) => {
        if(e.target === editModal) closeEditModal();
        if(e.target === pixModal) closePixModal();
    });

    // Inicia
    fetchEvents();
});