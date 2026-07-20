"use strict";

const statusDot = document.getElementById("status-dot");
const statusLabel = document.getElementById("status-label");
const statusDetail = document.getElementById("status-detail");
const fallbackMessage = document.getElementById("fallback-message");
const version = document.getElementById("runtime-version");
const platform = document.getElementById("runtime-platform");
const channel = document.getElementById("runtime-channel");
const origin = document.getElementById("runtime-origin");

function toneForPhase(phase) {
  if (phase === "ready") return "ready";
  if (["error", "crashed", "timeout"].includes(phase)) return "error";
  if (["unresponsive", "diagnostics"].includes(phase)) return "warning";
  return "loading";
}

function renderState(state = {}) {
  const tone = toneForPhase(state.phase);
  statusDot.className = `status-dot status-${tone}`;
  statusLabel.textContent = state.message || "ANGELCARE Desktop";
  statusDetail.textContent = state.detail || (state.online === true ? "Connexion sécurisée active" : "Runtime sécurisé");
  fallbackMessage.textContent = state.detail || state.message || "Connexion à la plateforme ANGELCARE.";
  version.textContent = state.appVersion || "—";
  platform.textContent = state.platform || "—";
  channel.textContent = state.releaseChannel || "—";
  origin.textContent = state.targetUrl || "—";
}

for (const button of document.querySelectorAll("[data-action]")) {
  button.addEventListener("click", async () => {
    const action = button.getAttribute("data-action");
    button.disabled = true;
    try {
      await window.angelcareShell.action(action);
    } catch (error) {
      renderState({ phase: "error", message: "Action impossible", detail: error instanceof Error ? error.message : String(error) });
    } finally {
      button.disabled = false;
    }
  });
}

window.angelcareShell.onState(renderState);
window.angelcareShell.getRuntime().then((runtime) => {
  version.textContent = runtime.version;
  platform.textContent = runtime.platform;
  channel.textContent = runtime.releaseChannel;
  origin.textContent = runtime.targetOrigin;
}).catch(() => {});
