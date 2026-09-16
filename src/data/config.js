// Diretorias, equipes e atividades agora são 100% configuráveis pela tela
// (Configurar → Gestão de diretorias e equipes / Gestão de atividades) e
// vivem nas tabelas `diretorias`, `equipes` e `atividades` do Supabase —
// veja src/auth/authService.js. Este arquivo só guarda o que continua
// sendo constante do app (cores, turnos, cargos, mapa de status).

export const CORES_DISPONIVEIS = [
  '#2952e3',
  '#16a34a',
  '#d97706',
  '#7c3aed',
  '#dc2626',
  '#0891b2',
  '#db2777',
  '#65a30d',
];

// Turno é um campo configurável que o admin edita por pessoa em
// Configurar → Gestão da equipe (não é mais definido no cadastro inicial).
export const TURNOS = ['MANHÃ', 'TARDE', 'NOITE', 'PERÍODO COMPLETO'];

// Cargo é só informativo (não afeta permissões — quem administra o sistema
// é controlado pelo campo separado "is_admin", editável na mesma tela).
export const CARGOS = ['APRENDIZ', 'ASSISTENTE', 'AUXILIAR', 'ANALISTA', 'COORDENADOR', 'GERENTE'];

export const STATUS_MAP = {
  Concluído: { classe: 'status-concluido', badge: '<span class="badge b-green">✅ Concluído</span>' },
  'Com pendência': { classe: 'status-pendente', badge: '<span class="badge b-amber">⏳ Com pendência</span>' },
  Bloqueado: { classe: 'status-bloqueado', badge: '<span class="badge b-red">🚨 Bloqueado</span>' },
  'Não iniciada': { classe: 'status-nao-iniciada', badge: '<span class="badge b-gray">— Não iniciada</span>' },
};
