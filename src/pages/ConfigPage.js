import { TURNOS, CARGOS, CORES_DISPONIVEIS } from '../data/config.js';
import { state, carregarDadosBase } from '../state/appState.js';
import {
  atualizarUsuario,
  criarDiretoria,
  renomearDiretoria,
  removerDiretoria,
  criarEquipe,
  renomearEquipe,
  removerEquipe,
  criarAtividade,
  renomearAtividade,
  removerAtividade,
  setUsuarioDiretorias,
  setAtividadeVisibilidade,
} from '../auth/authService.js';
import { updateHeaderUser } from '../layouts/AppShell.js';
import { renderCheckboxList, getCheckedValues } from '../components/CheckboxList.js';

let usuarioEditandoId = null;
let rootEl = null;

export async function renderConfigPage(container) {
  rootEl = container;
  const isAdmin = !!state.profile?.is_admin;

  if (!isAdmin) {
    container.innerHTML = `
      <div class="config-pw-card">
        <h3>🔒 Área restrita</h3>
        <p>Esta área é visível apenas para administradores da equipe. Se você precisa de acesso, fale com a administração.</p>
      </div>`;
    return;
  }

  container.innerHTML = `
    <div class="config-card">
      <div class="config-title">👥 Gestão da equipe</div>
      <div class="config-desc">
        Edite turno, cargo, cor, acesso de administrador e as diretorias que cada pessoa pode ver ao
        registrar um handover. Para <strong>adicionar uma pessoa nova</strong>, ainda é preciso criar
        o login dela no painel do Supabase (Authentication → Users) — por segurança, isso não pode
        ser feito por aqui.
      </div>
      <div id="usuarios-lista" style="display:flex;flex-direction:column;gap:8px;"></div>
    </div>

    <div class="config-card" style="margin-top:1.5rem;">
      <div class="config-title">🏢 Diretorias e equipes</div>
      <div class="config-desc">Crie, renomeie ou remova diretorias e as equipes dentro de cada uma.</div>
      <div id="diretorias-lista" style="display:flex;flex-direction:column;gap:12px;"></div>
      <div style="display:flex;gap:8px;margin-top:1rem;">
        <input type="text" id="nova-diretoria-input" placeholder="Nome da nova diretoria...">
        <button class="btn btn-primary btn-sm" id="btn-add-diretoria">+ Adicionar diretoria</button>
      </div>
      <div id="diretoria-msg" style="font-size:12px;font-weight:600;margin-top:8px;display:none;"></div>
    </div>

    <div class="config-card" style="margin-top:1.5rem;">
      <div class="config-title">🗂️ Atividades</div>
      <div class="config-desc">Crie, renomeie ou remova atividades diárias e pontuais, e escolha quem vê cada uma.</div>

      <div class="section-title" style="margin-top:0;">Diárias</div>
      <div id="lista-ativ-diarias" style="display:flex;flex-direction:column;gap:8px;margin-bottom:1.25rem;"></div>

      <div class="section-title">Pontuais</div>
      <div id="lista-ativ-pontuais" style="display:flex;flex-direction:column;gap:8px;margin-bottom:1rem;"></div>

      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
        <input type="text" id="nova-ativ-input" placeholder="Nome da nova atividade..." style="flex:1;min-width:180px;">
        <select id="nova-ativ-tipo">
          <option value="diaria">Diária</option>
          <option value="pontual">Pontual</option>
        </select>
        <button class="btn btn-primary btn-sm" id="btn-add-ativ">+ Adicionar</button>
      </div>
      <div id="ativ-msg" style="font-size:12px;font-weight:600;margin-top:8px;display:none;"></div>
    </div>`;

  document.getElementById('btn-add-diretoria').addEventListener('click', adicionarDiretoria);
  document.getElementById('btn-add-ativ').addEventListener('click', adicionarAtividade);

  renderUsuariosLista();
  renderDiretoriasLista();
  renderGestaoAtividades();
}

async function recarregarERenderizar() {
  await carregarDadosBase();
  renderUsuariosLista();
  renderDiretoriasLista();
  renderGestaoAtividades();
}

