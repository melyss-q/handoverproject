// Chrome persistente da aplicação autenticada: header, avatar do usuário,
// abas principais e os 4 painéis de conteúdo + modal de detalhes.
// Renderizado uma única vez; a troca de aba é feita pelo router alternando
// a classe "active" nos elementos já existentes (sem recriar o DOM).
const TABS = [
  { id: 'handover', label: '📋 Registrar handover' },
  { id: 'view', label: '👁️ Ver handovers' },
  { id: 'notas', label: '📝 Minhas notas' },
  { id: 'config', label: '⚙️ Configurar' },
];

export function mountAppShell({ onTab, onTrocar, onSair }) {
  const root = document.getElementById('app');
  root.innerHTML = `
    <header>
      <div class="logo">
        <img src="/LOGO.png" class="logo-img" id="header-logo-img" alt="Logo">
        <span class="logo-badge">INTELIGÊNCIA COMERCIAL</span>
        <span class="logo-text">Handover Diário</span>
        <span class="logo-date" id="header-date"></span>
      </div>
      <div class="header-right">
        <div class="user-pill" id="user-pill">
          <div class="user-avatar" id="user-avatar"></div>
          <div>
            <div class="user-name" id="user-name-display"></div>
            <div class="user-turno" id="user-turno-display"></div>
          </div>
        </div>
        <button class="btn btn-ghost btn-sm" id="btn-trocar" title="Trocar usuário" style="gap:5px;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>
          Trocar
        </button>
        <button class="btn btn-ghost btn-sm" id="btn-sair" title="Sair" style="color:var(--red);border-color:var(--red-dim);">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          Sair
        </button>
        <button class="btn btn-ghost btn-sm" id="btn-config-gear" title="Configurações">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </button>
      </div>
    </header>

    <div class="main-tabs">
      ${TABS.map((t, i) => `<button class="main-tab ${i === 0 ? 'active' : ''}" id="tab-${t.id}" data-tab="${t.id}">${t.label}</button>`).join('')}
    </div>

    <main>
      <div class="panel active" id="panel-handover"></div>
      <div class="panel" id="panel-view"></div>
      <div class="panel" id="panel-notas"></div>
      <div class="panel" id="panel-config"></div>
    </main>

    <div class="modal-bg" id="modal">
      <div class="modal" id="modal-inner"></div>
    </div>`;

  document.getElementById('header-logo-img').addEventListener('error', (e) => {
    e.target.style.display = 'none';
  });

  document.querySelectorAll('.main-tab').forEach((btn) => {
    btn.addEventListener('click', () => onTab(btn.dataset.tab));
  });
  document.getElementById('btn-trocar').addEventListener('click', onTrocar);
  document.getElementById('btn-sair').addEventListener('click', onSair);
  document.getElementById('btn-config-gear').addEventListener('click', () => onTab('config'));

  document.getElementById('modal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal();
  });

  setDateDisplay();
}

export function setDateDisplay() {
  document.getElementById('header-date').textContent = new Date().toLocaleDateString('pt-BR');
}

export function updateHeaderUser(profile) {
  if (!profile) return;
  const avatar = document.getElementById('user-avatar');
  avatar.textContent = profile.iniciais;
  avatar.style.background = profile.cor + '22';
  avatar.style.color = profile.cor;
  document.getElementById('user-name-display').textContent = profile.nome;
  document.getElementById('user-turno-display').textContent = profile.turno || '—';
}

export function setActiveTab(tabId) {
  ['handover', 'view', 'notas', 'config'].forEach((t) => {
    document.getElementById('tab-' + t)?.classList.toggle('active', t === tabId);
    document.getElementById('panel-' + t)?.classList.toggle('active', t === tabId);
  });
}

export function openModal(html) {
  document.getElementById('modal-inner').innerHTML = html;
  document.getElementById('modal').classList.add('open');
}

export function closeModal() {
  document.getElementById('modal').classList.remove('open');
}
