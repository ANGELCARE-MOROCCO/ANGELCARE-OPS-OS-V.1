import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import Module, { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);

function fail(message) {
  console.error(`MEGA_ZIP_7_VERIFY_FAILED: ${message}`);
  process.exit(1);
}

function read(relativePath) {
  const file = path.join(root, relativePath);
  if (!fs.existsSync(file)) fail(`Missing ${relativePath}`);
  return fs.readFileSync(file, "utf8");
}

function assertIncludes(relativePath, markers) {
  const source = read(relativePath);
  for (const marker of markers) {
    if (!source.includes(marker)) fail(`${relativePath} is missing marker: ${marker}`);
  }
}

const packageJson = JSON.parse(read("package.json"));
if (!["1.5.1", "1.5.2", "1.6.0", "1.7.2"].includes(packageJson.version)) fail(`Expected version 1.5.1 or a supported cumulative version, found ${packageJson.version}`);
if (!String(packageJson.scripts?.verify || "").includes("verify-unified-release-1.7.2.mjs")) {
  fail("Unified 1.7.2 verifier is not wired into npm run verify");
}

const packageLock = JSON.parse(read("package-lock.json"));
if (packageLock.version !== packageJson.version || packageLock.packages?.[""]?.version !== packageJson.version) {
  fail("package-lock.json version is not synchronized to 1.5.1");
}

assertIncludes("src/runtime/corporate-browser.cjs", [
  "SYSTEM_TAB_ZOOM_PARITY_V1",
  "const systemZooms = new Map",
  "getSystemTabWebContents = () => null",
  "function applySystemZoom(id)",
  "systemZooms: Object.fromEntries(systemZooms)",
  "ACTIVE_ZOOMABLE_TAB_REQUIRED",
]);

assertIncludes("src/runtime/station-controller.cjs", [
  "getSystemTabWebContents = () => null",
  "getSystemTabWebContents,",
]);

assertIncludes("src/main.cjs", [
  "SYSTEM_TAB_ZOOM_PARITY_V1",
  "function getSystemTabWebContents(tabId)",
  'applySystemZoom("whatsapp-system")',
  'applySystemZoom("angelcare-system")',
]);

assertIncludes("src/shell/shell.js", [
  'tab.type==="angelcare-system"',
  'tab.type==="whatsapp-system"',
  '$("zoom-out").disabled=!tab',
  '$("zoom-in").disabled=!tab',
  '$("zoom-value").disabled=!tab',
]);

for (const relativePath of [
  "src/runtime/corporate-browser.cjs",
  "src/runtime/station-controller.cjs",
  "src/main.cjs",
  "src/shell/shell.js",
  "scripts/verify-mega-zip-7.mjs",
]) {
  const result = spawnSync(process.execPath, ["--check", path.join(root, relativePath)], {
    cwd: root,
    encoding: "utf8",
  });
  if (result.status !== 0) {
    fail(`${relativePath} syntax check failed: ${result.stderr || result.stdout}`);
  }
}

const originalLoad = Module._load;
Module._load = function patchedLoad(request, parent, isMain) {
  if (request === "electron") {
    return {
      session: { fromPartition: () => ({}) },
      WebContentsView: class {},
    };
  }
  return originalLoad.call(this, request, parent, isMain);
};

const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "angelcare-system-zoom-"));
try {
  const { createCorporateBrowser } = require(path.join(root, "src/runtime/corporate-browser.cjs"));
  const factors = { "angelcare-system": 1, "whatsapp-system": 1 };
  const webContents = Object.fromEntries(
    Object.keys(factors).map((id) => [
      id,
      {
        isDestroyed: () => false,
        setZoomFactor: (value) => {
          factors[id] = value;
        },
      },
    ]),
  );

  const browser = createCorporateBrowser({
    app: {
      getPath: () => temporary,
      getVersion: () => "1.5.1",
    },
    mainWindow: {
      contentView: {
        addChildView() {},
        removeChildView() {},
      },
    },
    logger: {
      info() {},
      warn() {},
      error() {},
    },
    dialog: {},
    shell: {
      openPath: async () => "",
    },
    getBounds: () => ({ x: 0, y: 0, width: 1000, height: 700 }),
    getSystemTabWebContents: (id) => webContents[id] || null,
    getSystemTabStatus: (id) => ({ activated: id !== "whatsapp-system" || true }),
  });

  const zoomOf = (state, id) => state.tabs.find((tab) => tab.id === id)?.zoom;

  let state = browser.zoomOut("angelcare-system");
  if (zoomOf(state, "angelcare-system") !== 0.9 || factors["angelcare-system"] !== 0.9) {
    fail("ANGELCARE system-tab zoom-out did not reach its WebContents");
  }

  state = browser.zoomIn("whatsapp-system");
  if (zoomOf(state, "whatsapp-system") !== 1.1 || factors["whatsapp-system"] !== 1.1) {
    fail("WhatsApp system-tab zoom-in did not reach its WebContents");
  }

  browser.activateTab("whatsapp-system");
  state = browser.zoomOut();
  if (zoomOf(state, "whatsapp-system") !== 1 || factors["whatsapp-system"] !== 1) {
    fail("Active protected-tab zoom routing failed");
  }

  for (let index = 0; index < 30; index += 1) state = browser.zoomOut("angelcare-system");
  if (zoomOf(state, "angelcare-system") !== 0.6) fail("Minimum 60% zoom clamp failed");

  for (let index = 0; index < 30; index += 1) state = browser.zoomIn("whatsapp-system");
  if (zoomOf(state, "whatsapp-system") !== 2) fail("Maximum 200% zoom clamp failed");

  const persisted = JSON.parse(
    fs.readFileSync(path.join(temporary, "corporate-tabs.json"), "utf8"),
  );
  if (persisted.schemaVersion !== 3) fail("System-tab zoom persistence schema is not version 3");
  if (persisted.systemZooms?.["angelcare-system"] !== 0.6) fail("ANGELCARE zoom was not persisted");
  if (persisted.systemZooms?.["whatsapp-system"] !== 2) fail("WhatsApp zoom was not persisted");
} finally {
  Module._load = originalLoad;
  fs.rmSync(temporary, { recursive: true, force: true });
}

console.log("ANGELCARE Desktop Mega ZIP 7 system-tab zoom parity verified.");
console.log("ANGELCARE, WhatsApp and governed corporate tabs support independent 60%-200% page zoom.");
