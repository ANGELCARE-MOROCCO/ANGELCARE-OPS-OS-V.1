import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import Module, { createRequire } from "node:module";
import { EventEmitter } from "node:events";

const require = createRequire(import.meta.url);
let nextId = 4000;

class MockWebContents extends EventEmitter {
  constructor(session) {
    super();
    this.id = nextId++;
    this._session = session;
    this._url = "about:blank";
    this._destroyed = false;
    this._zoom = 1;
    this._history = [this._url];
    this._historyIndex = 0;
    this.navigationHistory = {
      canGoBack: () => this._historyIndex > 0,
      canGoForward: () => this._historyIndex < this._history.length - 1,
      goBack: () => {},
      goForward: () => {},
    };
  }
  setWindowOpenHandler() {}
  setZoomFactor(value) { this._zoom = value; }
  getZoomFactor() { return this._zoom; }
  getURL() { return this._url; }
  getTitle() { return this._url; }
  isDestroyed() { return this._destroyed; }
  focus() {}
  close() { this._destroyed = true; }
  stop() {}
  reload() {}
  setUserAgent() {}
  getUserAgent() { return "Mock"; }
  async loadURL(url) {
    this._url = String(url);
    this._history.push(this._url);
    this._historyIndex = this._history.length - 1;
    this.emit("did-navigate", {}, this._url);
    this.emit("did-stop-loading");
  }
  get session() { return this._session; }
}

class MockView {
  constructor({ webPreferences = {} } = {}) {
    this.webContents = new MockWebContents(webPreferences.session);
    this.preferences = webPreferences;
  }
  setBackgroundColor() {}
  setVisible() {}
  setBounds() {}
}

function mockSession() {
  return {
    setPermissionRequestHandler() {}, setPermissionCheckHandler() {}, setDevicePermissionHandler() {},
    setDisplayMediaRequestHandler() {}, on() {}, clearCache: async () => {}, clearStorageData: async () => {},
  };
}

const originalLoad = Module._load;
Module._load = function patchedLoad(request, parent, isMain) {
  if (request === "electron") return { session: { fromPartition: () => mockSession() }, WebContentsView: MockView };
  return originalLoad.call(this, request, parent, isMain);
};

const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "angelcare-operating-mode-controls-"));
try {
  const { createCorporateBrowser } = require("../src/runtime/corporate-browser.cjs");
  const trustedSession = mockSession();
  const mainView = new MockView({ webPreferences: { session: trustedSession } });
  await mainView.webContents.loadURL("https://opsmanagement.angelcarehub.com/dashboard");
  const whatsappView = new MockView();
  await whatsappView.webContents.loadURL("https://web.whatsapp.com/");

  const lockedPolicy = {
    mode: "locked",
    maximum_tabs: 8,
    maximum_ac_plus_tabs: 6,
    ac_plus_enabled: true,
    ac_plus_allowed_modes: ["standard", "focus", "locked"],
    split_enabled: true,
    split_allowed_modes: ["standard", "focus", "locked"],
    split_modes: [2, 3, 4],
    restore_tabs: true,
    browser: {
      default_action: "deny", allowed_schemes: ["https:"],
      allowed_domains: ["angelcarehub.com", "opsmanagement.angelcarehub.com"], blocked_domains: [], allowed_private_hosts: [],
      include_subdomains: true, google_search_enabled: false, gmail_enabled: false, microsoft_365_enabled: false,
      popups: "deny", external_open: false, downloads: "deny", uploads: "allow", printing: "allow",
      clipboard_read: "deny", clipboard_write: "allow", camera: "deny", microphone: "deny", notifications: "deny",
      geolocation: "deny", fullscreen: "allow", maximum_download_bytes: 1000000,
      safe_download_directory: "Downloads", blocked_extensions: [".exe"], domain_permission_overrides: {},
      default_tabs: [], pinned_tabs: [], mandatory_tabs: [], tab_order: [],
    },
  };

  const browser = createCorporateBrowser({
    app: { getPath: () => temporary, getVersion: () => "1.7.3" },
    mainWindow: { contentView: { addChildView() {}, removeChildView() {} } },
    logger: { info() {}, warn() {}, error() {} },
    dialog: { showMessageBox: async () => ({ response: 0 }) },
    shell: { openPath: async () => "", openExternal: async () => {} },
    getBounds: () => ({ x: 0, y: 108, width: 1200, height: 700 }),
    getPolicy: () => lockedPolicy,
    initialOperatingMode: "locked",
    trustedAngelcareSession: trustedSession,
    trustedPreloadPath: "/trusted/preload.cjs",
    angelcareOrigin: "https://opsmanagement.angelcarehub.com",
    angelcareDashboardUrl: "https://opsmanagement.angelcarehub.com/dashboard",
    getSystemTabView: (id) => id === "angelcare-system" ? mainView : id === "whatsapp-system" ? whatsappView : null,
    getSystemTabWebContents: (id) => id === "angelcare-system" ? mainView.webContents : id === "whatsapp-system" ? whatsappView.webContents : null,
    getSystemTabStatus: (id) => id === "whatsapp-system" ? { activated: true, phase: "ready" } : { activated: true },
  });

  let state = await browser.restore();
  assert.equal(state.policyMode, "locked");
  assert.equal(state.operatingMode, "locked");
  assert.equal(state.acPlus.enabled, true, "Locked operating mode must honor explicit AC+ authorization");
  assert.equal(state.split.enabled, true, "Locked operating mode must honor explicit split authorization");

  state = browser.applyOperatingMode("standard", { source: "administrator-unlock" });
  assert.equal(state.policyMode, "locked", "Required policy remains locked");
  assert.equal(state.operatingMode, "standard", "Temporary operating mode becomes standard");
  assert.equal(state.acPlus.enabled, true, "AC+ must enable in the actual Standard operating mode");
  assert.equal(state.split.enabled, true, "Split must enable in the actual Standard operating mode");

  const first = await browser.createAngelcareWorkspace();
  state = browser.activateSplit(2, ["angelcare-system", first.id]);
  assert.equal(state.split.mode, 2);
  assert.equal(state.acPlus.enabled, true, "AC+ must remain enabled while split is active");

  const second = await browser.createAngelcareWorkspace();
  state = browser.getState();
  assert.equal(state.acPlusTabCount, 2, "A new AC+ tab must be creatable while split is active");
  assert.equal(state.split.mode, 2, "Creating an AC+ tab must not destroy the existing split");
  assert.ok(state.split.availableModes.includes(3), "Three-pane composition must become available after the new tab opens");

  state = browser.applyOperatingMode("focus", { source: "focus-mode" });
  assert.equal(state.acPlus.enabled, true, "AC+ remains available in approved Focus mode");
  assert.equal(state.split.enabled, true, "Split remains available in approved Focus mode");

  state = browser.applyOperatingMode("locked", { source: "automatic-relock" });
  assert.equal(state.acPlus.enabled, true, "Relocking must preserve explicitly authorized AC+");
  assert.equal(state.split.enabled, true, "Relocking must preserve explicitly authorized split");
  assert.equal(state.split.mode, 2, "Relocking must preserve the active split when split is explicitly authorized");
  assert.equal(state.acPlusTabCount, 2, "Relocking must preserve opened AC+ tabs");

  browser.destroy();
  console.log("MZ15_LOCKED_MODE_CAPABILITY_INDEPENDENCE_SMOKE_PASSED");
} finally {
  Module._load = originalLoad;
  fs.rmSync(temporary, { recursive: true, force: true });
}
