import { supabase } from '../supabaseClient.js';

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.session;
}

export async function signOut() {
  await supabase.auth.signOut();
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

// Dispara o e-mail de "esqueci minha senha" do próprio Supabase Auth.
// O link do e-mail traz a pessoa de volta pra este mesmo site; o evento
// PASSWORD_RECOVERY (tratado em main.js) é o que abre a tela de nova senha.
export async function sendPasswordReset(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin,
  });
  if (error) throw error;
}

// Usado na tela de "definir nova senha", depois que a pessoa clica no link
// do e-mail (a sessão de recuperação já vem pronta nesse momento).
export async function updatePassword(newPassword) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

export function onAuthStateChange(callback) {
  const { data } = supabase.auth.onAuthStateChange((event, session) => callback(event, session));
  return data.subscription;
}

// Perfil em public.usuarios correspondente ao usuário autenticado
// (id da linha = auth.uid()).
export async function fetchProfile(userId) {
  const { data, error } = await supabase.from('usuarios').select('*').eq('id', userId).single();
  if (error) throw error;
  return data;
}

export async function fetchTodosUsuarios() {
  const { data, error } = await supabase.from('usuarios').select('*').order('nome');
  if (error) throw error;
  return data;
}

// Apenas admin pode alterar linhas de usuarios (RLS: usuarios_update_admin).
export async function atualizarUsuario(id, campos) {
  const { error } = await supabase.from('usuarios').update(campos).eq('id', id);
  if (error) throw error;
}

// ===================== DIRETORIAS / EQUIPES =====================
export async function fetchDiretoriasComEquipes() {
  const [{ data: diretorias, error: e1 }, { data: equipes, error: e2 }] = await Promise.all([
    supabase.from('diretorias').select('*').order('nome'),
    supabase.from('equipes').select('*').order('nome'),
  ]);
  if (e1) throw e1;
  if (e2) throw e2;
  return diretorias.map((d) => ({ ...d, equipes: equipes.filter((e) => e.diretoria_id === d.id) }));
}

export async function criarDiretoria(nome) {
  const { data, error } = await supabase.from('diretorias').insert({ nome }).select().single();
  if (error) throw error;
  return data;
}

export async function renomearDiretoria(id, nome) {
  const { error } = await supabase.from('diretorias').update({ nome }).eq('id', id);
  if (error) throw error;
}

export async function removerDiretoria(id) {
  const { error } = await supabase.from('diretorias').delete().eq('id', id);
  if (error) throw error;
}

export async function criarEquipe(diretoriaId, nome) {
  const { data, error } = await supabase.from('equipes').insert({ diretoria_id: diretoriaId, nome }).select().single();
  if (error) throw error;
  return data;
}

export async function renomearEquipe(id, nome) {
  const { error } = await supabase.from('equipes').update({ nome }).eq('id', id);
  if (error) throw error;
}

export async function removerEquipe(id) {
  const { error } = await supabase.from('equipes').delete().eq('id', id);
  if (error) throw error;
}

// ===================== ATIVIDADES =====================
export async function fetchAtividades() {
  const { data, error } = await supabase.from('atividades').select('*').order('tipo').order('ordem');
  if (error) throw error;
  return data;
}

export async function criarAtividade(nome, tipo, ordem = 0) {
  const { data, error } = await supabase.from('atividades').insert({ nome, tipo, ordem }).select().single();
  if (error) throw error;
  return data;
}

export async function renomearAtividade(id, nome) {
  const { error } = await supabase.from('atividades').update({ nome }).eq('id', id);
  if (error) throw error;
}

export async function removerAtividade(id) {
  const { error } = await supabase.from('atividades').delete().eq('id', id);
  if (error) throw error;
}

// ===================== ESCOPOS (diretorias por pessoa / visibilidade de atividade) =====================
// Convenção usada em toda a aplicação: se uma pessoa/atividade não tem
// NENHUMA linha nessas tabelas, ela é tratada como "sem restrição" (vê
// tudo / é vista por todos) — assim ninguém fica travado antes do admin
// configurar o escopo.
export async function fetchUsuarioDiretorias() {
  const { data, error } = await supabase.from('usuario_diretorias').select('*');
  if (error) throw error;
  return data; // [{ usuario_id, diretoria_id }]
}

export async function setUsuarioDiretorias(usuarioId, diretoriaIds) {
  const { error: delErr } = await supabase.from('usuario_diretorias').delete().eq('usuario_id', usuarioId);
  if (delErr) throw delErr;
  if (diretoriaIds.length) {
    const rows = diretoriaIds.map((diretoria_id) => ({ usuario_id: usuarioId, diretoria_id }));
    const { error: insErr } = await supabase.from('usuario_diretorias').insert(rows);
    if (insErr) throw insErr;
  }
}

export async function fetchAtividadeVisibilidade() {
  const { data, error } = await supabase.from('atividade_visibilidade').select('*');
  if (error) throw error;
  return data; // [{ atividade_id, usuario_id }]
}

export async function setAtividadeVisibilidade(atividadeId, usuarioIds) {
  const { error: delErr } = await supabase.from('atividade_visibilidade').delete().eq('atividade_id', atividadeId);
  if (delErr) throw delErr;
  if (usuarioIds.length) {
    const rows = usuarioIds.map((usuario_id) => ({ atividade_id: atividadeId, usuario_id }));
    const { error: insErr } = await supabase.from('atividade_visibilidade').insert(rows);
    if (insErr) throw insErr;
  }
}
