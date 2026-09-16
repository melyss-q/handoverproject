// Router interno (sem URLs reais) — apenas alterna qual painel está
// visível e (re)renderiza seu conteúdo a partir do estado compartilhado.
import { setActiveTab } from '../layouts/AppShell.js';
import { renderHandoverPage } from '../pages/HandoverPage.js';
import { renderVerPage } from '../pages/VerPage.js';
import { renderNotasPage } from '../pages/NotasPage.js';
import { renderConfigPage } from '../pages/ConfigPage.js';
import { state } from '../state/appState.js';

const RENDERERS = {
  handover: renderHandoverPage,
  view: renderVerPage,
  notas: renderNotasPage,
  config: renderConfigPage,
};

export function goTab(tabId) {
  if (!RENDERERS[tabId]) return;
  state.currentView = tabId;
  setActiveTab(tabId);
  const panel = document.getElementById('panel-' + tabId);
  if (panel) RENDERERS[tabId](panel);
}
