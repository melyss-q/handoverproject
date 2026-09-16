// Lista de caixinhas de marcar reutilizável — usada tanto para escolher
// "quem vê essa atividade" (pessoas) quanto "quais diretorias essa pessoa
// vê" (diretorias). Substitui o antigo <select multiple> nativo (que
// exigia Ctrl+clique e confundia o pessoal).
export function renderCheckboxList(items, selectedIds, opts = {}) {
  const { name = 'chk', columns = 2, emptyLabel = 'Nada cadastrado ainda.' } = opts;
  if (!items.length) {
    return `<div class="empty" style="padding:.75rem;"><p style="font-size:12px;">${emptyLabel}</p></div>`;
  }
  return `<div class="checkbox-list" style="display:grid;grid-template-columns:repeat(${columns}, minmax(140px, 1fr));gap:4px;">
    ${items
      .map(
        (it) => `
      <label class="checkbox-list-item" style="display:flex;align-items:center;gap:7px;font-size:13px;font-weight:500;padding:6px 8px;border-radius:6px;cursor:pointer;">
        <input type="checkbox" data-name="${name}" value="${it.id}" ${selectedIds.includes(it.id) ? 'checked' : ''}>
        ${it.label}
      </label>`
      )
      .join('')}
  </div>`;
}

// Lê de volta os valores marcados dentro de um container (chamado no clique de "Salvar").
export function getCheckedValues(container, name) {
  return Array.from(container.querySelectorAll(`input[data-name="${name}"]:checked`)).map((el) => el.value);
}
