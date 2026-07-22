"use strict";

const byId = (id) => document.getElementById(id);
const statusDot = byId("status-dot");
const statusLabel = byId("status-label");
const statusDetail = byId("status-detail");
const fallbackMessage = byId("fallback-message");
const version = byId("runtime-version");
const platform = byId("runtime-platform");
const runtimeMode = byId("runtime-mode");
const runtimePolicy = byId("runtime-policy");
const modeLabel = byId("mode-label");
const modeButton = byId("mode-button");
const browserHealth = byId("browser-health");
const tabStrip = byId("tab-strip");
const tabLimit = byId("tab-limit");
const addressInput = byId("address-input");
const trustIndicator = byId("trust-indicator");
const zoomValue = byId("zoom-value");
const downloadCount = byId("download-count");
const toast = byId("toast");
let appState = {};
let corporateState = { tabs: [] };
let stationState = {};
let draggedTabId = null;
let toastTimer = null;

function showToast(message, tone = "info") {
  clearTimeout(toastTimer);
  toast.hidden = false;
  toast.className = `toast toast-${tone}`;
  toast.textContent = message;
  toastTimer = setTimeout(() => { toast.hidden = true; }, 5000);
}

function toneForPhase(phase) {
  if (phase === "ready") return "ready";
  if (["error", "crashed", "timeout"].includes(phase)) return "error";
  if (["unresponsive", "diagnostics"].includes(phase)) return "warning";
  return "loading";
}

function activeTab() { return (corporateState.tabs || []).find((tab) => tab.active) || null; }
function isCorporate(tab) { return tab && !tab.protected; }

function renderTabs() {
  tabStrip.replaceChildren();
  const tabs = Array.isArray(corporateState.tabs) ? corporateState.tabs : [];
  for (const tab of tabs) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `browser-tab ${tab.active ? "active" : ""} ${tab.protected ? "system-tab" : "corporate-tab"}`;
    button.setAttribute("role", "tab");
    button.setAttribute("aria-selected", tab.active ? "true" : "false");
    button.dataset.tabId = tab.id;
    button.draggable = !tab.protected && !tab.mandatory;
    const icon = document.createElement("span");
    icon.className = `tab-icon trust-${tab.trust || (tab.type === "angelcare-system" ? "angelcare" : tab.type === "whatsapp-system" ? "whatsapp" : "corporate")}`;
    icon.textContent = tab.phase === "loading" ? "◌" : tab.type === "angelcare-system" ? "A" : tab.type === "whatsapp-system" ? "W" : tab.favicon ? "●" : "◆";
    const title = document.createElement("span");
    title.className = "tab-title";
    title.textContent = tab.title || "Nouvel onglet";
    const pin = document.createElement("span");
    pin.className = "tab-pin";
    pin.textContent = tab.mandatory ? "▣" : tab.pinned ? "⌖" : "";
    button.append(icon, title, pin);
    if (!tab.protected && !tab.mandatory && !tab.pinned) {
      const close = document.createElement("span");
      close.className = "tab-close";
      close.textContent = "×";
      close.title = "Fermer";
      close.addEventListener("click", (event) => { event.stopPropagation(); void command("close", { id: tab.id }); });
      button.append(close);
    }
    button.addEventListener("click", () => void command("activate", { id: tab.id }));
    button.addEventListener("dblclick", () => { if (!tab.protected) void command("pin", { id: tab.id, pinned: !tab.pinned }); });
    button.addEventListener("dragstart", () => { draggedTabId = tab.id; });
    button.addEventListener("dragover", (event) => event.preventDefault());
    button.addEventListener("drop", (event) => {
      event.preventDefault();
      if (!draggedTabId || draggedTabId === tab.id) return;
      const dynamic = tabs.filter((item) => !item.protected);
      const targetIndex = dynamic.findIndex((item) => item.id === tab.id);
      void command("reorder", { id: draggedTabId, targetIndex });
      draggedTabId = null;
    });
    tabStrip.append(button);
  }
  tabLimit.textContent = `${corporateState.totalTabCount || tabs.length} / ${corporateState.maximumTabs || stationState.maximumTabs || 12}`;
}

function renderNavigation() {
  const tab = activeTab();
  const corporate = isCorporate(tab);
  byId("back").disabled = !corporate || tab.canGoBack !== true;
  byId("forward").disabled = !corporate || tab.canGoForward !== true;
  byId("reload").disabled = !corporate;
  byId("home").disabled = !corporate;
  addressInput.disabled = !corporate;
  addressInput.value = corporate ? (tab.url || "") : tab?.type === "whatsapp-system" ? "https://web.whatsapp.com/" : appState.loadedUrl || appState.targetUrl || "";
  zoomValue.textContent = `${Math.round(Number(tab?.zoom || 1) * 100)}%`;
  byId("zoom-out").disabled = !corporate;
  byId("zoom-in").disabled = !corporate;
  zoomValue.disabled = !corporate;
  const trust = tab?.trust || (tab?.type === "angelcare-system" ? "angelcare" : tab?.type === "whatsapp-system" ? "whatsapp" : "local");
  trustIndicator.className = `trust-indicator trust-${trust}`;
  trustIndicator.title = trust === "angelcare" ? "Domaine ANGELCARE approuvé" : trust === "whatsapp" ? "Surface WhatsApp protégée" : trust === "corporate" ? "Domaine corporate approuvé" : trust === "blocked" ? "Destination bloquée" : "Surface locale sécurisée";
  downloadCount.textContent = String((corporateState.downloads || []).filter((entry) => entry.state === "progressing").length);
}

