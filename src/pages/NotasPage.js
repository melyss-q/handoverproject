import { state, carregarNotas, salvarNotas } from '../state/appState.js';
import { trunc } from '../components/StatusBadge.js';

let autoSaveTimer = null;

export function renderNotasPage(container) {
  carregarNotas();
  container.innerHTML = `
    <div class="notas-layout">
      <div class="notas-sidebar">
        <div class="notas-sidebar-header">
          <span class="notas-sidebar-title">📝 Notas</span>
          <button class="btn btn-primary btn-sm" id="btn-nova-nota">+ Nova</button>
        </div>
        <div class="notas-list" id="notas-list"></div>
      </div>
      <div class="notas-editor" id="notas-editor">
        <div class="nota-no-selection" id="nota-no-selection">
          <div class="icon">📝</div>
          <p>Selecione uma nota ou crie uma nova<br>para começar a escrever.</p>
          <button class="btn btn-primary btn-sm" id="btn-nova-nota-2">+ Nova nota</button>
        </div>
        <div id="nota-edit-area" style="display:none;flex:1;flex-direction:column;">
          <div class="notas-editor-header">
            <input class="nota-title-input" id="nota-title-input" type="text" placeholder="Título da nota...">
            <button class="btn btn-ghost btn-sm" id="btn-deletar-nota" title="Excluir nota" style="color:var(--red-light);border-color:var(--red-dim)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
            </button>
          </div>
          <div class="notas-editor-body">
            <textarea class="nota-textarea" id="nota-textarea" placeholder="Comece a escrever sua nota aqui...&#10;&#10;Use este espaço para registrar o que você acompanhou durante o dia, pontos de atenção, lembretes, etc."></textarea>
          </div>
          <div class="notas-editor-footer">
            <span class="nota-saved-label" id="nota-saved-label">💾 Salvo automaticamente</span>
            <span id="nota-char-count" style="font-size:11px;color:var(--text3);font-weight:500;"></span>
          </div>
        </div>
      </div>
    </div>`;

  document.getElementById('btn-nova-nota').addEventListener('click', novaNota);
  document.getElementById('btn-nova-nota-2').addEventListener('click', novaNota);
  document.getElementById('btn-deletar-nota').addEventListener('click', deletarNotaAtual);
  document.getElementById('nota-title-input').addEventListener('input', autoSaveNota);
  document.getElementById('nota-textarea').addEventListener('input', autoSaveNota);

  document.getElementById('notas-list').addEventListener('click', (e) => {
    const item = e.target.closest('[data-nota-id]');
    if (item) abrirNota(item.dataset.notaId);
  });

  renderNotasList();
}

function renderNotasList() {
  const list = document.getElementById('notas-list');
  if (!state.notas.length) {
    list.innerHTML = `<div class="notas-empty-sidebar">Nenhuma nota ainda.<br>Clique em "+ Nova" para começar.</div>`;
    return;
  }
  const sorted = [...state.notas].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  list.innerHTML = sorted
    .map((n) => {
      const isActive = state.notaAtual && state.notaAtual.id === n.id;
      const dateStr = new Date(n.updatedAt).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
      return `<div class="nota-item ${isActive ? 'active' : ''}" data-nota-id="${n.id}">
        <div class="nota-item-title">${n.titulo || 'Sem título'}</div>
        <div class="nota-item-date">${dateStr}</div>
        <div class="nota-item-preview">${trunc(n.conteudo, 60) || 'Nota em branco'}</div>
      </div>`;
    })
    .join('');
}

function novaNota() {
  const id = 'nota_' + Date.now();
  const agora = new Date().toISOString();
  const nova = { id, titulo: '', conteudo: '', updatedAt: agora, createdAt: agora };
  state.notas.unshift(nova);
  salvarNotas();
  abrirNota(id);
  renderNotasList();
}

function abrirNota(id) {
  const nota = state.notas.find((n) => n.id === id);
  if (!nota) return;
  state.notaAtual = nota;

  document.getElementById('nota-no-selection').style.display = 'none';
  const editArea = document.getElementById('nota-edit-area');
  editArea.style.display = 'flex';

  document.getElementById('nota-title-input').value = nota.titulo;
  document.getElementById('nota-textarea').value = nota.conteudo;
  atualizarCharCount();
  renderNotasList();
}

function autoSaveNota() {
  clearTimeout(autoSaveTimer);
  document.getElementById('nota-saved-label').textContent = '✏️ Editando...';
  autoSaveTimer = setTimeout(() => {
    if (!state.notaAtual) return;
    state.notaAtual.titulo = document.getElementById('nota-title-input').value;
    state.notaAtual.conteudo = document.getElementById('nota-textarea').value;
    state.notaAtual.updatedAt = new Date().toISOString();
    const idx = state.notas.findIndex((n) => n.id === state.notaAtual.id);
    if (idx >= 0) state.notas[idx] = state.notaAtual;
    salvarNotas();
    renderNotasList();
    document.getElementById('nota-saved-label').textContent = '💾 Salvo automaticamente';
    atualizarCharCount();
  }, 800);
}

function atualizarCharCount() {
  const val = document.getElementById('nota-textarea').value;
  const words = val.trim().split(/\s+/).filter(Boolean).length;
  document.getElementById('nota-char-count').textContent = val ? `${words} palavra${words !== 1 ? 's' : ''}` : '';
}

function deletarNotaAtual() {
  if (!state.notaAtual) return;
  if (!confirm('Excluir esta nota? Esta ação não pode ser desfeita.')) return;
  state.notas = state.notas.filter((n) => n.id !== state.notaAtual.id);
  salvarNotas();
  state.notaAtual = null;
  document.getElementById('nota-no-selection').style.display = 'flex';
  document.getElementById('nota-edit-area').style.display = 'none';
  renderNotasList();
}
