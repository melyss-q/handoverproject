import { state, atividadesVisiveisParaMim } from '../state/appState.js';
import { renderActivityCard, updateCardStatusUI } from '../components/ActivityCard.js';
import { supabase } from '../supabaseClient.js';

let delegationInstalled = false;

export function renderHandoverPage(container) {
  container.innerHTML = `
    <div class="date-banner">
      <div>
        <div class="date-big" id="date-big"></div>
        <div class="date-sub" id="date-sub"></div>
      </div>
      <div class="date-progress">
        <div class="progress-label" id="progress-label">0 atividades preenchidas</div>
        <div class="progress-bar"><div class="progress-fill" id="progress-fill" style="width:0%"></div></div>
      </div>
    </div>

    <div class="section-title">Atividades diárias</div>
    <div class="atividades-grid" id="grid-diarias"></div>

    <div class="section-title">Atividades pontuais</div>
    <div class="atividades-grid" id="grid-pontuais"></div>

    <div style="margin-top:1.5rem;display:flex;gap:10px;align-items:center;">
      <button class="btn btn-primary" id="btn-salvar-tudo">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        Salvar handover completo
      </button>
      <span id="msg-global" style="font-size:13px;display:none;font-weight:600;"></span>
    </div>`;

  setDateDisplay();
  renderGrids();
  updateProgress();
  installDelegation(container);

  document.getElementById('btn-salvar-tudo').addEventListener('click', salvarTudo);
}

function setDateDisplay() {
  const now = new Date();
  const opts = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
  const str = now.toLocaleDateString('pt-BR', opts);
  const cap = str.charAt(0).toUpperCase() + str.slice(1);
  document.getElementById('date-big').textContent = cap;
  document.getElementById('date-sub').textContent =
    'Handover em andamento · ' + now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

// ===================== ATIVIDADES / VISIBILIDADE =====================
// As atividades (diárias e pontuais) agora vêm do banco (state.atividades)
// e são filtradas por quem pode vê-las via atividadesVisiveisParaMim —
// mesma convenção usada pelas diretorias: sem restrição cadastrada = todo
// mundo vê.
function todasAtividadesVisiveis() {
  return [...atividadesVisiveisParaMim('diaria'), ...atividadesVisiveisParaMim('pontual')];
}

function ensureFormEntry(atividadeId) {
  if (!state.formData[atividadeId]) state.formData[atividadeId] = {};
  return state.formData[atividadeId];
}

function onFieldChange(atividadeId, field, value) {
  const entry = ensureFormEntry(atividadeId);
  entry[field] = value;
  updateProgress();
}

export function renderGrids() {
  const diarias = atividadesVisiveisParaMim('diaria');
  const gridD = document.getElementById('grid-diarias');
  gridD.innerHTML = diarias.length
    ? diarias.map((a) => renderActivityCard(a, ensureFormEntry(a.id), onFieldChange)).join('')
    : '<div class="empty-inline">Nenhuma atividade diária atribuída a você.</div>';

  const pontuais = atividadesVisiveisParaMim('pontual');
  const gridP = document.getElementById('grid-pontuais');
  gridP.innerHTML = pontuais.length
    ? pontuais.map((a) => renderActivityCard(a, ensureFormEntry(a.id), onFieldChange)).join('')
    : '<div class="empty-inline">Nenhuma atividade pontual atribuída a você.</div>';
}

function updateProgress() {
  const all = todasAtividadesVisiveis();
  const done = all.filter((a) => state.formData[a.id]?.status && state.formData[a.id].status !== 'Não iniciada').length;
  const pct = all.length ? Math.round((done / all.length) * 100) : 0;
  const fill = document.getElementById('progress-fill');
  const label = document.getElementById('progress-label');
  if (fill) fill.style.width = pct + '%';
  if (label) label.textContent = `${done} de ${all.length} atividades preenchidas`;
}

function installDelegation(container) {
  if (delegationInstalled) return;
  delegationInstalled = true;

  container.addEventListener('change', (e) => {
    if (!e.target.matches('[data-action="status-change"]')) return;
    const card = e.target.closest('.ativ-card');
    const ativId = card.dataset.ativId;
    const newStatus = e.target.value;
    const entry = ensureFormEntry(ativId);
    entry.status = newStatus;

    const textarea = card.querySelector('textarea[data-field="executado"]');
    if (textarea) {
      if (newStatus === 'Concluído') {
        textarea.setAttribute('readonly', '');
        if (!textarea.value) textarea.value = 'Atividade concluída.';
        entry.executado = textarea.value;
      } else {
        textarea.removeAttribute('readonly');
      }
    }

    const fgPend = card.querySelector('.fg-pendentes');
    if (fgPend) fgPend.classList.toggle('visible', newStatus === 'Com pendência');

    updateCardStatusUI(ativId, newStatus);
    updateProgress();
  });

  container.addEventListener('input', (e) => {
    if (!e.target.matches('[data-field]')) return;
    const card = e.target.closest('.ativ-card');
    if (!card) return;
    const ativId = card.dataset.ativId;
    const field = e.target.dataset.field;
    const entry = ensureFormEntry(ativId);
    entry[field] = e.target.value;
  });
}

// ===================== SALVAR =====================
async function salvarTudo() {
  const profile = state.profile;
  const btn = document.getElementById('btn-salvar-tudo');
  btn.disabled = true;
  btn.textContent = 'Salvando...';
  const hoje = new Date().toISOString().split('T')[0];
  const all = todasAtividadesVisiveis();
  const rows = all.map((a) => ({
    data_handover: hoje,
    usuario_id: profile.id,
    usuario: profile.nome,
    atividade: a.nome,
    tipo: a.tipo === 'diaria' ? 'Diária' : 'Pontual',
    diretoria: (state.formData[a.id]?.diretorias || []).join(', ') || null,
    equipe: (state.formData[a.id]?.equipes || []).join(', ') || null,
    status: state.formData[a.id]?.status || 'Não iniciada',
    executado: state.formData[a.id]?.executado || null,
    pendente: state.formData[a.id]?.pendente || null,
    pessoas_pendentes: state.formData[a.id]?.pessoasPendentes || null,
    impedimento: state.formData[a.id]?.impedimento || null,
    obs: state.formData[a.id]?.obs || null,
  }));
  try {
    await supabase.from('handovers').delete().eq('data_handover', hoje).eq('usuario_id', profile.id);
    const { error } = await supabase.from('handovers').insert(rows);
    if (error) throw error;
    showMsgGlobal('✓ Handover salvo com sucesso!', 'ok');
  } catch (e) {
    showMsgGlobal('❌ Erro: ' + e.message, 'err');
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14"><polyline points="20 6 9 17 4 12"/></svg> Salvar handover completo`;
  }
}

function showMsgGlobal(txt, type) {
  const el = document.getElementById('msg-global');
  el.textContent = txt;
  el.style.display = 'inline';
  el.style.color = type === 'ok' ? 'var(--green)' : 'var(--red)';
  setTimeout(() => (el.style.display = 'none'), 6000);
}
