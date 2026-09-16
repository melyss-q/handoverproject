import { mountLoginLayout } from '../layouts/LoginLayout.js';
import { updatePassword } from '../auth/authService.js';

// Tela exibida quando a pessoa chega pelo link de "esqueci minha senha"
// (o Supabase já autentica sozinho a partir do link — aqui só pedimos a
// senha nova e chamamos updatePassword).
export function mountResetPasswordPage(onDone) {
  const slot = mountLoginLayout(document.getElementById('app'));
  slot.innerHTML = `
    <div class="login-step" style="display:flex;flex-direction:column;gap:14px;">
      <div class="login-title" style="margin-bottom:0;">Defina sua nova senha</div>
      <div class="login-sub" style="margin-bottom:0;text-align:left;">Escolha uma senha nova para acessar o sistema.</div>
      <div>
        <div class="login-pw-label">Nova senha</div>
        <div class="login-pw-input">
          <input type="password" id="reset-pw1" placeholder="Digite a nova senha..." autocomplete="new-password">
        </div>
      </div>
      <div>
        <div class="login-pw-label">Confirmar nova senha</div>
        <div class="login-pw-input">
          <input type="password" id="reset-pw2" placeholder="Digite de novo..." autocomplete="new-password">
        </div>
      </div>
      <button class="btn btn-primary" id="reset-submit-btn" style="width:100%;justify-content:center;">Salvar nova senha</button>
      <div class="login-err" id="reset-err"></div>
    </div>`;

  const pw1 = document.getElementById('reset-pw1');
  const pw2 = document.getElementById('reset-pw2');
  const btn = document.getElementById('reset-submit-btn');
  const errBox = document.getElementById('reset-err');

  function showError(msg) {
    errBox.textContent = msg;
    errBox.style.display = 'block';
  }

  async function trySave() {
    errBox.style.display = 'none';
    if (!pw1.value || pw1.value.length < 6) {
      showError('⚠️ A senha precisa ter pelo menos 6 caracteres.');
      return;
    }
    if (pw1.value !== pw2.value) {
      showError('⚠️ As senhas digitadas não são iguais.');
      return;
    }
    btn.disabled = true;
    btn.textContent = 'Salvando...';
    try {
      await updatePassword(pw1.value);
      await onDone();
    } catch (e) {
      showError('❌ Não foi possível salvar a nova senha. Peça o link de "esqueci minha senha" de novo.');
      btn.disabled = false;
      btn.textContent = 'Salvar nova senha';
    }
  }

  btn.addEventListener('click', trySave);
  [pw1, pw2].forEach((el) => {
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') trySave();
    });
  });

  setTimeout(() => pw1.focus(), 100);
}
