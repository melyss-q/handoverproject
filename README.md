# Handover Diário — Porto Vale (v2)

Reorganização do app de passagem de plantão da Equipe GRE: saiu de um único
arquivo HTML para um projeto modular (Vite + JavaScript puro, sem
framework), com autenticação real via Supabase Auth no lugar de senhas em
texto puro no código-fonte.

## Rodando localmente

```bash
npm install
npm run dev       # ambiente de desenvolvimento, com recarregamento automático
npm run build     # gera a versão de produção na pasta dist/
npm run preview   # serve a pasta dist/ localmente, para conferir antes de publicar
```

As credenciais do Supabase já estão em `.env` (copiado de `.env.example`).
A chave usada é a `publishable` (equivalente à antiga `anon`) — pode ficar
exposta no navegador, não é secreta.

## O que falta você fazer

- **Logo**: o app espera um arquivo `LOGO.png` dentro da pasta `public/`
  (aparece na tela de login e no cabeçalho). Ele não veio incluído porque
  não estava embutido no HTML original — é só copiar o arquivo da logo da
  Porto Vale para `public/LOGO.png`.
- **Publicar no Vercel**: aponte o projeto para a pasta raiz normalmente —
  o Vercel detecta Vite automaticamente. Configure as duas variáveis de
  ambiente do `.env` (`VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`) nas
  configurações do projeto na Vercel.
- **Senhas dos 11 acessos**: foram entregues em um arquivo CSV separado
  (não fica salvo em nenhum lugar além desse arquivo). Peça para cada
  pessoa trocar a senha no primeiro acesso, se quiser reforçar a segurança
  (dá pra fazer isso depois, não é bloqueante).

## Principais mudanças de comportamento (intencionais)

1. **Login por e-mail e senha real**, em vez de escolher o nome numa lista.
   Isso é uma consequência direta de trocar senhas fixas no código por
   contas de verdade no Supabase Auth — com autenticação real, o sistema
   não pode mais mostrar a lista de nomes/senhas antes de alguém entrar.
2. **"Trocar usuário" agora desconecta e volta para o login.** Antes dava
   pra alternar entre pessoas sem digitar senha de novo; com contas reais,
   trocar de pessoa exige login de novo (mais seguro, mas um passo a mais).
3. **A aba Configurar não tem mais senha própria.** Antes existia uma
   segunda senha (`CONFIG_PW`) só pra essa aba. Agora quem entra como admin
   (perfil "admin" no Supabase) já vê a aba liberada — a segurança real
   está nas contas e no banco, não numa segunda senha decorável no código.
4. **Cadastro de pessoas novas continua exigindo o painel do Supabase.**
   Dá pra editar turno, cor e perfil de quem já existe direto pelo app
   (aba Configurar → Gestão da equipe), mas criar um *login* novo não pode
   ser feito pelo navegador sem expor uma chave secreta — por segurança,
   isso continua sendo feito no painel do Supabase (posso te ajudar
   sempre que precisar).
5. **Atividades pontuais e notas pessoais continuam salvas no navegador**
   de cada computador (como já era no site original) — não sincronizam
   entre dispositivos. Isso não é um bug novo, é uma limitação que já
   existia; se fizer sentido migrar isso para o banco de dados também
   (para sincronizar entre computadores), posso fazer como um próximo
   passo.
6. **O campo "turno" não é mais fixo por pessoa.** Como combinado, ele virou
   um campo editável (Configurar → Gestão da equipe) em vez de algo
   definido no cadastro inicial — pode ficar em branco até você definir.
7. A coluna "Turno" saiu da tabela de handovers salvos (ela não fazia mais
   sentido junto com o registro, já que agora é só um dado de perfil).

## Estrutura do projeto

```
index.html                 shell mínimo, carrega src/main.js
src/
  main.js                  ponto de entrada: decide login vs. app autenticado
  supabaseClient.js        cliente do Supabase (usa variáveis de ambiente)
  data/config.js           diretorias/equipes, atividades fixas, cores, turnos
  state/appState.js        estado compartilhado em memória (perfil, formulário, notas...)
  auth/authService.js      login/logout/sessão + leitura e edição de perfis
  router/viewRouter.js      alterna qual aba/painel está visível
  layouts/
    AppShell.js            cabeçalho + abas + painéis (chrome autenticado)
    LoginLayout.js          tela cheia da página de login
  pages/
    LoginPage.js, HandoverPage.js, VerPage.js, NotasPage.js, ConfigPage.js
  components/
    ActivityCard.js, MultiSelect.js, StatusBadge.js
```
