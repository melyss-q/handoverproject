import { mountLoginLayout } from '../layouts/LoginLayout.js';
import { signIn, sendPasswordReset } from '../auth/authService.js';

// Tela de login redesenhada para autenticação real do Supabase (e-mail + senha).
// O app original deixava escolher o nome numa lista e digitar uma senha —
// isso não é mais possível com Supabase Auth de verdade (a lista de usuários
// só pode ser lida por quem já está autenticado, por causa do RLS).
export function mountLoginPage(onSuccess) {
  const slot = mountLoginLayout(document.getElementById('app'));
  slot.innerHTML = `
    <div class="login-step" style="display:flex;flex-direction:column;gap:14px;">
      <div>
        <div class="login-pw-label">E-mail</div>
        <div class="login-pw-input">
          <input type="email" id="login-email-input" placeholder="seu.email@portovaleconsorcios.com.br" autocomplete="username">
        </div>
      </div>
      <div>
        <div class="login-pw-label">Senha</div>
        <div class="login-pw-input">
          <input type="password" id="login-pw-input" placeholder="Digite sua senha..." autocomplete="current-password">
        </div>
      </div>
      <button class="btn btn-primary" id="login-submit-btn" style="width:100%;justify-content:center;">Entrar</button>
      <div class="login-err" id="login-err">❌ E-mail ou senha incorretos.</div>
      <div class="login-ok" id="forgot-ok"></div>
      <div style="text-align:center;">
        <a href="#" id="forgot-pw-link" class="login-forgot-link">Esqueci minha senha</a>
      </div>
    </div>`;

  const emailInput = document.getElementById('login-email-input');
  const pwInput = document.getElementById('login-pw-input');
  const submitBtn = document.getElementById('login-submit-btn');
  const errBox = document.getElementById('login-err');
  const forgotLink = document.getElementById('forgot-pw-link');
  const forgotOk = document.getElementById('forgot-ok');

  async function tryLogin() {
    const email = emailInput.value.trim();
    const password = pwInput.value;
    errBox.style.display = 'none';
    if (!email || !password) {
      errBox.textContent = '⚠️ Preencha e-mail e senha.';
      errBox.style.display = 'block';
      return;
    }
    submitBtn.disabled = true;
    submitBtn.textContent = 'Entrando...';
    try {
      const session = await signIn(email, password);
      await onSuccess(session);
    } catch (e) {
      errBox.textContent = '❌ E-mail ou senha incorretos.';
      errBox.style.display = 'block';
      pwInput.value = '';
      pwInput.focus();
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Entrar';
    }
  }

  async function tryForgotPassword(e) {
    e.preventDefault();
    errBox.style.display = 'none';
    forgotOk.style.display = 'none';
    const email = emailInput.value.trim();
    if (!email) {
      errBox.textContent = '⚠️ Digite seu e-mail no campo acima primeiro, depois clique em "Esqueci minha senha".';
      errBox.style.display = 'block';
      emailInput.focus();
      return;
    }
    forgotLink.textContent = 'Enviando...';
    try {
      await sendPasswordReset(email);
      forgotOk.textContent = '✅ Enviamos um link para redefinir sua senha para ' + email + ' (confira também o spam).';
      forgotOk.style.display = 'block';
    } catch (err) {
      errBox.textContent = '❌ Não foi possível enviar o e-mail de redefinição. Tente de novo em alguns minutos.';
      errBox.style.display = 'block';
    } finally {
      forgotLink.textContent = 'Esqueci minha senha';
    }
  }

  submitBtn.addEventListener('click', tryLogin);
  forgotLink.addEventListener('click', tryForgotPassword);
  [emailInput, pwInput].forEach((el) => {
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') tryLogin();
    });
  });

  setTimeout(() => emailInput.focus(), 100);
}
