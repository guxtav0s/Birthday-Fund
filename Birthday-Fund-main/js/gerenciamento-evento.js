document.addEventListener("DOMContentLoaded", function() {
    
    const DB_KEY = 'eventsDB';
    const currentUserEmail = sessionStorage.getItem("currentUserEmail");

    // Proteção de Rota
    if (!currentUserEmail) {
        window.location.href = 'autenticacao.html';
        return;
    }

    // Elementos DOM
    const grid = document.getElementById('eventsGrid');
    const btnHosted = document.getElementById('btnHosted');
    const btnInvited = document.getElementById('btnInvited');
    
    // Modal Edição
    const editModal = document.getElementById('editModal');
    const editForm = document.getElementById('editEventForm');
    const btnDelete = document.getElementById('btnDeleteEvent');
    const closeBtns = document.querySelectorAll('.close-modal-btn');

    // Estado Inicial
    let currentFilter = 'hosted'; // 'hosted' ou 'invited'

    // Inicialização
    init();

    function init() {
        // Configura os botões das abas IMEDIATAMENTE
        setupTabs();
        
        // Carrega a lista
        loadAndRender();

        // Verifica se veio redirecionado da home
        checkUrlParams();
    }

    // ===========================================
    // 1. LÓGICA DAS ABAS (TABS)
    // ===========================================
    function setupTabs() {
        if(btnHosted && btnInvited) {
            btnHosted.addEventListener('click', () => {
                currentFilter = 'hosted';
                updateTabClasses();
                loadAndRender();
            });

            btnInvited.addEventListener('click', () => {
                currentFilter = 'invited';
                updateTabClasses();
                loadAndRender();
            });
        }
    }

    function updateTabClasses() {
        if (currentFilter === 'hosted') {
            btnHosted.classList.add('active');
            btnInvited.classList.remove('active');
        } else {
            btnInvited.classList.add('active');
            btnHosted.classList.remove('active');
        }
    }

    // ===========================================
    // 2. DADOS E RENDERIZAÇÃO
    // ===========================================
    function getEvents() {
        try {
            return JSON.parse(localStorage.getItem(DB_KEY)) || [];
        } catch (e) {
            return [];
        }
    }

    function saveEvents(events) {
        localStorage.setItem(DB_KEY, JSON.stringify(events));
    }

    function loadAndRender() {
        const allEvents = getEvents();
        grid.innerHTML = '';

        const filteredEvents = allEvents.filter(evt => {
            // Proteção contra dados corrompidos
            if (!evt) return false;

            const isOwner = evt.FK_Usuario === currentUserEmail;
            
            // Verifica convidados com segurança (se não for array, assume vazio)
            let isGuest = false;
            if (Array.isArray(evt.Lista_Convidados)) {
                isGuest = evt.Lista_Convidados.some(e => e && e.trim() === currentUserEmail);
            }

            if (currentFilter === 'hosted') {
                return isOwner; 
            } else {
                return isGuest && !isOwner; 
            }
        });

        // Estado Vazio
        if (filteredEvents.length === 0) {
            const msg = currentFilter === 'hosted' 
                ? "Você ainda não criou nenhum evento." 
                : "Você não tem convites pendentes.";
            
            grid.innerHTML = `
                <div class="empty-state">
                    <i class="fa-regular fa-folder-open"></i>
                    <p>${msg}</p>
                </div>`;
            return;
        }

        // Renderiza Cards
        filteredEvents.forEach(evt => {
            const isDonation = evt.Meta_Arrecadacao && parseFloat(evt.Meta_Arrecadacao) > 0;
            const stripClass = isDonation ? 'donate' : 'invite';
            const roleLabel = currentFilter === 'hosted' ? 'Organizador' : 'Convidado';
            const roleClass = currentFilter === 'hosted' ? 'role-owner' : 'role-guest';

            let buttonsHTML = '';
            if (currentFilter === 'hosted') {
                buttonsHTML = `
                    <button class="btn-card btn-edit" onclick="openEditModal(${evt.ID_Evento})">
                        <i class="fa-solid fa-pen"></i> Editar
                    </button>`;
            } else {
                const status = evt.Confirmado_Presenca ? "Confirmado" : "Pendente";
                const icon = evt.Confirmado_Presenca ? "fa-check" : "fa-clock";
                buttonsHTML = `
                    <button class="btn-card btn-view" disabled>
                        <i class="fa-solid ${icon}"></i> ${status}
                    </button>`;
            }

            // Formata data com segurança
            let dia = "--", mes = "";
            if(evt.Data && evt.Data.includes('/')) {
                dia = evt.Data.split('/')[0];
                mes = monthName(evt.Data);
            }

            const card = document.createElement('div');
            card.className = 'manage-card';
            card.innerHTML = `
                <div class="card-strip ${stripClass}"></div>
                
                <div class="card-head">
                    <div class="date-badge">
                        <span class="d">${dia}</span>
                        <span class="m">${mes}</span>
                    </div>
                    <span class="role-badge ${roleClass}">${roleLabel}</span>
                </div>

                <div class="card-main">
                    <h3>${evt.Titulo || "Sem Título"}</h3>
                    <div class="info-row"><i class="fa-regular fa-clock"></i> ${evt.Hora || "--:--"}</div>
                    <div class="info-row"><i class="fa-solid fa-location-dot"></i> ${evt.Local || "Local não definido"}</div>
                </div>

                <div class="card-foot">
                    ${buttonsHTML}
                </div>
            `;
            grid.appendChild(card);
        });
    }

    // ===========================================
    // 3. LÓGICA DE URL E MODAL
    // ===========================================
    function checkUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const editId = urlParams.get('editId');

        if (editId) {
            currentFilter = 'hosted';
            updateTabClasses();
            loadAndRender();
            openEditModal(parseInt(editId));
            // Limpa URL
            window.history.replaceState({}, document.title, "gerenciamento-eventos.html");
        }
    }

    // Torna global para o HTML acessar
    window.openEditModal = function(id) {
        const allEvents = getEvents();
        const evt = allEvents.find(e => e.ID_Evento === id);
        if (!evt) return;

        // Preenche inputs
        document.getElementById('editId').value = evt.ID_Evento;
        document.getElementById('editTitulo').value = evt.Titulo;
        document.getElementById('editData').value = evt.Data;
        document.getElementById('editHora').value = evt.Hora;
        document.getElementById('editLocal').value = evt.Local;
        document.getElementById('editDescricao').value = evt.Descricao || "";
        
        // Convidados
        document.getElementById('editConvidados').value = (evt.Lista_Convidados || []).join(', ');

        // Meta
        const metaGroup = document.getElementById('editMetaGroup');
        if (evt.Meta_Arrecadacao && parseFloat(evt.Meta_Arrecadacao) > 0) {
            metaGroup.classList.remove('hidden');
            document.getElementById('editMeta').value = evt.Meta_Arrecadacao;
        } else {
            metaGroup.classList.add('hidden');
        }

        editModal.classList.add('active');
    };

    // Salvar Edição
    editForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const id = parseInt(document.getElementById('editId').value);
        let allEvents = getEvents();
        const idx = allEvents.findIndex(e => e.ID_Evento === id);

        if (idx !== -1) {
            allEvents[idx].Titulo = document.getElementById('editTitulo').value;
            allEvents[idx].Data = document.getElementById('editData').value;
            allEvents[idx].Hora = document.getElementById('editHora').value;
            allEvents[idx].Local = document.getElementById('editLocal').value;
            allEvents[idx].Descricao = document.getElementById('editDescricao').value;

            const guestsStr = document.getElementById('editConvidados').value;
            if(guestsStr) {
                allEvents[idx].Lista_Convidados = guestsStr.split(',').map(s => s.trim()).filter(s => s !== "");
            } else {
                allEvents[idx].Lista_Convidados = [];
            }

            const metaInput = document.getElementById('editMeta');
            if (!metaInput.parentElement.classList.contains('hidden')) {
                allEvents[idx].Meta_Arrecadacao = parseFloat(metaInput.value);
            }

            saveEvents(allEvents);
            editModal.classList.remove('active');
            loadAndRender();
            alert('Evento atualizado com sucesso!');
        }
    });

    // Excluir
    if(btnDelete) {
        btnDelete.addEventListener('click', () => {
            const id = parseInt(document.getElementById('editId').value);
            if (confirm('Tem certeza que deseja excluir este evento?')) {
                let allEvents = getEvents();
                const newEvents = allEvents.filter(e => e.ID_Evento !== id);
                saveEvents(newEvents);
                editModal.classList.remove('active');
                loadAndRender();
            }
        });
    }

    // Fechar Modal
    closeBtns.forEach(btn => btn.addEventListener('click', () => editModal.classList.remove('active')));
    
    window.addEventListener('click', (e) => {
        if (e.target === editModal) editModal.classList.remove('active');
    });

    function monthName(dateStr) {
        if(!dateStr || !dateStr.includes('/')) return "";
        const monthMap = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];
        const parts = dateStr.split('/');
        return parts.length > 1 ? monthMap[parseInt(parts[1]) - 1] : "";
    }
});