// ===================== GESTÃO DA EQUIPE =====================
function renderUsuariosLista() {
  const wrap = document.getElementById('usuarios-lista');
  if (!wrap) return;
  if (!state.usuarios.length) {
    wrap.innerHTML = '<div class="empty" style="padding:1.5rem;"><p>Nenhum usuário cadastrado ainda.</p></div>';
    return;
  }
  wrap.innerHTML = state.usuarios
    .map((u) => {
      const editando = usuarioEditandoId === u.id;
      return `
      <div class="usuario-row" style="flex-direction:column;align-items:stretch;">
        <div style="display:flex;align-items:center;gap:10px;">
          <div class="av" style="background:${u.cor}22;color:${u.cor}">${u.iniciais}</div>
          <div class="info" style="flex:1;">
            <strong>${u.nome}</strong>
            <span>${u.turno || 'Turno não definido'} · ${u.cargo || '—'}${u.is_admin ? ' · Admin' : ''}</span>
          </div>
          <div class="actions">
            <button class="icon-btn" title="Editar" data-edit-id="${u.id}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
          </div>
        </div>
        ${editando ? renderFormUsuario(u) : ''}
      </div>`;
    })
    .join('');

  wrap.querySelectorAll('[data-edit-id]').forEach((btn) => {
    btn.addEventListener('click', () => {
      usuarioEditandoId = usuarioEditandoId === btn.dataset.editId ? null : btn.dataset.editId;
      renderUsuariosLista();
    });
  });

  if (usuarioEditandoId) bindFormUsuario();
}

