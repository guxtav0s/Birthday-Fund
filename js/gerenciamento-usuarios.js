  /*
  CRUD front-end com mock (localStorage) e hooks comentados para integrar com API.
  */

  document.addEventListener('DOMContentLoaded', function(){
    const USE_MOCK = true;
    const API_BASE_URL = 'https://api.example.com/users'; // exemplo

    const localKey = 'mockUsers_v1';

    const openBtn = document.getElementById('openModal');
    const modal = document.getElementById('modal');
    const cancel = document.getElementById('cancel');
    const backdrop = modal && modal.querySelector('.modal-backdrop');
    const form = document.getElementById('userForm');
    const tbody = document.getElementById('usersTableBody');
    const searchInput = document.querySelector('.search input');
    const modalTitle = document.getElementById('modalTitle');
    const submitBtn = document.getElementById('submitBtn');

    // campos
    const fldId = document.getElementById('userId');
    const fldName = document.getElementById('fullName');
    const fldEmail = document.getElementById('email');
    const fldPassword = document.getElementById('password');
    const fldConfirm = document.getElementById('confirmPassword');
    const fldStatus = document.getElementById('status');

    // --- Mock helpers ---
    function seedMock(){
      const seed = [
        { id: '1', name: 'João S.', email: 'joao@emp.com', status: 'Admin', createdAt: '2024-10-10' },
        { id: '2', name: 'Maria P.', email: 'maria@emp.com', status: 'Ativo', createdAt: '2024-09-10' },
        { id: '3', name: 'Senta', email: 'senta@emp.com', status: 'Inativo', createdAt: '2024-09-01' },
        { id: '4', name: 'Confirmare', email: 'confirmare@emp.com', status: 'Ativo', createdAt: '2024-10-10' }
      ];
      localStorage.setItem(localKey, JSON.stringify(seed));
      return seed;
    }

    function loadMock(){
      const raw = localStorage.getItem(localKey);
      if(!raw) return seedMock();
      try{ return JSON.parse(raw); }catch(e){ return seedMock(); }
    }

    function saveMock(users){
      localStorage.setItem(localKey, JSON.stringify(users));
    }

    // --- API helpers (exemplos comentados) ---
    // async function apiGetAll(){
    //   const res = await fetch(API_BASE_URL);
    //   return res.json();
    // }
    // async function apiCreate(user){
    //   const res = await fetch(API_BASE_URL, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(user) });
    //   return res.json();
    // }
    // async function apiUpdate(id, user){
    //   const res = await fetch(`${API_BASE_URL}/${id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify(user) });
    //   return res.json();
    // }
    // async function apiDelete(id){
    //   await fetch(`${API_BASE_URL}/${id}`, { method: 'DELETE' });
    // }

    // --- CRUD functions (utilizam mock quando USE_MOCK=true) ---
    function getAllUsers(){
      if(USE_MOCK) return Promise.resolve(loadMock());
      // return apiGetAll();
      return Promise.reject(new Error('API not configured'));
    }

    function createUser(data){
      if(USE_MOCK){
        const users = loadMock();
        const id = String(Date.now());
        const created = { id, ...data, createdAt: new Date().toISOString().slice(0,10) };
        users.push(created);
        saveMock(users);
        return Promise.resolve(created);
      }
      // return apiCreate(data);
      return Promise.reject(new Error('API not configured'));
    }

    function updateUser(id, data){
      if(USE_MOCK){
        const users = loadMock();
        const idx = users.findIndex(u => u.id === id);
        if(idx === -1) return Promise.reject(new Error('User not found'));
        users[idx] = { ...users[idx], ...data };
        saveMock(users);
        return Promise.resolve(users[idx]);
      }
      // return apiUpdate(id, data);
      return Promise.reject(new Error('API not configured'));
    }

    function deleteUser(id){
      if(USE_MOCK){
        let users = loadMock();
        users = users.filter(u => u.id !== id);
        saveMock(users);
        return Promise.resolve();
      }
      // return apiDelete(id);
      return Promise.reject(new Error('API not configured'));
    }

    function formatDate(d){
      if(!d) return '';
      if(/^\d{4}-\d{2}-\d{2}$/.test(d)) return d.split('-').reverse().join('/');
      const dt = new Date(d);
      return dt.toLocaleDateString();
    }

    /**
     * Renderiza a tabela. Se for passada uma listaFiltrada, usa-a diretamente.
     * Caso contrário, recupera todos os usuários (mock ou API) via getAllUsers().
     */
    function renderTable(listaFiltrada){
      const renderFrom = (users)=>{
        tbody.innerHTML = '';
        users.forEach(u =>{
          const tr = document.createElement('tr');
          tr.dataset.id = u.id;
          tr.innerHTML = `
            <td>${u.id}</td>
            <td>${escapeHtml(u.name)}</td>
            <td>${escapeHtml(u.email)}</td>
            <td><span class="status ${statusClass(u.status)}">${escapeHtml(u.status)}</span></td>
            <td>${formatDate(u.createdAt)}</td>
            <td class="actions">
              <button class="btn ghost edit-btn" data-id="${u.id}">Editar</button>
              <button class="btn ghost delete-btn" data-id="${u.id}">🗑️</button>
            </td>
          `;
          tbody.appendChild(tr);
        });
      };

      if(Array.isArray(listaFiltrada)){
        renderFrom(listaFiltrada);
        return;
      }

      getAllUsers().then(users =>{
        renderFrom(users);
      }).catch(err =>{
        console.error('Erro ao carregar usuários', err);
      });
    }

    function statusClass(status){
      if(!status) return '';
      if(status.toLowerCase().includes('ativo') || status.toLowerCase().includes('admin')) return 'green';
      return 'gray';
    }

    function escapeHtml(str){
      if(!str) return '';
      return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }

    function openModal(mode='create', user){
      if(mode === 'create'){
        modalTitle.textContent = 'Cadastrar Novo Usuário';
        submitBtn.textContent = 'Cadastrar Usuário';
        fldId.value = '';
        fldName.value = '';
        fldEmail.value = '';
        fldPassword.value = '';
        fldConfirm.value = '';
        fldStatus.value = 'Ativo';
      } else if(mode === 'edit' && user){
        modalTitle.textContent = 'Editar Usuário';
        submitBtn.textContent = 'Salvar Alterações';
        fldId.value = user.id || '';
        fldName.value = user.name || '';
        fldEmail.value = user.email || '';
        fldPassword.value = '';
        fldConfirm.value = '';
        fldStatus.value = user.status || 'Ativo';
      }
      modal.classList.remove('hidden');
    }

    function closeModal(){
      modal.classList.add('hidden');
    }

    // --- Events ---
    if(openBtn) openBtn.addEventListener('click', ()=> openModal('create'));
    if(cancel) cancel.addEventListener('click', closeModal);
    if(backdrop) backdrop.addEventListener('click', closeModal);

    // Pesquisa em tempo real: filtra por name, email e status (case-insensitive)
    if(searchInput){
      searchInput.addEventListener('input', function(e){
        const q = String(e.target.value || '').trim().toLowerCase();

        // Se estiver vazio, renderiza tudo novamente (busca no mock/API)
        if(!q){
          renderTable();
          return;
        }

        if(USE_MOCK){
          const users = loadMock();
          const filtered = users.filter(u => {
            const name = (u.name||'').toLowerCase();
            const email = (u.email||'').toLowerCase();
            const status = (u.status||'').toLowerCase();
            return name.includes(q) || email.includes(q) || status.includes(q);
          });
          renderTable(filtered);
        } else {
          // Se estiver usando API real, você pode implementar aqui uma busca remota.
          // Exemplo comentado (ajuste endpoint/param conforme a API):
          // fetch(`${API_BASE_URL}?q=${encodeURIComponent(q)}`).then(r=>r.json()).then(data=> renderTable(data));

          // Fallback: buscar todos e filtrar no cliente (menos eficiente):
          getAllUsers().then(users =>{
            const filtered = users.filter(u => {
              const name = (u.name||'').toLowerCase();
              const email = (u.email||'').toLowerCase();
              const status = (u.status||'').toLowerCase();
              return name.includes(q) || email.includes(q) || status.includes(q);
            });
            renderTable(filtered);
          }).catch(()=> renderTable());
        }
      });
    }

    // Handle form submit for create/update
    if(form){
      form.addEventListener('submit', function(e){
        e.preventDefault();
        const id = fldId.value && String(fldId.value).trim();
        const name = fldName.value.trim();
        const email = fldEmail.value.trim();
        const password = fldPassword.value;
        const confirm = fldConfirm.value;
        const status = fldStatus.value;

        // Basic validation: name and email required
        if(!name || !email){
          alert('Nome e email são obrigatórios.');
          return;
        }

        // If creating, require password
        if(!id){
          if(!password){ alert('Senha é obrigatória ao criar usuário.'); return; }
          if(password !== confirm){ alert('Senhas não conferem.'); return; }
        } else {
          // editing: if password provided, ensure confirm matches
          if(password && password !== confirm){ alert('Senhas não conferem.'); return; }
        }

        const payload = { name, email, status };
        if(password) payload.password = password; 

        if(!id){
          createUser(payload).then(()=>{
            renderTable();
            closeModal();
          }).catch(err=>{ alert('Erro ao criar usuário: '+err.message); });
        } else {
          updateUser(id, payload).then(()=>{
            renderTable();
            closeModal();
          }).catch(err=>{ alert('Erro ao atualizar usuário: '+err.message); });
        }
      });
    }

    // Delegate edit/delete buttons
    if(tbody){
      tbody.addEventListener('click', function(e){
        const editBtn = e.target.closest('.edit-btn');
        const delBtn = e.target.closest('.delete-btn');
        if(editBtn){
          const id = editBtn.dataset.id;
          const users = loadMock();
          const user = users.find(u=>u.id === id);
          if(user) openModal('edit', user);
          else alert('Usuário não encontrado');
          return;
        }
        if(delBtn){
          const id = delBtn.dataset.id;
          if(confirm('Deseja realmente deletar este usuário?')){
            deleteUser(id).then(()=>{
              renderTable();
            }).catch(err=> alert('Erro ao deletar: '+err.message));
          }
          return;
        }
      });
    }

    // initial render
    renderTable();

  });
