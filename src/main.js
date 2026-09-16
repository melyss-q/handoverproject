import { getSession, onAuthStateChange, fetchProfile, signOut } from './auth/authService.js';
import { mountLoginPage } from './pages/LoginPage.js';
import { mountResetPasswordPage } from './pages/ResetPasswordPage.js';
import { mountAppShell, updateHeaderUser } from './layouts/AppShell.js';
import { goTab } from './router/viewRouter.js';
import { state, carregarDadosBase } from './state/appState.js';

function showLoadingScreen(msg) {
  document.getElementById('app').innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100vh;color:var(--text3);font-size:14px;">${msg}</div>`;
}

async function mountAuthenticated(session) {
  state.session = session;
  showLoadingScreen('Carregando...');
  try {
    state.profile = await fetchProfile(session.user.id);
    await carregarDadosBase();
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Erro ao carregar perfil do usuário:', e);
    alert('Não foi possível carregar seu perfil de acesso. Fale com o administrador da equipe.');
    await signOut();
    return;
  }

  mountAppShell({
    onTab: (tabId) => goTab(tabId),
    onTrocar: handleTrocar,
    onSair: handleSair,
  });
  updateHeaderUser(state.profile);
  goTab('handover');
}

function mountLogin() {
  mountLoginPage(async (session) => {
    await mountAuthenticated(session);
  });
}

async function handleTrocar() {
  if (!confirm('Trocar de usuário? Você será desconectado da conta atual e voltará à tela de login.')) return;
  await signOut();
}

async function handleSair() {
  if (!confirm('Sair da sua conta?')) return;
  await signOut();
}

// onAuthStateChange é a fonte única de verdade para logout (feito aqui ou
// em outra aba/dispositivo): sempre que a sessão cai, volta para o login.
// PASSWORD_RECOVERY é disparado pelo próprio Supabase quando a pessoa chega
// pelo link de "esqueci minha senha" — nesse caso mostramos a tela de nova
// senha em vez do login normal.
onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT') {
    state.session = null;
    state.profile = null;
    mountLogin();
  } else if (event === 'PASSWORD_RECOVERY') {
    mountResetPasswordPage(async () => {
      await mountAuthenticated(session);
    });
  }
});

async function boot() {
  const session = await getSession();
  if (session) {
    await mountAuthenticated(session);
  } else {
    mountLogin();
  }
}

boot();
