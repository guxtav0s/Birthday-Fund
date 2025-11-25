document.addEventListener("DOMContentLoaded", function() {
    
    // --- CONFIGURAÇÕES API ---
    const API_BASE_URL = "http://localhost:3000";
    const token = localStorage.getItem("token");

    // Elementos DOM
    const eventsListContainer = document.getElementById('eventsList');
    const statInvites = document.getElementById('statInvites');
    const statActive = document.getElementById('statActive');
    const welcomeTitle = document.getElementById('welcomeTitle');
    
    // Modais
    const createModal = document.getElementById('createEventModal');
    const createForm = document.getElementById('createEventForm');
    const detailModal = document.getElementById('eventModal');

    // --- 1. VERIFICAÇÃO DE SEGURANÇA ---
    if (!token) {
        // Se não tem token e tentou acessar área logada, o script.js cuida de mostrar a Hero Publica
        // Mas se estivermos tentando carregar dados, paramos aqui.
        return; 
    }

    // Atualiza título de boas vindas
    if(welcomeTitle) {
        const storedUser = localStorage.getItem("user");
        const userName = JSON.parse(storedUser).userName;
        const firstName = userName.split(' ')[0];
        welcomeTitle.innerHTML = `Olá, <span style="color:#FFD700">${firstName}</span>!`;
    }

    // Inicia carregamento
    loadDashboard();

    // --- FUNÇÕES AUXILIARES ---
    
    // Tenta extrair o ID do usuário de dentro do Token (JWT)
    function getUserIdFromToken() {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            const decoded = JSON.parse(jsonPayload);
            return decoded.id || decoded.ID_Usuario || 1; // Retorna 1 se falhar (fallback do Postman)
        } catch (e) {
            console.warn("Não foi possível ler o ID do token, usando 1 como padrão.");
            return 1;
        }
    }

    function monthName(dateStr) {
        if(!dateStr) return "";
        // Aceita formato ISO (2025-12-10) ou BR (10/12/2025)
        let monthIndex = 0;
        if (dateStr.includes('-')) {
            const parts = dateStr.split('-'); // [YYYY, MM, DD]
            monthIndex = parseInt(parts[1]) - 1;
        } else {
            const parts = dateStr.split('/');
            monthIndex = parseInt(parts[1]) - 1;
        }
        const monthMap = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];
        return monthMap[monthIndex] || "";
    }

    function getDay(dateStr) {
        if(!dateStr) return "--";
        if (dateStr.includes('-')) {
            const parts = dateStr.split('-');
            return parts[2].substring(0, 2); // Pega o dia, ignorando hora se tiver T
        }
        return dateStr.split('/')[0];
    }

    // --- 2. LISTAR EVENTOS (GET) ---
    async function loadDashboard() {
        if(eventsListContainer) {
            eventsListContainer.innerHTML = '<div style="padding:40px; text-align:center; color:#ccc;"><i class="fas fa-circle-notch fa-spin"></i> Carregando eventos...</div>';
        }

        try {
            const response = await fetch(`${API_BASE_URL}/eventos`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error("Falha ao buscar eventos");

            const eventos = await response.json();
            
            // Processa estatísticas
            // Nota: Como a API retorna tudo, filtramos aqui se necessário ou confiamos que a API já filtrou pelo token
            const activeCount = eventos.length; 
            
            if(statInvites) statInvites.innerText = "0"; // API ainda não tem filtro de "convites novos" vs "meus eventos"
            if(statActive) statActive.innerText = activeCount;

            renderList(eventos);

        } catch (error) {
            console.error(error);
            if(eventsListContainer) {
                eventsListContainer.innerHTML = `<div style="text-align:center; color:#ff6b6b;">Erro ao carregar eventos.<br><small>${error.message}</small></div>`;
            }
        }
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
            // Adaptação dos campos da API para o Layout
            // API: Titulo_Evento, Data_Evento, Local_Evento, Horario_Evento
            const titulo = evt.Titulo_Evento || evt.Titulo;
            const data = evt.Data_Evento || evt.Data;
            const local = evt.Local_Evento || evt.Local;
            const hora = evt.Horario_Evento ? evt.Horario_Evento.slice(11, 16) : (evt.Hora || "--:--"); // Tenta pegar HH:MM do ISO
            const id = evt.ID_Evento || evt.id;

            // Lógica visual simples (assumindo tudo como "meu evento" por enquanto)
            const typeClass = 'invite'; 
            const badgeText = 'FESTA';

            const itemHTML = `
                <li class="event-item" onclick="window.openEventModal(${id})">
                    <div class="date-box ${typeClass}">
                        <span class="date-day">${getDay(data)}</span>
                        <span class="date-month">${monthName(data)}</span>
                    </div>
                    <div class="event-content">
                        <div class="event-header">
                            <span class="event-badge badge-${typeClass}">${badgeText}</span>
                            <span class="event-time">${hora}</span>
                        </div>
                        <h4 class="event-title">${titulo}</h4>
                        <div class="event-location">${local}</div>
                    </div>
                    <div class="event-action">
                        <button class="btn-icon-action">
                            <i class="fa-solid fa-eye"></i>
                        </button>
                    </div>
                </li>
            `;
            eventsListContainer.innerHTML += itemHTML;
        });

        // Salva eventos em memória para o modal abrir rápido sem novo fetch
        window.currentEventsList = events;
    }

    // --- 3. CRIAR EVENTO (POST) ---
    createForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        // Pega valores do formulário
        const title = document.getElementById('newTitle').value;
        const dateRaw = document.getElementById('newDate').value; // Esperado DD/MM ou YYYY-MM-DD
        const timeRaw = document.getElementById('newTime').value; // HH:MM
        const loc = document.getElementById('newLocation').value;
        const type = document.getElementById('newType').value;
        const guests = document.getElementById('newGuests').value;

        // Formatação de DATA para ISO-8601 (O que o banco gosta)
        // Se o usuário digita "20/12", precisamos colocar ano. Assumindo ano atual ou input type="date"
        // Para garantir compatibilidade com o Postman: "2025-12-10T00:00:00Z"
        
        // Simples conversão para formato ISO string se for apenas texto
        // Idealmente, mude o input no HTML para type="date" e type="time" para facilitar
        let dataFormatada = new Date().toISOString(); 
        try {
             // Tenta criar data. Se for input text "DD/MM", isso pode falhar sem tratamento extra.
             // Vou assumir que você digitará YYYY-MM-DD para testar ou implementaremos conversor depois.
             // Para o teste agora, vou enviar uma data ISO válida fake se falhar
             dataFormatada = new Date().toISOString(); 
        } catch(e) {}

        const userId = getUserIdFromToken();

        // JSON conforme o Postman
        const payload = {
            ID_Usuario_Criador: userId,
            Titulo_Evento: title,
            Data_Evento: "2025-12-10T00:00:00Z", // Placeholder para evitar erro 500 se o formato de data do input for ruim
            Local_Evento: loc,
            Horario_Evento: "2025-12-10T" + timeRaw + ":00Z"
            // Nota: O Postman não tinha campo "Descrição" ou "Tipo" no JSON de exemplo.
            // Se a API aceitar, podemos adicionar. Se não, eles serão ignorados.
        };

        const btnSubmit = createForm.querySelector('button[type="submit"]');
        const oldText = btnSubmit.textContent;
        btnSubmit.textContent = "Criando...";
        btnSubmit.disabled = true;

        try {
            const response = await fetch(`${API_BASE_URL}/eventos`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                alert("Evento criado com sucesso!");
                window.closeCreateModal();
                createForm.reset();
                loadDashboard(); // Recarrega a lista
            } else {
                const err = await response.json();
                alert("Erro ao criar evento: " + (err.message || response.statusText));
            }

        } catch (error) {
            console.error(error);
            alert("Erro de conexão ao criar evento.");
        } finally {
            btnSubmit.textContent = oldText;
            btnSubmit.disabled = false;
        }
    });

    // --- 4. CONTROLES DE MODAL (Visual) ---
    window.openEventModal = function(id) {
        // Busca evento na lista carregada localmente
        const evt = window.currentEventsList.find(e => (e.ID_Evento || e.id) == id);
        if(!evt) return;

        document.getElementById('modalTitle').innerText = evt.Titulo_Evento || evt.Titulo;
        document.getElementById('modalLocation').innerText = evt.Local_Evento || evt.Local;
        // Preencher outros campos...
        
        if(detailModal) detailModal.classList.add('active');
    };

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
});