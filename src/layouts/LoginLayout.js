// Layout de tela cheia para a página de login — sem header/abas.
export function mountLoginLayout(root) {
  root.innerHTML = `
    <div id="login-overlay">
      <div class="login-cover" id="login-cover"></div>
      <div class="login-panel">
        <div class="login-brand-logo">
          <img src="/LOGO.png" alt="Logo" id="login-logo-img">
        </div>
        <div class="login-brand-name">Equipe GRE</div>
        <br>
        <div class="login-title">Portal de Handovers</div>
        <div class="login-sub">Entre com seu e-mail e senha para acessar o sistema.</div>
        <div id="login-form-slot"></div>
      </div>
    </div>`;
  // Some deployments may not have LOGO.png in /public yet — hide gracefully
  // instead of showing a broken-image icon.
  const logoImg = document.getElementById('login-logo-img');
  logoImg.addEventListener('error', () => { logoImg.style.display = 'none'; });

  // A capa (login-cover) é trocada à mão pelo Explorador de Arquivos, e o
  // Windows esconde a extensão real por padrão — é fácil a pessoa achar que
  // salvou "login-cover.jpg" quando na verdade é .png/.jpeg. Em vez de exigir
  // a extensão exata, testamos algumas e usamos a primeira que existir.
  const coverEl = document.getElementById('login-cover');
  const coverCandidates = ['/login-cover.jpg', '/login-cover.jpeg', '/login-cover.png', '/login-cover.webp'];
  (function tryCover(i) {
    if (i >= coverCandidates.length) return;
    const probe = new Image();
    probe.onload = () => { coverEl.style.backgroundImage = `url('${coverCandidates[i]}')`; };
    probe.onerror = () => tryCover(i + 1);
    probe.src = coverCandidates[i];
  })(0);

  return document.getElementById('login-form-slot');
}
