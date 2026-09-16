import { STATUS_MAP } from '../data/config.js';

export function badgeFor(status) {
  return (STATUS_MAP[status] || STATUS_MAP['Não iniciada']).badge;
}

export function classeFor(status) {
  return (STATUS_MAP[status] || STATUS_MAP['Não iniciada']).classe;
}

// Usado na aba "Ver handovers": não mostra nada se o status vier vazio.
export function stBadge(status) {
  if (!status) return '';
  return badgeFor(status);
}

export function trunc(text, n) {
  return text && text.length > n ? text.slice(0, n) + '…' : text || '';
}
