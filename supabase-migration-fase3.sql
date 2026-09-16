-- ============================================================
-- Handover Portovale — Migração Fase 3
-- Rode este arquivo inteiro de uma vez no SQL Editor do Supabase
-- (projeto handover-portovale-v2) e clique em "Run".
-- ============================================================

-- 1) USUARIOS: separar "cargo" (informativo) de "acesso admin" (permissão)
-- ------------------------------------------------------------
alter table public.usuarios rename column perfil to cargo;
alter table public.usuarios add column is_admin boolean not null default false;

-- migra quem já era admin antes de trocar os valores de cargo
update public.usuarios set is_admin = true where cargo = 'admin';

-- define um cargo inicial razoável para todo mundo (dá pra ajustar
-- pessoa por pessoa depois, pela tela de Gestão da equipe)
update public.usuarios set cargo = 'APRENDIZ' where nome ilike 'aprendiz%';
update public.usuarios set cargo = 'ANALISTA' where cargo in ('admin', 'analista');

alter table public.usuarios add constraint usuarios_cargo_check
  check (cargo in ('APRENDIZ', 'ASSISTENTE', 'AUXILIAR', 'ANALISTA', 'COORDENADOR', 'GERENTE'));

-- 2) Novas tabelas: diretorias, equipes, atividades e os vínculos
--    (escopo de diretoria por pessoa / visibilidade de atividade por pessoa)
-- ------------------------------------------------------------
create table public.diretorias (
  id uuid default gen_random_uuid() primary key,
  nome text not null unique,
  created_at timestamptz default now()
);

create table public.equipes (
  id uuid default gen_random_uuid() primary key,
  diretoria_id uuid not null references public.diretorias(id) on delete cascade,
  nome text not null,
  created_at timestamptz default now(),
  unique (diretoria_id, nome)
);

create table public.atividades (
  id uuid default gen_random_uuid() primary key,
  nome text not null unique,
  tipo text not null check (tipo in ('diaria', 'pontual')),
  ordem int not null default 0,
  created_at timestamptz default now()
);

-- Diretorias que cada pessoa pode ver ao registrar handover.
-- Convenção: se uma pessoa não tem NENHUMA linha aqui, ela vê TODAS as
-- diretorias (evita travar o cadastro de gente nova antes do admin
-- configurar o escopo).
create table public.usuario_diretorias (
  usuario_id uuid not null references public.usuarios(id) on delete cascade,
  diretoria_id uuid not null references public.diretorias(id) on delete cascade,
  primary key (usuario_id, diretoria_id)
);

-- Quem vê cada atividade (diária ou pontual) na tela de Registrar handover.
-- Mesma convenção: sem nenhuma linha para a atividade = visível para todos.
create table public.atividade_visibilidade (
  atividade_id uuid not null references public.atividades(id) on delete cascade,
  usuario_id uuid not null references public.usuarios(id) on delete cascade,
  primary key (atividade_id, usuario_id)
);

-- 3) RLS: leitura liberada para autenticados, escrita só para admin
-- ------------------------------------------------------------
alter table public.diretorias enable row level security;
alter table public.equipes enable row level security;
alter table public.atividades enable row level security;
alter table public.usuario_diretorias enable row level security;
alter table public.atividade_visibilidade enable row level security;

create policy "diretorias_select_authenticated" on public.diretorias for select to authenticated using (true);
create policy "diretorias_insert_admin" on public.diretorias for insert to authenticated with check (exists (select 1 from public.usuarios u where u.id = auth.uid() and u.is_admin = true));
create policy "diretorias_update_admin" on public.diretorias for update to authenticated using (exists (select 1 from public.usuarios u where u.id = auth.uid() and u.is_admin = true)) with check (exists (select 1 from public.usuarios u where u.id = auth.uid() and u.is_admin = true));
create policy "diretorias_delete_admin" on public.diretorias for delete to authenticated using (exists (select 1 from public.usuarios u where u.id = auth.uid() and u.is_admin = true));

create policy "equipes_select_authenticated" on public.equipes for select to authenticated using (true);
create policy "equipes_insert_admin" on public.equipes for insert to authenticated with check (exists (select 1 from public.usuarios u where u.id = auth.uid() and u.is_admin = true));
create policy "equipes_update_admin" on public.equipes for update to authenticated using (exists (select 1 from public.usuarios u where u.id = auth.uid() and u.is_admin = true)) with check (exists (select 1 from public.usuarios u where u.id = auth.uid() and u.is_admin = true));
create policy "equipes_delete_admin" on public.equipes for delete to authenticated using (exists (select 1 from public.usuarios u where u.id = auth.uid() and u.is_admin = true));

create policy "atividades_select_authenticated" on public.atividades for select to authenticated using (true);
create policy "atividades_insert_admin" on public.atividades for insert to authenticated with check (exists (select 1 from public.usuarios u where u.id = auth.uid() and u.is_admin = true));
create policy "atividades_update_admin" on public.atividades for update to authenticated using (exists (select 1 from public.usuarios u where u.id = auth.uid() and u.is_admin = true)) with check (exists (select 1 from public.usuarios u where u.id = auth.uid() and u.is_admin = true));
create policy "atividades_delete_admin" on public.atividades for delete to authenticated using (exists (select 1 from public.usuarios u where u.id = auth.uid() and u.is_admin = true));

create policy "usuario_diretorias_select_authenticated" on public.usuario_diretorias for select to authenticated using (true);
create policy "usuario_diretorias_insert_admin" on public.usuario_diretorias for insert to authenticated with check (exists (select 1 from public.usuarios u where u.id = auth.uid() and u.is_admin = true));
create policy "usuario_diretorias_update_admin" on public.usuario_diretorias for update to authenticated using (exists (select 1 from public.usuarios u where u.id = auth.uid() and u.is_admin = true)) with check (exists (select 1 from public.usuarios u where u.id = auth.uid() and u.is_admin = true));
create policy "usuario_diretorias_delete_admin" on public.usuario_diretorias for delete to authenticated using (exists (select 1 from public.usuarios u where u.id = auth.uid() and u.is_admin = true));

