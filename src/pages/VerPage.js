import { supabase } from '../supabaseClient.js';
import { state } from '../state/appState.js';
import { stBadge, trunc } from '../components/StatusBadge.js';
import { openModal } from '../layouts/AppShell.js';

export function renderVerPage(container) {
  container.innerHTML = `
    <div class="view-controls">
      <div class="view-left">
        <div class="view-toggle">
          <button class="vt-btn ${state.viewMode === 'table' ? 'active' : ''}" id="vt-table" data-mode="table">Tabela</button>
          <button class="vt-btn ${state.viewMode === 'cards' ? 'active' : ''}" id="vt-cards" data-mode="cards">Cards</button>
        </div>
        <select class="fsel" id="f-data">
          <option value="">Todas as datas</option>
        </select>
        <select class="fsel" id="f-dir">
          <option value="">Todas as diretorias</option>
          ${state.diretorias.map((d) => `<option>${d.nome}</option>`).join('')}
        </select>
        <select class="fsel" id="f-atv">
          <option value="">Todas as atividades</option>
          ${state.atividades.map((a) => `<option>${a.nome}</option>`).join('')}
        </select>
      </div>
      <button class="btn btn-ghost btn-sm" id="btn-atualizar-view">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/></svg>
        Atualizar
      </button>
    </div>
    <div id="view-output"></div>`;

  document.getElementById('vt-table').addEventListener('click', () => setViewMode('table'));
  document.getElementById('vt-cards').addEventListener('click', () => setViewMode('cards'));
  document.getElementById('f-data').addEventListener('change', loadView);
  document.getElementById('f-dir').addEventListener('change', loadView);
  document.getElementById('f-atv').addEventListener('change', loadView);
  document.getElementById('btn-atualizar-view').addEventListener('click', loadView);

  document.getElementById('view-output').addEventListener('click', (e) => {
    const row = e.target.closest('[data-open-idx]');
    if (row) openViewModal(parseInt(row.dataset.openIdx, 10));
  });

  loadView();
}

function setViewMode(mode) {
  state.viewMode = mode;
  document.getElementById('vt-table').classList.toggle('active', mode === 'table');
  document.getElementById('vt-cards').classList.toggle('active', mode === 'cards');
  loadView();
}

async function loadView() {
  const out = document.getElementById('view-output');
  out.innerHTML = '<div class="loading"><div class="spinner"></div>Carregando...</div>';
  const dataF = document.getElementById('f-data').value;
  const dirF = document.getElementById('f-dir').value;
  const atvF = document.getElementById('f-atv').value;
  try {
    let q = supabase.from('handovers').select('*').order('created_at', { ascending: false }).limit(300);
    if (dataF) q = q.eq('data_handover', dataF);
    if (atvF) q = q.eq('atividade', atvF);
    const { data, error } = await q;
    if (error) throw error;
    const filtered = dirF ? data.filter((h) => h.diretoria && h.diretoria.includes(dirF)) : data;
    populateDateFilter(data);
    state.viewData = filtered;
    if (state.viewMode === 'table') renderViewTable(filtered);
    else renderViewCards(filtered);
  } catch (e) {
    out.innerHTML = `<div class="empty"><p style="color:var(--red);font-weight:600;">❌ Erro: ${e.message}</p></div>`;
  }
}

function populateDateFilter(data) {
  const sel = document.getElementById('f-data');
  const current = sel.value;
  const dates = [...new Set(data.map((h) => h.data_handover))].sort().reverse();
  sel.innerHTML =
    '<option value="">Todas as datas</option>' + dates.map((d) => `<option ${d === current ? 'selected' : ''}>${d}</option>`).join('');
}

