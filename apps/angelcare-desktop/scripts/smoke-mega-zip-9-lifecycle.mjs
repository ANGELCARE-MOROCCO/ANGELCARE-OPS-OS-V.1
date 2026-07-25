import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import Module, { createRequire } from "node:module";
import { EventEmitter } from "node:events";

const require = createRequire(import.meta.url);
let nextId = 100;

class MockWebContents extends EventEmitter {
  constructor(session) {
    super();
    this.id = nextId++;
    this._session = session;
    this._url = "about:blank";
    this._title = "";
    this._destroyed = false;
    this._zoom = 1;
    this._history = [this._url];
    this._historyIndex = 0;
    this.reloadCount = 0;
    this.navigationHistory = {
      canGoBack: () => this._historyIndex > 0,
      canGoForward: () => this._historyIndex < this._history.length - 1,
      goBack: () => { if (this._historyIndex > 0) { this._historyIndex -= 1; this._url = this._history[this._historyIndex]; } },
      goForward: () => { if (this._historyIndex < this._history.length - 1) { this._historyIndex += 1; this._url = this._history[this._historyIndex]; } },
    };
  }
  setWindowOpenHandler(handler) { this._windowOpenHandler = handler; }
  setZoomFactor(value) { this._zoom = value; }
  getZoomFactor() { return this._zoom; }
  getURL() { return this._url; }
  getTitle() { return this._title || this._url; }
  isDestroyed() { return this._destroyed; }
  focus() { this.focused = true; }
  close() { this._destroyed = true; }
  stop() { this.stopped = true; }
  reload() { this.reloadCount += 1; }
  reloadIgnoringCache() { this.reloadCount += 1; this.hardReloaded = true; }
  setUserAgent() {}
  getUserAgent() { return "Mock"; }
  async loadURL(url) {
    this.emit("did-start-loading");
    this._url = String(url);
    this._history = this._history.slice(0, this._historyIndex + 1);
    this._history.push(this._url);
    this._historyIndex = this._history.length - 1;
    this._title = new URL(this._url).pathname || "ANGELCARE";
    this.emit("did-navigate", {}, this._url);
    this.emit("did-stop-loading");
  }
  get session() { return this._session; }
}

class MockView {
  constructor({ webPreferences = {} } = {}) {
    this.webContents = new MockWebContents(webPreferences.session);
    this.visible = false;
    this.bounds = null;
    this.preferences = webPreferences;
  }
  setBackgroundColor() {}
  setVisible(value) { this.visible = Boolean(value); }
  getVisible() { return this.visible; }
  setBounds(bounds) { this.bounds = { ...bounds }; }
}

function mockSession() {
  return {
    setPermissionRequestHandler() {}, setPermissionCheckHandler() {}, setDevicePermissionHandler() {}, setDisplayMediaRequestHandler() {}, on() {},
    clearCache: async () => {}, clearStorageData: async () => {},
  };
}

const originalLoad = Module._load;
Module._load = function patchedLoad(request, parent, isMain) {
  if (request === "electron") return { session: { fromPartition: () => mockSession() }, WebContentsView: MockView };
  return originalLoad.call(this, request, parent, isMain);
};