create policy "atividade_visibilidade_select_authenticated" on public.atividade_visibilidade for select to authenticated using (true);
create policy "atividade_visibilidade_insert_admin" on public.atividade_visibilidade for insert to authenticated with check (exists (select 1 from public.usuarios u where u.id = auth.uid() and u.is_admin = true));
create policy "atividade_visibilidade_update_admin" on public.atividade_visibilidade for update to authenticated using (exists (select 1 from public.usuarios u where u.id = auth.uid() and u.is_admin = true)) with check (exists (select 1 from public.usuarios u where u.id = auth.uid() and u.is_admin = true));
create policy "atividade_visibilidade_delete_admin" on public.atividade_visibilidade for delete to authenticated using (exists (select 1 from public.usuarios u where u.id = auth.uid() and u.is_admin = true));

-- 4) Conceder acesso básico às tabelas novas (sem isso o RLS nem chega a
--    ser avaliado — foi exatamente o que faltou na Fase 1 e causou o erro
--    403 que você viu)
-- ------------------------------------------------------------
grant select, insert, update, delete on public.diretorias to authenticated;
grant select, insert, update, delete on public.equipes to authenticated;
grant select, insert, update, delete on public.atividades to authenticated;
grant select, insert, update, delete on public.usuario_diretorias to authenticated;
grant select, insert, update, delete on public.atividade_visibilidade to authenticated;

-- 5) Trocar as políticas antigas que checavam perfil = 'admin' para
--    usar o novo campo is_admin
-- ------------------------------------------------------------
drop policy "usuarios_insert_admin" on public.usuarios;
drop policy "usuarios_update_admin" on public.usuarios;
drop policy "usuarios_delete_admin" on public.usuarios;
drop policy "handovers_insert_own_or_admin" on public.handovers;
drop policy "handovers_update_own_or_admin" on public.handovers;
drop policy "handovers_delete_own_or_admin" on public.handovers;

create policy "usuarios_insert_admin" on public.usuarios for insert to authenticated with check (exists (select 1 from public.usuarios u where u.id = auth.uid() and u.is_admin = true));
create policy "usuarios_update_admin" on public.usuarios for update to authenticated using (exists (select 1 from public.usuarios u where u.id = auth.uid() and u.is_admin = true)) with check (exists (select 1 from public.usuarios u where u.id = auth.uid() and u.is_admin = true));
create policy "usuarios_delete_admin" on public.usuarios for delete to authenticated using (exists (select 1 from public.usuarios u where u.id = auth.uid() and u.is_admin = true));

create policy "handovers_insert_own_or_admin" on public.handovers for insert to authenticated with check (usuario_id = auth.uid() or exists (select 1 from public.usuarios u where u.id = auth.uid() and u.is_admin = true));
create policy "handovers_update_own_or_admin" on public.handovers for update to authenticated using (usuario_id = auth.uid() or exists (select 1 from public.usuarios u where u.id = auth.uid() and u.is_admin = true)) with check (usuario_id = auth.uid() or exists (select 1 from public.usuarios u where u.id = auth.uid() and u.is_admin = true));
create policy "handovers_delete_own_or_admin" on public.handovers for delete to authenticated using (usuario_id = auth.uid() or exists (select 1 from public.usuarios u where u.id = auth.uid() and u.is_admin = true));

-- 6) Popular as tabelas novas com os dados que hoje estão fixos no código
-- ------------------------------------------------------------
insert into public.diretorias (nome) values
  ('AYA'), ('BELL BREAKERS'), ('DUNAMIS'), ('QUIMERA');

insert into public.equipes (diretoria_id, nome)
select d.id, v.nome
from (values
  ('AYA', 'JAGUAR'), ('AYA', 'SKYWINGS'), ('AYA', 'ARQUEIROS'), ('AYA', 'BAOBÁ'),
  ('BELL BREAKERS', 'CHALLENGERS'), ('BELL BREAKERS', 'TITÂNIO'), ('BELL BREAKERS', 'HARPIA'), ('BELL BREAKERS', 'RISE'),
  ('DUNAMIS', 'PANDORA'), ('DUNAMIS', 'AVENGERS'), ('DUNAMIS', 'MANDALÊ'), ('DUNAMIS', 'AYLA'), ('DUNAMIS', 'TITÃS'),
  ('QUIMERA', 'FORJA'), ('QUIMERA', 'GRIFO'), ('QUIMERA', 'ÍRIS'), ('QUIMERA', 'HYDRA')
) as v(diretoria_nome, nome)
join public.diretorias d on d.nome = v.diretoria_nome;

insert into public.atividades (nome, tipo, ordem) values
  ('TICKET', 'diaria', 1),
  ('NPS', 'diaria', 2),
  ('INT. CANCELAMENTO', 'diaria', 3),
  ('VALIDAÇÃO DE VENDAS', 'diaria', 4),
  ('INADIMPLENTES', 'diaria', 5),
  ('PÓS-VENDA', 'pontual', 1),
  ('AJUSTE DE PONTO', 'pontual', 2);

-- Pronto! Depois de rodar, confira com:
-- select nome, cargo, is_admin from public.usuarios order by nome;
-- select * from public.diretorias;
-- select d.nome as diretoria, e.nome as equipe from public.equipes e join public.diretorias d on d.id = e.diretoria_id order by 1,2;
-- select * from public.atividades order by tipo, ordem;
