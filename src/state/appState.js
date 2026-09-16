import {
  fetchDiretoriasComEquipes,
  fetchAtividades,
  fetchTodosUsuarios,
  fetchUsuarioDiretorias,
  fetchAtividadeVisibilidade,
} from '../auth/authService.js';

// Estado compartilhado em memória, no estilo do app original — mutado
// diretamente pelos módulos e seguido de uma chamada explícita de render(),
// sem um framework reativo por trás.
export const state = {
  session: null, // sessão do Supabase Auth (null = deslogado)
  profile: null, // linha correspondente em public.usuarios
  currentView: 'handover', // 'handover' | 'view' | 'notas' | 'config'
  viewMode: 'table', // 'table' | 'cards' — aba "Ver handovers"
  formData: {}, // respostas do handover em edição, por atividade
  notas: [],
  notaAtual: null,
  viewData: [], // último resultado carregado em "Ver handovers" (p/ abrir modal)

  // Carregados do banco logo após o login (ver carregarDadosBase abaixo).
  diretorias: [], // [{ id, nome, equipes: [{ id, nome, diretoria_id }] }]
  atividades: [], // [{ id, nome, tipo: 'diaria'|'pontual', ordem }]
  usuarios: [], // todos os usuários — usado nos seletores de pessoas do admin
  usuarioDiretorias: [], // [{ usuario_id, diretoria_id }]
  atividadeVisibilidade: [], // [{ atividade_id, usuario_id }]
};

// Busca tudo que as telas precisam além do perfil: diretorias/equipes,
// atividades e os vínculos de escopo. Chamado uma vez no boot (main.js) e
// de novo sempre que algo muda em Configurar, pra manter tudo sincronizado.
export async function carregarDadosBase() {
  const [diretorias, atividades, usuarios, usuarioDiretorias, atividadeVisibilidade] = await Promise.all([
    fetchDiretoriasComEquipes(),
    fetchAtividades(),
    fetchTodosUsuarios(),
    fetchUsuarioDiretorias(),
    fetchAtividadeVisibilidade(),
  ]);
  state.diretorias = diretorias;
  state.atividades = atividades;
  state.usuarios = usuarios;
  state.usuarioDiretorias = usuarioDiretorias;
  state.atividadeVisibilidade = atividadeVisibilidade;
}

// Convenção usada em toda a aplicação: se uma pessoa (ou atividade) não
// tem NENHUMA linha de escopo, ela é tratada como "sem restrição" — vê
// tudo / é vista por todos. Isso evita travar gente nova antes do admin
// configurar o escopo dela.
export function diretoriasVisiveisParaMim() {
  if (!state.profile) return state.diretorias;
  const meusIds = state.usuarioDiretorias.filter((r) => r.usuario_id === state.profile.id).map((r) => r.diretoria_id);
  if (!meusIds.length) return state.diretorias;
  return state.diretorias.filter((d) => meusIds.includes(d.id));
}

export function atividadesVisiveisParaMim(tipo) {
  const porTipo = state.atividades.filter((a) => a.tipo === tipo).sort((a, b) => a.ordem - b.ordem);
  if (!state.profile || state.profile.is_admin) return porTipo;
  return porTipo.filter((a) => {
    const restritos = state.atividadeVisibilidade.filter((v) => v.atividade_id === a.id).map((v) => v.usuario_id);
    if (!restritos.length) return true;
    return restritos.includes(state.profile.id);
  });
}

// ===================== NOTAS (por navegador, por usuário) =====================
function notasKey() {
  return state.profile ? `hv_notas_${state.profile.id}` : null;
}

export function carregarNotas() {
  const key = notasKey();
  if (!key) {
    state.notas = [];
    return;
  }
  try {
    const raw = localStorage.getItem(key);
    state.notas = raw ? JSON.parse(raw) : [];
  } catch (e) {
    state.notas = [];
  }
}

export function salvarNotas() {
  const key = notasKey();
  if (!key) return;
  localStorage.setItem(key, JSON.stringify(state.notas));
}
