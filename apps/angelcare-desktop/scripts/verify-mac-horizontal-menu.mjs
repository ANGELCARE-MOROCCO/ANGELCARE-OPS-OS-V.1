import fs from "node:fs";

function read(path) { return fs.readFileSync(path, "utf8"); }
function requireText(value, needle, label) {
  if (!value.includes(needle)) throw new Error(`Missing ${label}: ${needle}`);
}

const main = read("src/main.cjs");
const html = read("src/shell/index.html");
const shell = read("src/shell/shell.js");
const styles = read("src/shell/styles.css");
const defaults = JSON.parse(read("config/defaults.json"));

if (defaults.toolbarHeight !== 108) throw new Error("Desktop toolbar height must reserve 108 pixels.");
for (const action of [
  "go-home",
  "go-whatsapp-os",
  "go-whatsapp-session",
  "go-whatsapp-admin",
  "go-whatsapp-control",
  "open-whatsapp-workspace",
  "hide-whatsapp-workspace",
]) {
  requireText(html, `data-action=\"${action}\"`, `shell action ${action}`);
  requireText(main, `case \"${action}\"`, `IPC allowlist action ${action}`);
}
requireText(html, 'class="desktop-menu"', "in-window desktop menu");
requireText(main, 'async function openWhatsappWorkspace', "governed workspace navigation helper");
requireText(main, 'DESKTOP_ROUTE_PATHS.whatsappSession', "WhatsApp session route");
requireText(main, 'y: toolbarHeight + yWithinSaas', "WhatsApp toolbar offset");
requireText(main, 'height: Math.max(0, height - toolbarHeight)', "SaaS toolbar offset");
requireText(shell, 'function renderNavigation', "active navigation rendering");
requireText(styles, '--runtime-toolbar-height: 108px', "shell toolbar CSS height");
if (/process\.platform\s*===\s*["']win32["'][\s\S]{0,200}desktop-menu/.test(main + html + shell + styles)) {
  throw new Error("The in-window desktop menu must not be restricted to Windows.");
}

console.log("ANGELCARE Desktop horizontal navigation verified for macOS and Windows.");
console.log("Fixed routes, governed WhatsApp workspace opening and WebContentsView toolbar offsets are present.");
