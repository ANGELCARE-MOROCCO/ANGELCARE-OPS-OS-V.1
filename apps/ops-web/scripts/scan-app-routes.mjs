import fs from "fs";
import path from "path";

const root = process.cwd();
const protectedDir = path.join(root, "app", "(protected)");
const outDir = path.join(root, "lib", "generated");
const outFile = path.join(outDir, "app-routes.ts");

const MODULE_LABELS = {
  academy: "Academy",
  admin: "Admin",
  billing: "Billing",
  caregivers: "Caregivers",
  contracts: "Contracts",
  families: "Families",
  hr: "HR",
  incidents: "Incidents",
  leads: "Leads",
  locations: "Locations",
  "market-os": "Market OS",
  missions: "Missions",
  operations: "Operations",
  pointage: "Pointage",
  print: "Print",
  profile: "Profile",
  reports: "Reports",
  "revenue-command-center": "Revenue Command Center",
  sales: "Sales",
  services: "Services",
  users: "Users",
  "voice-center": "Voice Center",
  dashboard: "Dashboard"
};

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    if (entry.isFile() && entry.name === "page.tsx") return [full];
    return [];
  });
}

function titleize(value) {
  return value
    .replaceAll("-", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function toRoute(file) {
  const relative = path.relative(protectedDir, path.dirname(file));
  const href = "/" + relative.replaceAll(path.sep, "/");
  const cleanHref = href === "/." ? "/" : href;

  const parts = cleanHref.split("/").filter(Boolean);
  const module = parts[0] || "dashboard";
  const moduleLabel = MODULE_LABELS[module] || titleize(module);

  const leaf = parts.length ? parts[parts.length - 1] : "dashboard";
  const label = parts.length ? parts.map(titleize).join(" / ") : "Dashboard";

  return {
    label,
    shortLabel: titleize(leaf),
    href: cleanHref,
    module,
    moduleLabel,
    permissionKey: `page:${cleanHref}`,
    modulePermissionKey: `${module}.view`,
  };
}

const routes = walk(protectedDir)
  .map(toRoute)
  .filter((route) => !route.href.includes("["))
  .sort((a, b) => {
    if (a.module === b.module) return a.href.localeCompare(b.href);
    return a.module.localeCompare(b.module);
  });

const permissions = routes.map((route) => ({
  value: route.permissionKey,
  label: route.label,
  module: route.module,
  moduleLabel: route.moduleLabel,
  href: route.href,
}));

fs.mkdirSync(outDir, { recursive: true });

fs.writeFileSync(
  outFile,
  `export const APP_ROUTES = ${JSON.stringify(routes, null, 2)} as const;\n\n` +
  `export const APP_ROUTE_PERMISSIONS = ${JSON.stringify(permissions, null, 2)} as const;\n\n` +
  `export type AppRoute = typeof APP_ROUTES[number];\n` +
  `export type AppRoutePermission = typeof APP_ROUTE_PERMISSIONS[number];\n`
);

console.log(`Generated ${routes.length} routes → lib/generated/app-routes.ts`);
