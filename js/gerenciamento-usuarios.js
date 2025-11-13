document.addEventListener('DOMContentLoaded', function(){
    
    const userRole = sessionStorage.getItem('currentUserRole');
    if (userRole !== 'admin') {
        alert('Acesso negado. Esta página é apenas para administradores.');
        window.location.href = 'inicio.html';
        return;
    }

    const localKey = 'usersDB';

    const openBtn = document.getElementById('openModal');
    const modal = document.getElementById('modal');
    const cancel = document.getElementById('cancel');
    const backdrop = document.getElementById('backdrop');
    const form = document.getElementById('userForm');
    const tbody = document.getElementById('usersTableBody');
    const searchInput = document.getElementById('searchInput');
    const modalTitle = document.getElementById('modalTitle');
    const submitBtn = document.getElementById('submitBtn');
    const userCount = document.getElementById('userCount');

    const fldId = document.getElementById('userId');
    const fldName = document.getElementById('fullName');
    const fldEmail = document.getElementById('email');
    const fldUsername = document.getElementById('username');
    const fldPassword = document.getElementById('password');
    const fldStatus = document.getElementById('status');

    function seedMock(){
      let users = JSON.parse(localStorage.getItem(localKey)) || [];
      if (!users.find(u => u.email === 'admin@admin.com')) {
        users.push({ 
          id: String(Date.now()).slice(-6),
          email: 'admin@admin.com', 
          senha: 'admin123', 
          nome: 'Admin Birthday', 
          usuario: 'admin', 
          role: 'admin',
          status: 'Admin',
          createdAt: new Date().toISOString().split('T')[0]
        });
        localStorage.setItem(localKey, JSON.stringify(users));
      }
      return users;
    }
    
    function loadMock(){
      return JSON.parse(localStorage.getItem(localKey)) || [];
    }
    
    function saveMock(data){
      localStorage.setItem(localKey, JSON.stringify(data));
    }

    async function getUsers(query = ''){
      const users = loadMock();
      const q = query.toLowerCase();
      const results = users.filter(u => 
        (u.nome && u.nome.toLowerCase().includes(q)) || 
        (u.email && u.email.toLowerCase().includes(q))
      );
      return Promise.resolve(results);
    }

    async function createUser(data){
      const users = loadMock();
      if (users.find(u => u.email === data.email)) {
        return Promise.reject(new Error('Este e-mail já está em uso.'));
      }
      
      const newUser = {
        id: String(Date.now()).slice(-6),
        email: data.email,
        senha: data.senha,
        nome: data.nome,
        usuario: data.usuario,
        role: data.status === 'Admin' ? 'admin' : 'user',
        status: data.status,
        createdAt: new Date().toISOString().split('T')[0]
      };

      users.push(newUser);
      saveMock(users);
      return Promise.resolve(newUser);
    }

    async function updateUser(email, data){
      let users = loadMock();
      const index = users.findIndex(u => u.email === email);
      if(index === -1) return Promise.reject(new Error('Utilizador não encontrado'));
      
      const user = users[index];
      user.nome = data.nome;
      user.usuario = data.usuario;
      user.status = data.status;
      user.role = data.status === 'Admin' ? 'admin' : 'user';
      if (data.senha) {
        user.senha = data.senha;
      }
      
      users[index] = user;
      saveMock(users);
      return Promise.resolve(users[index]);
    }

    async function deleteUser(email){
      let users = loadMock();
      if (email === 'admin@admin.com') {
        return Promise.reject(new Error('Não é possível deletar o utilizador admin principal.'));
      }
      users = users.filter(u => u.email !== email);
      saveMock(users);
      return Promise.resolve();
    }

    function renderTable(query = ''){
      if(!tbody) return;
      
      getUsers(query).then(users => {
        tbody.innerHTML = '';
        if(users.length === 0){
          tbody.innerHTML = '<tr><td colspan="6">Nenhum utilizador encontrado.</td></tr>';
          return;
        }
        users.forEach(user => {
          const status = user.status || 'Ativo';
          
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td>${user.id || 'N/A'}</td>
            <td>${user.nome || 'N/A'}</td>
            <td>${user.email || 'N/A'}</td>
            <td>
              <span class="status ${status}">${status}</span>
            </td>
            <td>${user.createdAt || 'N/A'}</td>
            <td class="actions">
              <button class="btn icon edit-btn" data-email="${user.email}">
                <i class="fa-solid fa-pencil"></i>
              </button>
              <button class="btn icon delete-btn" data-email="${user.email}">
                <i class="fa-solid fa-trash"></i>
              </button>
            </td>
          `;
          tbody.appendChild(tr);
        });
        
        userCount.textContent = `Mostrando ${users.length} de ${loadMock().length} utilizadores`;

      }).catch(err => {
        tbody.innerHTML = `<tr><td colspan="6">Erro ao carregar dados: ${err.message}</td></tr>`;
      });
    }

    function openModal(mode = 'create', user = null){
      if(!modal || !form) return;
      
      form.reset();
      fldId.value = '';
      fldEmail.readOnly = false;
      
      if(mode === 'create'){
        modalTitle.textContent = 'Cadastrar Novo Usuário';
        submitBtn.textContent = 'Cadastrar';
        fldPassword.placeholder = 'Senha (obrigatório)';
      } else if (mode === 'edit' && user){
        modalTitle.textContent = 'Editar Usuário';
        submitBtn.textContent = 'Salvar Alterações';
        fldPassword.placeholder = 'Deixe em branco para manter';
        
        fldId.value = user.id; 
        fldName.value = user.nome;
        fldEmail.value = user.email;
        fldEmail.readOnly = true; 
        fldUsername.value = user.usuario;
        fldStatus.value = user.status || 'Ativo';
      }
      
      modal.classList.remove('hidden');
    }

    function closeModal(){
      if(modal) modal.classList.add('hidden');
    }
    
    seedMock();
    renderTable();

    if(searchInput){
      searchInput.addEventListener('input', (e) => {
        renderTable(e.target.value);
      });
    }

    if(openBtn) openBtn.addEventListener('click', () => openModal('create'));
    if(cancel) cancel.addEventListener('click', closeModal);
    if(backdrop) backdrop.addEventListener('click', closeModal);

    if(form){
      form.addEventListener('submit', function(e){
        e.preventDefault();
        
        const id = fldId.value; 
        const email = fldEmail.value;
        const nome = fldName.value;
        const usuario = fldUsername.value;
        const senha = fldPassword.value;
        const status = fldStatus.value;

        if(!id){
          if(!senha){ alert('Senha é obrigatória para cadastro.'); return; }
        }
        
        const payload = { nome, email, usuario, status };
        if(senha) payload.senha = senha; 

        if(!id){
          createUser(payload).then(()=>{
            renderTable();
            closeModal();
          }).catch(err=>{ alert('Erro ao criar utilizador: '+err.message); });
        } else {
          updateUser(email, payload).then(()=>{
            renderTable();
            closeModal();
          }).catch(err=>{ alert('Erro ao atualizar utilizador: '+err.message); });
        }
      });
    }

    if(tbody){
      tbody.addEventListener('click', function(e){
        const editBtn = e.target.closest('.edit-btn');
        const delBtn = e.target.closest('.delete-btn');
        
        if(editBtn){
          const email = editBtn.dataset.email;
          const users = loadMock();
          const user = users.find(u=>u.email === email);
          if(user) openModal('edit', user);
          else alert('Utilizador não encontrado');
          return;
        }
        if(delBtn){
          const email = delBtn.dataset.email;
          if(confirm(`Deseja realmente deletar o utilizador ${email}?`)){
            deleteUser(email).then(()=>{
              renderTable();
            }).catch(err=> alert('Erro ao deletar utilizador: '+err.message));
          }
        }
      });
    }

    /* // --- CÓDIGO DA API REAL (Exemplos) ---
    
    async function getUsers(query = ''){
        const response = await fetch(`${API_BASE_URL}?search=${query}`);
        if(!response.ok) throw new Error('Falha ao buscar usuários');
        return await response.json();
    }

    async function createUser(data){
        const response = await fetch(API_BASE_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        if(!response.ok) throw new Error('Falha ao criar usuário');
        return await response.json();
    }

    async function updateUser(id, data){
        const response = await fetch(`${API_BASE_URL}/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        if(!response.ok) throw new Error('Falha ao atualizar usuário');
        return await response.json();
    }

    async function deleteUser(id){
        const response = await fetch(`${API_BASE_URL}/${id}`, {
          method: 'DELETE'
        });
        if(!response.ok) throw new Error('Falha ao deletar usuário');
        return Promise.resolve();
    }
    */
  });