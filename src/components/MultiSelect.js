// Componente "multi-select" com tags e dropdown de checkboxes, portado do
// app original. A versão original usava atributos onclick com o nome da
// atividade codificado em URI; aqui a mesma interação é feita por
// delegação de eventos (addEventListener) usando data-attributes, sem
// nenhum handler inline no HTML.
const REGISTRY = new Map(); // id -> { opcoes, selecionados, onChange }
let idCounter = 0;

export function nextMsId(prefix) {
  idCounter += 1;
  return `${prefix}_${idCounter}`;
}

export function renderMultiSelect(id, opcoes, selecionados, onChange) {
  REGISTRY.set(id, { opcoes: [...opcoes], selecionados: [...selecionados], onChange });
  return buildWrapHtml(id);
}

function buildWrapHtml(id) {
  const entry = REGISTRY.get(id);
  if (!entry) return '';
  const { opcoes, selecionados } = entry;
  const triggerContent = selecionados.length
    ? renderTags(selecionados)
    : `<span class="ms-trigger-text placeholder">Selecione...</span>`;
  const optsHtml = opcoes.length
    ? opcoes
        .map(
          (op, idx) => `
        <div class="ms-option ${selecionados.includes(op) ? 'selected' : ''}" data-ms-id="${id}" data-idx="${idx}">
          <div class="ms-checkbox"></div>${op}
        </div>`
        )
        .join('')
    : '<div class="ms-empty">Selecione uma diretoria primeiro</div>';

  return `
    <div class="ms-wrap" id="${id}_wrap">
      <div class="ms-trigger" id="${id}_trigger" tabindex="0" data-ms-trigger="${id}">
        <div id="${id}_display" style="flex:1;overflow:hidden">${triggerContent}</div>
        <span class="ms-arrow">▾</span>
      </div>
      <div class="ms-dropdown" id="${id}_drop">
        ${optsHtml}
      </div>
    </div>`;
}

function renderTags(vals) {
  return `<div class="ms-tags">${vals
    .map((v) => `<span class="ms-tag">${escapeHtml(v)}<span class="ms-tag-x" data-ms-remove="${escapeAttr(v)}">×</span></span>`)
    .join('')}</div>`;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function escapeAttr(s) {
  return escapeHtml(s);
}

// Re-renderiza um multiselect existente (ex: opções de equipe mudam quando
// a diretoria selecionada muda), preservando o registro em REGISTRY.
export function updateMultiSelect(id, novasOpcoes, novosSelecionados) {
  const entry = REGISTRY.get(id);
  if (!entry) return;
  entry.opcoes = [...novasOpcoes];
  entry.selecionados = [...novosSelecionados];
  const wrap = document.getElementById(id + '_wrap');
  if (wrap) wrap.outerHTML = buildWrapHtml(id);
}

function setSelected(id, vals) {
  const entry = REGISTRY.get(id);
  if (!entry) return;
  entry.selecionados = vals;
  const display = document.getElementById(id + '_display');
  if (display) {
    display.innerHTML = vals.length ? renderTags(vals) : `<span class="ms-trigger-text placeholder">Selecione...</span>`;
  }
  entry.onChange(vals);
}

function closeAllDropdowns() {
  document.querySelectorAll('.ms-dropdown.open').forEach((d) => d.classList.remove('open'));
  document.querySelectorAll('.ms-trigger.open').forEach((t) => t.classList.remove('open'));
}

// Delegação global instalada uma única vez.
let installed = false;
export function installMultiSelectDelegation() {
  if (installed) return;
  installed = true;

  document.addEventListener('click', (e) => {
    const removeEl = e.target.closest('[data-ms-remove]');
    const optionEl = e.target.closest('.ms-option');
    const triggerEl = e.target.closest('[data-ms-trigger]');

    if (removeEl) {
      e.stopPropagation();
      const wrap = removeEl.closest('.ms-wrap');
      const id = wrap ? wrap.id.replace(/_wrap$/, '') : null;
      const entry = id && REGISTRY.get(id);
      if (entry) {
        const val = removeEl.dataset.msRemove;
        const vals = entry.selecionados.filter((v) => v !== val);
        setSelected(id, vals);
        // Reflete a desmarcação no dropdown também
        const idx = entry.opcoes.indexOf(val);
        const opt = document.querySelector(`.ms-option[data-ms-id="${id}"][data-idx="${idx}"]`);
        if (opt) opt.classList.remove('selected');
      }
      return;
    }

    if (optionEl) {
      e.stopPropagation();
      const id = optionEl.dataset.msId;
      const idx = parseInt(optionEl.dataset.idx, 10);
      const entry = REGISTRY.get(id);
      if (!entry) return;
      const val = entry.opcoes[idx];
      optionEl.classList.toggle('selected');
      const vals = Array.from(document.querySelectorAll(`.ms-option[data-ms-id="${id}"].selected`)).map(
        (o) => entry.opcoes[parseInt(o.dataset.idx, 10)]
      );
      setSelected(id, vals);
      return;
    }

    if (triggerEl) {
      const id = triggerEl.dataset.msTrigger;
      const drop = document.getElementById(id + '_drop');
      const trig = document.getElementById(id + '_trigger');
      if (!drop || !trig) return;
      const isOpen = drop.classList.contains('open');
      closeAllDropdowns();
      if (!isOpen) {
        drop.classList.add('open');
        trig.classList.add('open');
      }
      return;
    }

    if (!e.target.closest('.ms-wrap')) {
      closeAllDropdowns();
    }
  });

  document.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.closest('[data-ms-trigger]')) {
      e.preventDefault();
      e.target.closest('[data-ms-trigger]').click();
    }
  });
}