function renderFormUsuario(u) {
  const minhasDiretoriaIds = state.usuarioDiretorias.filter((r) => r.usuario_id === u.id).map((r) => r.diretoria_id);
  return `
    <div style="margin-top:10px;padding-top:10px;border-top:1.5px solid var(--border);">
      <div class="fg-row">
        <div class="fg">
          <label>Turno</label>
          <select id="fu-turno">
            <option value="">Não definido</option>
            ${TURNOS.map((t) => `<option ${t === u.turno ? 'selected' : ''}>${t}</option>`).join('')}
          </select>
        </div>
        <div class="fg">
          <label>Cargo</label>
          <select id="fu-cargo">
            ${CARGOS.map((c) => `<option value="${c}" ${c === u.cargo ? 'selected' : ''}>${c.charAt(0) + c.slice(1).toLowerCase()}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="fg" style="margin-top:.7rem;">
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer;">
          <input type="checkbox" id="fu-admin" ${u.is_admin ? 'checked' : ''} style="width:15px;height:15px;accent-color:var(--accent);">
          Acesso de administrador (vê e edita a aba Configurar)
        </label>
      </div>
      <div class="fg" style="margin-top:.7rem;">
        <label>Cor de identificação</label>
        <div id="fu-cores" style="display:flex;gap:8px;flex-wrap:wrap;">
          ${CORES_DISPONIVEIS.map((c) => `<div class="cor-opt ${c === u.cor ? 'selected' : ''}" style="background:${c}" data-cor="${c}"></div>`).join('')}
        </div>
      </div>
      <div class="fg" style="margin-top:.7rem;">
        <label>Diretorias que essa pessoa vê ao registrar handover</label>
        <div id="fu-diretorias">${renderCheckboxList(
          state.diretorias.map((d) => ({ id: d.id, label: d.nome })),
          minhasDiretoriaIds,
          { name: 'diretoria', columns: 2, emptyLabel: 'Nenhuma diretoria cadastrada ainda.' }
        )}</div>
        <div style="font-size:11px;color:var(--text3);margin-top:4px;">Se nenhuma for marcada, essa pessoa vê todas as diretorias.</div>
      </div>
      <div style="display:flex;gap:8px;margin-top:1rem;">
        <button class="btn btn-primary btn-sm" id="btn-salvar-usuario" data-id="${u.id}">Salvar</button>
        <button class="btn btn-ghost btn-sm" id="btn-cancelar-usuario">Cancelar</button>
      </div>
      <div id="fu-msg" style="font-size:12px;font-weight:600;margin-top:8px;display:none;"></div>
    </div>`;
}

function bindFormUsuario() {
  document.querySelectorAll('#fu-cores .cor-opt').forEach((el) => {
    el.addEventListener('click', () => {
      document.querySelectorAll('#fu-cores .cor-opt').forEach((c) => c.classList.remove('selected'));
      el.classList.add('selected');
    });
  });
  document.getElementById('btn-cancelar-usuario').addEventListener('click', () => {
    usuarioEditandoId = null;
    renderUsuariosLista();
  });
  document.getElementById('btn-salvar-usuario').addEventListener('click', async (e) => {
    const id = e.currentTarget.dataset.id;
    const turno = document.getElementById('fu-turno').value || null;
    const cargo = document.getElementById('fu-cargo').value;
    const isAdmin = document.getElementById('fu-admin').checked;
    const corEl = document.querySelector('#fu-cores .cor-opt.selected');
    const cor = corEl ? corEl.dataset.cor : CORES_DISPONIVEIS[0];
    const diretoriaIds = getCheckedValues(document.getElementById('fu-diretorias'), 'diretoria');
    const msg = document.getElementById('fu-msg');
    try {
      await atualizarUsuario(id, { turno, cargo, is_admin: isAdmin, cor });
      await setUsuarioDiretorias(id, diretoriaIds);
      if (state.profile && state.profile.id === id) {
        state.profile = { ...state.profile, turno, cargo, is_admin: isAdmin, cor };
        updateHeaderUser(state.profile);
      }
      usuarioEditandoId = null;
      await recarregarERenderizar();
    } catch (err) {
      msg.textContent = '❌ Erro: ' + err.message;
      msg.style.display = 'block';
      msg.style.color = 'var(--red)';
    }
  });
}

// ===================== DIRETORIAS E EQUIPES =====================
function renderDiretoriasLista() {
  const wrap = document.getElementById('diretorias-lista');
  if (!wrap) return;
  if (!state.diretorias.length) {
    wrap.innerHTML = '<div class="empty" style="padding:1rem;"><p style="font-size:13px;">Nenhuma diretoria cadastrada ainda.</p></div>';
    return;
  }
  wrap.innerHTML = state.diretorias
    .map(
      (d) => `
    <div class="usuario-row" style="flex-direction:column;align-items:stretch;">
      <div style="display:flex;align-items:center;gap:10px;">
        <strong style="flex:1;">${d.nome}</strong>
        <div class="actions">
          <button class="icon-btn" title="Renomear" data-rename-diretoria="${d.id}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="icon-btn danger" title="Remover" data-remove-diretoria="${d.id}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
          </button>
        </div>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;">
        ${d.equipes
          .map(
            (eq) => `
          <span class="ativ-chip" style="background:var(--surface3);color:var(--text2);gap:8px;">
            ${eq.nome}
            <span style="cursor:pointer;opacity:.6;" title="Renomear equipe" data-rename-equipe="${eq.id}">✎</span>
            <span style="cursor:pointer;opacity:.6;" title="Remover equipe" data-remove-equipe="${eq.id}">×</span>
          </span>`
          )
          .join('')}
      </div>
      <div style="display:flex;gap:6px;margin-top:8px;">
        <input type="text" data-nova-equipe="${d.id}" placeholder="Nova equipe em ${d.nome}..." style="flex:1;font-size:12px;padding:6px 10px;">
        <button class="btn btn-ghost btn-sm" data-add-equipe="${d.id}">+ Equipe</button>
      </div>
    </div>`
    )
    .join('');

  wrap.querySelectorAll('[data-rename-diretoria]').forEach((btn) => {
    btn.addEventListener('click', () => renomearDiretoriaPrompt(btn.dataset.renameDiretoria));
  });
  wrap.querySelectorAll('[data-remove-diretoria]').forEach((btn) => {
    btn.addEventListener('click', () => removerDiretoriaConfirm(btn.dataset.removeDiretoria));
  });
  wrap.querySelectorAll('[data-rename-equipe]').forEach((btn) => {
    btn.addEventListener('click', () => renomearEquipePrompt(btn.dataset.renameEquipe));
  });
  wrap.querySelectorAll('[data-remove-equipe]').forEach((btn) => {
    btn.addEventListener('click', () => removerEquipeConfirm(btn.dataset.removeEquipe));
  });
  wrap.querySelectorAll('[data-add-equipe]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const diretoriaId = btn.dataset.addEquipe;
      const input = wrap.querySelector(`[data-nova-equipe="${diretoriaId}"]`);
      adicionarEquipe(diretoriaId, input);
    });
  });
}

async function adicionarDiretoria() {
  const input = document.getElementById('nova-diretoria-input');
  const msg = document.getElementById('diretoria-msg');
  const nome = input.value.trim().toUpperCase();
  if (!nome) return showMsgEl(msg, '⚠️ Digite um nome para a diretoria.', 'err');
  if (state.diretorias.some((d) => d.nome === nome)) return showMsgEl(msg, '⚠️ Já existe uma diretoria com esse nome.', 'err');
  try {
    await criarDiretoria(nome);
    input.value = '';
    await recarregarERenderizar();
  } catch (e) {
    showMsgEl(msg, '❌ Erro: ' + e.message, 'err');
  }
}

async function renomearDiretoriaPrompt(id) {
  const atual = state.diretorias.find((d) => d.id === id);
  if (!atual) return;
  const novo = prompt('Novo nome da diretoria:', atual.nome);
  if (!novo || !novo.trim() || novo.trim() === atual.nome) return;
  try {
    await renomearDiretoria(id, novo.trim().toUpperCase());
    await recarregarERenderizar();
  } catch (e) {
    alert('Erro ao renomear: ' + e.message);
  }
}

async function removerDiretoriaConfirm(id) {
  const atual = state.diretorias.find((d) => d.id === id);
  if (!atual) return;
  if (!confirm(`Remover a diretoria "${atual.nome}" e todas as suas equipes? Handovers já salvos não são afetados.`)) return;
  try {
    await removerDiretoria(id);
    await recarregarERenderizar();
  } catch (e) {
    alert('Erro ao remover: ' + e.message);
  }
}

async function adicionarEquipe(diretoriaId, input) {
  const nome = input.value.trim().toUpperCase();
  if (!nome) return;
  try {
    await criarEquipe(diretoriaId, nome);
    input.value = '';
    await recarregarERenderizar();
  } catch (e) {
    alert('Erro ao adicionar equipe: ' + e.message);
  }
}

async function renomearEquipePrompt(id) {
  const todasEquipes = state.diretorias.flatMap((d) => d.equipes);
  const atual = todasEquipes.find((e) => e.id === id);
  if (!atual) return;
  const novo = prompt('Novo nome da equipe:', atual.nome);
  if (!novo || !novo.trim() || novo.trim() === atual.nome) return;
  try {
    await renomearEquipe(id, novo.trim().toUpperCase());
    await recarregarERenderizar();
  } catch (e) {
    alert('Erro ao renomear: ' + e.message);
  }
}

async function removerEquipeConfirm(id) {
  if (!confirm('Remover essa equipe? Handovers já salvos não são afetados.')) return;
  try {
    await removerEquipe(id);
    await recarregarERenderizar();
  } catch (e) {
    alert('Erro ao remover: ' + e.message);
  }
}

function showMsgEl(el, txt, type) {
  el.textContent = txt;
  el.style.display = 'block';
  el.style.color = type === 'ok' ? 'var(--green)' : 'var(--red)';
  setTimeout(() => (el.style.display = 'none'), 4000);
}

// ===================== ATIVIDADES =====================
function renderGestaoAtividades() {
  renderListaAtividades('diaria', 'lista-ativ-diarias');
  renderListaAtividades('pontual', 'lista-ativ-pontuais');
}

function renderListaAtividades(tipo, wrapId) {
  const wrap = document.getElementById(wrapId);
  if (!wrap) return;
  const atividades = state.atividades.filter((a) => a.tipo === tipo).sort((a, b) => a.ordem - b.ordem);
  if (!atividades.length) {
    wrap.innerHTML = `<div class="empty" style="padding:1rem;"><p style="font-size:13px;">Nenhuma atividade ${tipo === 'diaria' ? 'diária' : 'pontual'} cadastrada.</p></div>`;
    return;
  }
  wrap.innerHTML = atividades
    .map((a) => {
      const vistoPor = state.atividadeVisibilidade.filter((v) => v.atividade_id === a.id).map((v) => v.usuario_id);
      return `
      <div class="ativ-pontual-row" style="flex-direction:column;align-items:flex-start;gap:8px;">
        <div style="display:flex;width:100%;align-items:center;justify-content:space-between;">
          <span style="font-weight:600;">${a.nome}</span>
          <div style="display:flex;gap:6px;">
            <button class="icon-btn" title="Renomear" data-rename-ativ="${a.id}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="icon-btn danger" title="Remover" data-remove-ativ="${a.id}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
            </button>
          </div>
        </div>
        <div style="width:100%;">
          <label style="font-size:11px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.05em;display:block;margin-bottom:4px;">Visível para</label>
          <div data-visibilidade-ativ="${a.id}">${renderCheckboxList(
            state.usuarios.map((u) => ({ id: u.id, label: u.nome })),
            vistoPor,
            { name: 'pessoa', columns: 2 }
          )}</div>
          <div style="font-size:11px;color:var(--text3);margin-top:4px;">Se ninguém for marcado, todo mundo vê essa atividade.</div>
        </div>
      </div>`;
    })
    .join('');

  wrap.querySelectorAll('[data-rename-ativ]').forEach((btn) => {
    btn.addEventListener('click', () => renomearAtividadePrompt(btn.dataset.renameAtiv));
  });
  wrap.querySelectorAll('[data-remove-ativ]').forEach((btn) => {
    btn.addEventListener('click', () => removerAtividadeConfirm(btn.dataset.removeAtiv));
  });
  wrap.querySelectorAll('[data-visibilidade-ativ]').forEach((el) => {
    el.addEventListener('change', async () => {
      const atividadeId = el.dataset.visibilidadeAtiv;
      const usuarioIds = getCheckedValues(el, 'pessoa');
      try {
        await setAtividadeVisibilidade(atividadeId, usuarioIds);
        state.atividadeVisibilidade = state.atividadeVisibilidade.filter((v) => v.atividade_id !== atividadeId);
        usuarioIds.forEach((usuario_id) => state.atividadeVisibilidade.push({ atividade_id: atividadeId, usuario_id }));
      } catch (e) {
        alert('Erro ao salvar visibilidade: ' + e.message);
      }
    });
  });
}

function todasAtividadesNomes() {
  return state.atividades.map((a) => a.nome);
}

async function adicionarAtividade() {
  const input = document.getElementById('nova-ativ-input');
  const tipoSel = document.getElementById('nova-ativ-tipo');
  const msg = document.getElementById('ativ-msg');
  const nome = input.value.trim().toUpperCase();
  if (!nome) return showMsgEl(msg, '⚠️ Digite um nome para a atividade.', 'err');
  if (todasAtividadesNomes().includes(nome)) return showMsgEl(msg, '⚠️ Já existe uma atividade com esse nome.', 'err');
  const tipo = tipoSel.value;
  const ordemAtual = state.atividades.filter((a) => a.tipo === tipo).length;
  try {
    await criarAtividade(nome, tipo, ordemAtual + 1);
    input.value = '';
    await recarregarERenderizar();
    showMsgEl(document.getElementById('ativ-msg'), '✅ Atividade adicionada!', 'ok');
  } catch (e) {
    showMsgEl(msg, '❌ Erro: ' + e.message, 'err');
  }
}

async function renomearAtividadePrompt(id) {
  const atual = state.atividades.find((a) => a.id === id);
  if (!atual) return;
  const novo = prompt('Novo nome da atividade:', atual.nome);
  if (!novo || !novo.trim() || novo.trim() === atual.nome) return;
  const novoNome = novo.trim().toUpperCase();
  if (todasAtividadesNomes().includes(novoNome)) return alert('Já existe uma atividade com esse nome.');
  try {
    await renomearAtividade(id, novoNome);
    await recarregarERenderizar();
  } catch (e) {
    alert('Erro ao renomear: ' + e.message);
  }
}

async function removerAtividadeConfirm(id) {
  const atual = state.atividades.find((a) => a.id === id);
  if (!atual) return;
  if (!confirm(`Remover a atividade "${atual.nome}"? Handovers já salvos no banco não são afetados.`)) return;
  try {
    await removerAtividade(id);
    delete state.formData[atual.id];
    await recarregarERenderizar();
  } catch (e) {
    alert('Erro ao remover: ' + e.message);
  }
}