function renderViewTable(data) {
  const out = document.getElementById('view-output');
  if (!data.length) {
    out.innerHTML = '<div class="empty"><div class="empty-icon">📋</div><p>Nenhum registro encontrado.</p></div>';
    return;
  }
  const rows = data
    .map(
      (h, i) => `
    <tr>
      <td>${h.data_handover || '—'}</td>
      <td class="td-main">${h.usuario || '—'}</td>
      <td class="td-main">${h.atividade || '—'}</td>
      <td>${h.diretoria ? h.diretoria.split(',').map((d) => `<span class="badge b-blue" style="margin:1px">${d.trim()}</span>`).join('') : '—'}</td>
      <td>${h.equipe || '—'}</td>
      <td>${stBadge(h.status)}</td>
      <td class="td-trunc">${h.pendente || '—'} <button class="btn btn-ghost btn-sm" style="padding:2px 7px;font-size:11px;" data-open-idx="${i}">ver</button></td>
    </tr>`
    )
    .join('');
  out.innerHTML = `
    <div class="table-wrap">
      <table>
        <thead><tr><th>Data</th><th>Usuário</th><th>Atividade</th><th>Diretoria</th><th>Equipe</th><th>Status</th><th>Pendente</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

function renderViewCards(data) {
  const out = document.getElementById('view-output');
  if (!data.length) {
    out.innerHTML = '<div class="empty"><div class="empty-icon">📋</div><p>Nenhum registro encontrado.</p></div>';
    return;
  }
  out.innerHTML = `<div class="cards-grid">${data
    .map(
      (h, i) => `
      <div class="view-card" data-open-idx="${i}">
        <div class="vc-header">
          <div>
            <div class="vc-name">${h.atividade}</div>
            <div class="vc-meta">${h.usuario} · ${h.data_handover}</div>
          </div>
          ${stBadge(h.status)}
        </div>
        <div class="vc-tags">
          ${h.diretoria ? h.diretoria.split(',').map((d) => `<span class="badge b-blue">${d.trim()}</span>`).join('') : ''}
          ${h.equipe ? `<span class="badge b-gray">${h.equipe}</span>` : ''}
        </div>
        ${h.executado ? `<div class="vc-section"><div class="vc-label">✅ Executado</div><div class="vc-text">${trunc(h.executado, 90)}</div></div>` : ''}
        ${h.pendente ? `<hr class="vcd"><div class="vc-section"><div class="vc-label">⏳ Pendente</div><div class="vc-text">${trunc(h.pendente, 90)}</div></div>` : ''}
        ${h.impedimento ? `<hr class="vcd"><div class="vc-section"><div class="vc-label">🚨 Impedimento</div><div class="vc-text">${trunc(h.impedimento, 70)}</div></div>` : ''}
      </div>`
    )
    .join('')}</div>`;
}

function openViewModal(idx) {
  const h = state.viewData[idx];
  if (!h) return;
  openModal(`
    <div class="modal-header">
      <div>
        <div class="modal-title">${h.atividade}</div>
        <div style="font-size:12px;color:var(--text3);margin-top:4px;font-weight:500">${h.usuario} · ${h.data_handover}</div>
      </div>
      <button class="modal-close" id="modal-close-btn">×</button>
    </div>
    <div class="modal-tags">
      ${h.diretoria ? h.diretoria.split(',').map((d) => `<span class="badge b-blue">${d.trim()}</span>`).join('') : ''}
      ${h.equipe ? `<span class="badge b-gray">${h.equipe}</span>` : ''}
      ${stBadge(h.status)}
    </div>
    <hr class="md">
    ${msec('✅ O que foi executado', h.executado)}
    ${h.pessoas_pendentes ? msec('👥 Pessoas com pendências', h.pessoas_pendentes) : ''}
    ${msec('⏳ O que ficou pendente', h.pendente)}
    ${msec('🚨 Impedimentos', h.impedimento)}
    ${msec('💬 Observações', h.obs)}`);
  document.getElementById('modal-close-btn')?.addEventListener('click', () => {
    document.getElementById('modal').classList.remove('open');
  });
}

function msec(label, text) {
  if (!text) return '';
  return `<div class="msec"><div class="msec-label">${label}</div><div class="msec-text">${text}</div></div>`;
}
