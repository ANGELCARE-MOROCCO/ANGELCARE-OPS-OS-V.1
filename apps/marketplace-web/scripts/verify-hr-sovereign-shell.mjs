import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const files = {
  layout: "app/(protected)/hr/layout.tsx",
  shell: "components/hr-shell/HRModuleShell.tsx",
  sidebar: "components/hr-shell/HRSovereignSidebar.tsx",
  broadcast: "components/hr-shell/HRLiveBroadcastBar.tsx",
  styles: "components/hr-shell/HRSovereignShell.module.css",
  snapshot: "lib/hr-shell/snapshot.ts",
  navigation: "lib/hr-shell/navigation.ts",
  identity: "lib/hr-shell/identity.ts",
  types: "lib/hr-shell/types.ts",
  tsconfig: "tsconfig.hr-sovereign-shell.json",
};

let passed = 0;
let failed = 0;
function check(label, condition) {
  if (condition) { console.log(`PASS  ${label}`); passed += 1; }
  else { console.error(`FAIL  ${label}`); failed += 1; }
}
function read(relative) {
  return fs.readFileSync(path.join(root, relative), "utf8");
}

for (const [key, relative] of Object.entries(files)) check(`file ${key}`, fs.existsSync(path.join(root, relative)));
const layout = read(files.layout);
const shell = read(files.shell);
const sidebar = read(files.sidebar);
const broadcast = read(files.broadcast);
const styles = read(files.styles);
const snapshot = read(files.snapshot);
const navigation = read(files.navigation);
const identity = read(files.identity);
const all = [layout, shell, sidebar, broadcast, styles, snapshot, navigation, identity].join("\n");

check("nested HR layout", layout.includes("HRModuleShell") && layout.includes("loadHRShellSnapshot"));
check("manual-refresh snapshot contract", layout.includes('dynamic = "force-dynamic"') && layout.includes("revalidate = 0"));
check("official repository logo component", sidebar.includes('from "@/components/brand/AngelCareLogo"') && sidebar.includes("<AngelCareLogo"));
check("collapsible sidebar", shell.includes("setCollapsed") && sidebar.includes("onToggleCollapsed"));
check("mobile drawer", shell.includes("mobileOpen") && sidebar.includes("sidebarMobileOpen"));
check("route-aware navigation", sidebar.includes("usePathname") && sidebar.includes("isNavigationItemActive"));
check("permission-aware navigation", sidebar.includes("canSeeNavigationItem"));
check("navigation search", sidebar.includes("setQuery") && sidebar.includes("Rechercher un espace RH"));
check("snapshot contains exactly 20 factor keys", (snapshot.match(/^  "[a-z_]+",$/gm) || []).length === 20 && snapshot.includes("HR_SNAPSHOT_FACTOR_COUNT"));
check("snapshot source health", snapshot.includes("sourceHealth") && broadcast.includes("snapshot.sourceHealth"));
check("Africa Casablanca timezone", snapshot.includes('"Africa/Casablanca"'));
check("single CSS feed animation", (styles.match(/@keyframes\s+hr-feed-scroll/g) || []).length === 1);
check("single transform animation track", styles.includes("translate3d") && styles.includes("animation: hr-feed-scroll"));
check("pause on hover and focus", styles.includes(".broadcast:hover .feedTrack") && styles.includes(".broadcast:focus-within .feedTrack"));
check("reduced motion support", styles.includes("prefers-reduced-motion") && styles.includes("animation: none"));
check("legacy full sidebar suppression", styles.includes('aside[class*="h-screen"][class*="border-r"]'));
check("root HR fixed layout normalization", styles.includes('top-[112px]'));
check("no polling", !/setInterval|setTimeout\s*\(|WebSocket|EventSource/.test(all));
check("no browser storage", !/localStorage|sessionStorage|indexedDB|IndexedDB/.test(all));
check("no Framer Motion", !/framer-motion|motion\./.test(all));
check("no TypeScript suppression", !/@ts-ignore|@ts-expect-error|@ts-nocheck/.test(all));
check("no explicit as any", !/\bas\s+any\b/.test(all));
check("no modified logo asset", !/angelcare-official\.(png|jpg|jpeg)|filter:|object-fit:\s*cover/.test(sidebar));
check("snapshot links are operational", broadcast.includes("<Link") && broadcast.includes("factor.href"));
check("static snapshot has no client fetch", !/fetch\s*\(/.test(broadcast + shell + sidebar));
check("nav groups disciplined", (navigation.match(/key: "(command|people|talent|operations|development|governance)"/g) || []).length === 6);

console.log("\n========================================================================");
console.log("ANGELCARE — HR SOVEREIGN SHELL STATIC ACCEPTANCE");
console.log("========================================================================");
console.log(`Checks passed: ${passed}`);
console.log(`Checks failed: ${failed}`);
console.log("Production build: NO");
console.log("Git mutation:     NO");
if (failed) process.exit(1);
console.log("\n✓ HR SOVEREIGN SIDEBAR & LIVE BROADCAST STATIC ACCEPTANCE PASSED");
