import { diretoriasVisiveisParaMim } from '../state/appState.js';
import { badgeFor, classeFor } from './StatusBadge.js';
import { renderMultiSelect, updateMultiSelect, installMultiSelectDelegation } from './MultiSelect.js';

installMultiSelectDelegation();

function nomesDiretorias(diretorias) {
  return diretorias.map((d) => d.nome);
}

function equipesDeDiretorias(diretorias, nomesSelecionados) {
  return diretorias
    .filter((d) => nomesSelecionados.includes(d.nome))
    .flatMap((d) => (d.equipes || []).map((e) => e.nome));
}

// atividade = { id, nome, tipo } vindo de state.atividades (banco). O card
// não guarda mais estado próprio de expandir/colapsar — fica sempre aberto
// (pedido da Melyssa: cards não devem exigir clique pra ver o conteúdo).
export function renderActivityCard(atividade, dados, onFieldChange) {
  const sid = atividade.id;
  // "dados" deve ser a MESMA referência de objeto guardada em
  // state.formData[atividade.id] (nunca uma cópia) — os callbacks abaixo
  // mutam esse objeto diretamente, como fazia o app original.
  const d = dados;
  const st = d.status || 'Não iniciada';
  const execReadonly = st === 'Concluído' ? 'readonly' : '';
  const execVal = d.executado || (st === 'Concluído' ? 'Atividade concluída.' : '');
  const pendVisible = st === 'Com pendência' ? 'visible' : '';
  const selDirs = d.diretorias || [];
  const selEquipes = d.equipes || [];
  const diretorias = diretoriasVisiveisParaMim();
  const equipesDisp = equipesDeDiretorias(diretorias, selDirs);

  const msDirId = `ms_dir_${sid}`;
  const msEqId = `ms_eq_${sid}`;
  const dirHtml = renderMultiSelect(msDirId, nomesDiretorias(diretorias), selDirs, (vals) => {
    const filtradas = refreshEquipeOptions(sid, vals, d.equipes || []);
    onFieldChange(atividade.id, 'diretorias', vals);
    onFieldChange(atividade.id, 'equipes', filtradas);
  });
  const eqHtml = renderMultiSelect(msEqId, equipesDisp, selEquipes, (vals) => {
    onFieldChange(atividade.id, 'equipes', vals);
  });

  return `
  <div class="ativ-card ${classeFor(st)}" id="card-${sid}" data-ativ-id="${sid}">
    <div class="ativ-header">
      <div class="ativ-name">${escapeHtml(atividade.nome)}</div>
      ${badgeFor(st)}
    </div>
    <div class="ativ-body">
      <div class="ativ-form">

        <div class="fg">
          <label>Status *</label>
          <div class="status-sel">
            <div class="status-opt">
              <input type="radio" name="st_${sid}" id="st_c_${sid}" value="Concluído" ${st === 'Concluído' ? 'checked' : ''} data-action="status-change">
              <label for="st_c_${sid}" class="lc">✅ Concluído</label>
            </div>
            <div class="status-opt">
              <input type="radio" name="st_${sid}" id="st_p_${sid}" value="Com pendência" ${st === 'Com pendência' ? 'checked' : ''} data-action="status-change">
              <label for="st_p_${sid}" class="la">⏳ Com pendência</label>
            </div>
            <div class="status-opt">
              <input type="radio" name="st_${sid}" id="st_b_${sid}" value="Bloqueado" ${st === 'Bloqueado' ? 'checked' : ''} data-action="status-change">
              <label for="st_b_${sid}" class="lb">🚨 Bloqueado</label>
            </div>
          </div>
        </div>

        <div class="fg-row">
          <div class="fg">
            <label>Diretoria</label>
            ${dirHtml}
          </div>
          <div class="fg" id="fg_eq_${sid}">
            <label>Equipe</label>
            ${eqHtml}
          </div>
        </div>

        <div class="fg">
          <label>✅ O que foi executado</label>
          <textarea data-field="executado" ${execReadonly} placeholder="Descreva o que foi feito...">${escapeHtml(execVal)}</textarea>
        </div>

        <div class="fg fg-pendentes ${pendVisible}" id="fg_pend_${sid}">
          <label>👥 Pessoas com pendências</label>
          <input type="text" data-field="pessoasPendentes" value="${escapeAttr(d.pessoasPendentes || '')}" placeholder="Ex: João Silva, Maria Oliveira...">
        </div>

        <div class="fg-row">
          <div class="fg">
            <label>⏳ O que ficou pendente</label>
            <textarea data-field="pendente" placeholder="Liste o que precisa ser retomado...">${escapeHtml(d.pendente || '')}</textarea>
          </div>
          <div class="fg">
            <label>🚨 Impedimentos</label>
            <textarea data-field="impedimento" placeholder="Riscos ou bloqueios...">${escapeHtml(d.impedimento || '')}</textarea>
          </div>
        </div>

        <div class="fg">
          <label>💬 Observações</label>
          <textarea data-field="obs" placeholder="Contexto adicional...">${escapeHtml(d.obs || '')}</textarea>
        </div>

      </div>
    </div>
  </div>`;
}

export function updateCardStatusUI(sid, status) {
  const card = document.getElementById('card-' + sid);
  if (!card) return;
  card.className = card.className.replace(/status-\S+/g, '').trim();
  card.classList.add(classeFor(status));
  const header = card.querySelector('.ativ-header');
  const oldBadge = header?.querySelector('.badge');
  if (oldBadge) oldBadge.outerHTML = badgeFor(status);
}

// Ao trocar a diretoria selecionada, atualiza as opções do multiselect de
// equipe (mantendo só equipes válidas para as diretorias marcadas).
export function refreshEquipeOptions(sid, diretoriasSelecionadas, equipesSelecionadasAtuais) {
  const diretorias = diretoriasVisiveisParaMim();
  const equipesValidas = equipesDeDiretorias(diretorias, diretoriasSelecionadas);
  const equipesFiltradas = equipesSelecionadasAtuais.filter((e) => equipesValidas.includes(e));
  updateMultiSelect(`ms_eq_${sid}`, equipesValidas, equipesFiltradas);
  return equipesFiltradas;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function escapeAttr(s) {
  return escapeHtml(s);
}