function renderStation() {
  const mode = stationState.currentMode || stationState.requiredMode || "standard";
  const labels = { standard: "Standard", focus: "Focus", locked: "Verrouillé" };
  modeLabel.textContent = labels[mode] || mode;
  modeButton.className = `mode-pill mode-${mode}`;
  modeButton.title = mode === "locked" ? "Déverrouillage administrateur requis" : "État du poste corporate";
  runtimeMode.textContent = labels[mode] || mode;
  runtimePolicy.textContent = stationState.policyVersion ? `v${stationState.policyVersion}${stationState.policyAcknowledged ? " · appliquée" : " · en attente"}` : "Locale";
  browserHealth.textContent = `Navigateur ${stationState.browserHealth || corporateState.browserHealth || "—"}`;
  document.body.dataset.stationMode = mode;
}

function renderState(state = {}) {
  appState = { ...appState, ...state };
  if (state.corporateBrowser) corporateState = state.corporateBrowser;
  if (state.station) stationState = state.station;
  const tone = toneForPhase(appState.phase);
  statusDot.className = `status-dot status-${tone}`;
  statusLabel.textContent = appState.message || "ANGELCARE Corporate Station";
  statusDetail.textContent = appState.detail || (appState.online === true ? "Connexion sécurisée active" : "Poste corporate sécurisé");
  fallbackMessage.textContent = appState.detail || appState.message || "Connexion à la plateforme ANGELCARE.";
  version.textContent = appState.appVersion || version.textContent || "—";
  platform.textContent = appState.platform || platform.textContent || "—";
  renderTabs(); renderNavigation(); renderStation();
}

async function command(action, payload = {}) {
  try { return await window.angelcareShell.corporate.command(action, payload); }
  catch (error) { showToast(error instanceof Error ? error.message : String(error), "error"); throw error; }
}
async function stationCommand(action, payload = {}) {
  try { return await window.angelcareShell.station.command(action, payload); }
  catch (error) { showToast(error instanceof Error ? error.message : String(error), "error"); throw error; }
}

for (const button of document.querySelectorAll("[data-action]")) {
  button.addEventListener("click", async () => {
    const action = button.getAttribute("data-action");
    button.disabled = true;
    try { await window.angelcareShell.action(action); }
    catch (error) { showToast(error instanceof Error ? error.message : String(error), "error"); }
    finally { button.disabled = false; }
  });
}

byId("new-tab").addEventListener("click", () => void command("create", { activate: true }));
byId("fallback-new-tab").addEventListener("click", () => void command("create", { activate: true }));
byId("reopen-tab").addEventListener("click", () => void command("reopen-closed"));
byId("back").addEventListener("click", () => void command("back", { id: activeTab()?.id }));
byId("forward").addEventListener("click", () => void command("forward", { id: activeTab()?.id }));
byId("reload").addEventListener("click", () => void command("reload", { id: activeTab()?.id }));
byId("home").addEventListener("click", () => void command("home", { id: activeTab()?.id }));
byId("zoom-out").addEventListener("click", () => void command("zoom-out", { id: activeTab()?.id }));
byId("zoom-in").addEventListener("click", () => void command("zoom-in", { id: activeTab()?.id }));
zoomValue.addEventListener("click", () => void command("zoom-reset", { id: activeTab()?.id }));
byId("downloads").addEventListener("click", () => void command("open-downloads"));
byId("address-form").addEventListener("submit", (event) => { event.preventDefault(); const tab = activeTab(); if (isCorporate(tab)) void command("navigate", { id: tab.id, input: addressInput.value }); });
modeButton.addEventListener("click", () => { if ((stationState.currentMode || "standard") === "locked") void stationCommand("request-unlock"); else showToast(`Mode actuel : ${modeLabel.textContent}. Les changements sont gouvernés depuis /whatsapp-os/admin.`, "info"); });
for (const button of document.querySelectorAll("[data-station-action]")) {
  if (button === modeButton) continue;
  button.addEventListener("click", () => void stationCommand(button.dataset.stationAction));
}

document.addEventListener("keydown", (event) => {
  const modifier = navigator.platform.toLowerCase().includes("mac") ? event.metaKey : event.ctrlKey;
  if (!modifier) return;
  const key = event.key.toLowerCase();
  if (key === "l") { event.preventDefault(); addressInput.focus(); addressInput.select(); }
  else if (key === "t") { event.preventDefault(); void command("create", { activate: true }); }
  else if (key === "w" && isCorporate(activeTab())) { event.preventDefault(); void command("close", { id: activeTab().id }); }
  else if (key === "+" || key === "=") { event.preventDefault(); void command("zoom-in", { id: activeTab()?.id }); }
  else if (key === "-") { event.preventDefault(); void command("zoom-out", { id: activeTab()?.id }); }
  else if (key === "0") { event.preventDefault(); void command("zoom-reset", { id: activeTab()?.id }); }
});

window.angelcareShell.onState(renderState);
window.angelcareShell.corporate.onStatus((state) => { corporateState = state || { tabs: [] }; renderTabs(); renderNavigation(); if (state?.notification?.message) showToast(state.notification.message, state.notification.tone === "blocked" ? "error" : "info"); if (state?.focusAddressBar) { addressInput.focus(); addressInput.select(); } });
window.angelcareShell.station.onStatus((state) => { stationState = state || {}; renderStation(); });
Promise.all([
  window.angelcareShell.getRuntime(),
  window.angelcareShell.corporate.command("get-status"),
  window.angelcareShell.station.command("get-status"),
]).then(([runtime, corporate, station]) => {
  version.textContent = runtime.version;
  platform.textContent = runtime.platform;
  corporateState = corporate;
  stationState = station;
  document.body.dataset.platform = runtime.platform || "unknown";
  renderTabs(); renderNavigation(); renderStation();
}).catch((error) => showToast(String(error), "error"));