const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "angelcare-mz9-lifecycle-"));
try {
  const { createCorporateBrowser } = require("../src/runtime/corporate-browser.cjs");
  const trustedSession = mockSession();
  const children = [];
  const mainView = new MockView({ webPreferences: { session: trustedSession } });
  await mainView.webContents.loadURL("https://opsmanagement.angelcarehub.com/dashboard");
  const dormantWhatsappView = new MockView();
  await dormantWhatsappView.webContents.loadURL("angelcare-desktop://whatsapp-activation/index.html");
  let whatsappActivated = false;
  let dividerLayouts = [];
  const policy = {
    mode: "standard", maximum_tabs: 14, maximum_ac_plus_tabs: 12,
    ac_plus_enabled: true, ac_plus_allowed_modes: ["standard", "focus"],
    split_enabled: true, split_allowed_modes: ["standard", "focus"], split_modes: [2, 3, 4], restore_tabs: true,
    browser: {
      default_action: "deny", allowed_schemes: ["https:"], allowed_domains: ["angelcarehub.com", "opsmanagement.angelcarehub.com"],
      blocked_domains: [], allowed_private_hosts: [], include_subdomains: true, google_search_enabled: false, gmail_enabled: false,
      microsoft_365_enabled: false, popups: "deny", external_open: false, downloads: "deny", uploads: "allow", printing: "allow",
      clipboard_read: "deny", clipboard_write: "allow", camera: "deny", microphone: "deny", notifications: "deny", geolocation: "deny",
      fullscreen: "allow", maximum_download_bytes: 1_000_000, safe_download_directory: "Downloads", blocked_extensions: [".exe"],
      domain_permission_overrides: {}, default_tabs: [], pinned_tabs: [], mandatory_tabs: [], tab_order: [],
    },
  };
  const app = { getPath: (name) => name === "downloads" ? path.join(temporary, "downloads") : temporary, getVersion: () => "1.7.2" };
  const makeBrowser = (appRef = app, main = mainView, whatsapp = dormantWhatsappView) => createCorporateBrowser({
    app: appRef,
    mainWindow: { contentView: { addChildView: (view) => children.push(view), removeChildView: (view) => { const index = children.indexOf(view); if (index >= 0) children.splice(index, 1); } } },
    logger: { info() {}, warn() {}, error() {} }, dialog: { showMessageBox: async () => ({ response: 0 }) },
    shell: { openPath: async () => "", openExternal: async () => {} }, getBounds: () => ({ x: 0, y: 108, width: 1200, height: 700 }),
    getPolicy: () => policy, trustedAngelcareSession: trustedSession, trustedPreloadPath: "/trusted/preload.cjs",
    angelcareOrigin: "https://opsmanagement.angelcarehub.com", angelcareDashboardUrl: "https://opsmanagement.angelcarehub.com/dashboard",
    getSystemTabView: (id) => id === "angelcare-system" ? main : id === "whatsapp-system" ? whatsapp : null,
    getSystemTabWebContents: (id) => id === "angelcare-system" ? main.webContents : id === "whatsapp-system" ? whatsapp.webContents : null,
    getSystemTabStatus: (id) => id === "whatsapp-system" ? { activated: whatsappActivated, phase: whatsappActivated ? "ready" : "dormant" } : { activated: true },
    onDividerLayout: (layouts) => { dividerLayouts = layouts; },
  });

  const browser = makeBrowser();
  let state = await browser.restore();
  assert.equal(state.tabs.find((tab) => tab.id === "whatsapp-system").dormant, true, "WhatsApp must restore dormant");
  assert.equal(state.acPlus.enabled, true);

  let ac1 = await browser.createAngelcareWorkspace();
  const ac2 = await browser.createAngelcareWorkspace();
  const ac3 = await browser.createAngelcareWorkspace();
  state = browser.getState();
  assert.equal(state.acPlusTabCount, 3);
  assert.equal(ac1.url, "https://opsmanagement.angelcarehub.com/dashboard");
  assert.ok(children.filter((view) => view.preferences?.preload === "/trusted/preload.cjs").every((view) => view.preferences.session === trustedSession), "Every AC+ view must reuse the trusted ANGELCARE session");

  await mainView.webContents.loadURL("https://opsmanagement.angelcarehub.com/opportunities");
  browser.back("angelcare-system");
  assert.equal(mainView.webContents.getURL(), "https://opsmanagement.angelcarehub.com/dashboard");
  browser.forward("angelcare-system");
  assert.equal(mainView.webContents.getURL(), "https://opsmanagement.angelcarehub.com/opportunities");
  await browser.navigate(ac1.id, "/prospects");
  browser.back(ac1.id);
  assert.equal(browser.getTabWebContents(ac1.id).getURL(), "https://opsmanagement.angelcarehub.com/dashboard");
  browser.forward(ac1.id);
  assert.equal(browser.getTabWebContents(ac1.id).getURL(), "https://opsmanagement.angelcarehub.com/prospects");
  browser.reload(ac1.id);
  assert.equal(browser.getTabWebContents(ac1.id).reloadCount, 1);
  assert.throws(() => browser.back("whatsapp-system"), /WHATSAPP_HISTORY_NAVIGATION_DISABLED/);
  assert.throws(() => browser.forward("whatsapp-system"), /WHATSAPP_HISTORY_NAVIGATION_DISABLED/);
  assert.throws(() => browser.reload("whatsapp-system"), /WHATSAPP_NOT_ACTIVATED/);

  policy.maximum_ac_plus_tabs = 3;
  await assert.rejects(() => browser.createAngelcareWorkspace(), /AC_PLUS_DISABLED_BY_POLICY/);
  policy.maximum_ac_plus_tabs = 12;
  await browser.applyPolicy(policy);

  assert.throws(() => browser.activateSplit(2, [ac1.id, ac1.id]), /REQUIRES_EXACT_SELECTION/);
  state = browser.activateSplit(2, ["angelcare-system", ac1.id]);
  assert.equal(state.split.mode, 2); assert.equal(state.split.paneTabIds.length, 2); assert.equal(dividerLayouts.length, 1);
  assert.equal(new Set(state.split.paneTabIds).size, 2);
  browser.exitSplit();
  state = browser.activateSplit(3, ["angelcare-system", ac1.id, ac2.id]);
  assert.equal(state.split.mode, 3); assert.equal(state.split.paneTabIds.length, 3); assert.equal(dividerLayouts.length, 2);
  assert.equal(new Set(state.split.paneTabIds).size, 3);
  browser.exitSplit();
  state = browser.activateSplit(4, ["angelcare-system", ac1.id, ac2.id, ac3.id]);
  assert.equal(state.split.mode, 4); assert.equal(state.split.paneTabIds.length, 4); assert.equal(dividerLayouts.length, 2);
  assert.equal(new Set(state.split.paneTabIds).size, 4);

  const firstRatio = state.split.ratios.columns[0];
  state = browser.resizeSplitDivider(0, 80);
  assert.notEqual(state.split.ratios.columns[0], firstRatio);
  for (let index = 0; index < 100; index += 1) state = browser.resizeSplitDivider(0, -100);
  assert.ok(state.split.ratios.columns[0] >= 0.179999, "Divider must honor minimum pane ratio");
  for (let index = 0; index < 200; index += 1) state = browser.resizeSplitDivider(0, 100);
  assert.ok(state.split.ratios.columns[0] <= 0.820001, "Divider must honor maximum pane ratio");

  state = browser.focusPane("pane-2");
  assert.equal(state.split.focusedTabId, ac1.id);
  browser.zoomIn();
  state = browser.getState();
  assert.equal(state.tabs.find((tab) => tab.id === ac1.id).zoom, 1.1, "Zoom must target focused pane");
  state = browser.maximizePane("pane-2"); assert.equal(state.split.maximizedPaneId, "pane-2");
  state = browser.restorePane(); assert.equal(state.split.maximizedPaneId, null);
  state = browser.swapPanes("pane-2", "pane-3"); assert.equal(state.split.focusedPaneId, "pane-3");

  await browser.closeTab(ac2.id);
  state = browser.getState(); assert.equal(state.split.mode, 3); assert.equal(state.split.paneTabIds.length, 3);
  await browser.closeTab(ac3.id);
  state = browser.getState(); assert.equal(state.split.mode, 2); assert.equal(state.split.paneTabIds.length, 2);
  const countBeforeExit = state.acPlusTabCount;
  browser.exitSplit();
  state = browser.getState(); assert.equal(state.split.mode, 1); assert.equal(state.acPlusTabCount, countBeforeExit, "Exit split must not close tabs");

  browser.activateSplit(2, ["angelcare-system", ac1.id]);
  browser.getTabWebContents(ac1.id).emit("render-process-gone", {}, { reason: "crashed", exitCode: 1 });
  state = browser.getState();
  assert.equal(state.tabs.find((tab) => tab.id === ac1.id).phase, "crashed");
  assert.notEqual(state.tabs.find((tab) => tab.id === "angelcare-system").phase, "crashed", "One workspace crash must not crash the main ANGELCARE surface");
  assert.equal(state.split.mode, 1, "A crashed pane must be removed from the active split safely");
  const recovered = await browser.recoverTab(ac1.id);
  ac1 = recovered.tabs.find((tab) => tab.type === "angelcare-workspace");
  assert.ok(ac1 && ac1.phase !== "crashed", "Crashed AC+ workspace must recover independently");
  await assert.rejects(() => browser.closeTab("angelcare-system"), /PROTECTED_SYSTEM_TAB/);
  await assert.rejects(() => browser.navigate(ac1.id, "javascript:alert(1)"), /AC_PLUS_URL_OUTSIDE_ANGELCARE_ORIGIN/);

  policy.mode = "focus";
  await browser.applyPolicy(policy);
  browser.applyOperatingMode("focus", { source: "smoke-focus" });
  await assert.doesNotReject(() => browser.createAngelcareWorkspace());
  assert.doesNotThrow(() => browser.openSplitSelector(2));
  browser.closeSplitSelector();
  policy.mode = "locked";
  await browser.applyPolicy(policy);
  browser.applyOperatingMode("locked", { source: "smoke-locked" });
  await assert.rejects(() => browser.createAngelcareWorkspace(), /AC_PLUS_DISABLED_BY_POLICY/);
  assert.throws(() => browser.openSplitSelector(2), /SPLIT_DISABLED_BY_POLICY/);
  policy.mode = "standard";
  browser.applyOperatingMode("standard", { source: "smoke-standard" });
  policy.ac_plus_enabled = false;
  await browser.applyPolicy(policy);
  await assert.rejects(() => browser.createAngelcareWorkspace(), /AC_PLUS_DISABLED_BY_POLICY/);
  policy.ac_plus_enabled = true;
  policy.split_enabled = false;
  await browser.applyPolicy(policy);
  assert.throws(() => browser.openSplitSelector(2), /SPLIT_DISABLED_BY_POLICY/);
  policy.split_enabled = true;
  await browser.applyPolicy(policy);

  const persisted = JSON.parse(fs.readFileSync(path.join(temporary, "corporate-tabs.json"), "utf8"));
  assert.equal(persisted.schemaVersion, 3);
  assert.equal(persisted.tabs.length, browser.getState().acPlusTabCount);
  const persistedAcCount = persisted.tabs.filter((tab) => tab.type === "angelcare-workspace").length;
  browser.destroy();

  whatsappActivated = false;
  const restoredMain = new MockView({ webPreferences: { session: trustedSession } });
  await restoredMain.webContents.loadURL("https://opsmanagement.angelcarehub.com/dashboard");
  const restoredWhatsapp = new MockView();
  await restoredWhatsapp.webContents.loadURL("angelcare-desktop://whatsapp-activation/index.html");
  const restoredBrowser = makeBrowser(app, restoredMain, restoredWhatsapp);
  state = await restoredBrowser.restore();
  assert.equal(state.acPlusTabCount, persistedAcCount, "ANGELCARE workspaces must restore");
  assert.equal(state.tabs.find((tab) => tab.id === "whatsapp-system").dormant, true, "WhatsApp must restore as dormant placeholder");
  restoredBrowser.destroy();

  const corruptDirectory = path.join(temporary, "corrupt-persistence");
  fs.mkdirSync(corruptDirectory, { recursive: true });
  fs.writeFileSync(path.join(corruptDirectory, "corporate-tabs.json"), "{ definitely-not-json", "utf8");
  const corruptApp = { getPath: (name) => name === "downloads" ? path.join(corruptDirectory, "downloads") : corruptDirectory, getVersion: () => "1.7.2" };
  const corruptBrowser = makeBrowser(corruptApp, restoredMain, restoredWhatsapp);
  state = await corruptBrowser.restore();
  assert.equal(state.persistence.corruptFallback, true, "Corrupt persistence must fall back safely");
  corruptBrowser.destroy();

  console.log("Mega ZIP 9 lifecycle smoke passed: trusted AC+ session reuse, exact modes 2/3/4, bounded dividers, focused history/zoom/reload, crash isolation, close rebalance, policy modes, persistence restore/corrupt fallback and dormant WhatsApp restart.");
} finally {
  Module._load = originalLoad;
  fs.rmSync(temporary, { recursive: true, force: true });
}
