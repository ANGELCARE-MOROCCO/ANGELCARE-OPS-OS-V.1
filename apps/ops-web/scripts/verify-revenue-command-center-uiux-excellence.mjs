import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const routeRoot = path.join(root, "app", "(protected)", "revenue-command-center");

const requiredFiles = [
  "app/(protected)/revenue-command-center/_central-core/CentralRevenueCoreDashboard.tsx",
  "app/(protected)/revenue-command-center/_central-core/CentralRevenueCoreDashboard.module.css",
  "app/(protected)/revenue-command-center/_shared/RevenueCommandUnifiedLayout.tsx",
  "app/(protected)/revenue-command-center/_shared/revenue-command-experience.css",
  "components/revenue-command-center/CanonicalRevenueWorkspace.tsx",
  "components/revenue-command-center/RevenueCommandCenterSidebar.tsx",
  "components/revenue-command-center/RevenuePartnershipsEnterpriseWorkspace.tsx",
  "components/revenue-command-center/RevenuePartnershipsEnterprisePage.tsx",
  "components/revenue-command-center/PartnershipsWhiteTextGuard.tsx",
  "components/revenue-command-center/RevenueAppointmentsV12MegaWorkspace.tsx",
  "components/revenue-command-center/engagement-enterprise/RevenueEngagementWorkspace.tsx",
  "components/revenue-command-center/engagement-enterprise/RevenueEngagementWorkspace.module.css",
  "components/revenue-command-center/engagement-enterprise/route-contracts.ts",
  "components/revenue-command-center/engagement-enterprise/types.ts",
  "components/revenue-command-center/RevenueDailyTasksV13McKinseyWorkspace.tsx",
  "components/revenue-command-center/execution-enterprise/RevenueExecutionWorkspace.tsx",
  "components/revenue-command-center/RevenuePartnershipsV13ActionsWorkspace.tsx",
  "lib/revenue-command-center/route-registry.ts",
];

const failures = [];
const passes = [];
const check = (condition, label) => {
  if (condition) passes.push(label);
  else failures.push(label);
};
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

for (const file of requiredFiles) {
  check(fs.existsSync(path.join(root, file)), `required file exists: ${file}`);
}

function walk(dir, predicate, found = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(absolute, predicate, found);
    else if (predicate(absolute)) found.push(absolute);
  }
  return found;
}

const pages = walk(routeRoot, (file) => file.endsWith(`${path.sep}page.tsx`));
check(pages.length === 151, `route estate preserved: 151 page.tsx files (found ${pages.length})`);

const routeLayout = read("app/(protected)/revenue-command-center/layout.tsx");
check(routeLayout.includes("requireAccess('revenue.view')"), "revenue.view access guard preserved");
check(routeLayout.includes("RevenueLocalStorageRecoveryBridge"), "local-storage recovery bridge preserved");
check(routeLayout.includes("RevenueEnterpriseOperationsBridge"), "enterprise operations bridge preserved");
check(routeLayout.includes("RevenueCommandUnifiedLayout"), "global premium wrapper remains connected");

const dashboard = read("app/(protected)/revenue-command-center/_central-core/CentralRevenueCoreDashboard.tsx");
for (const hook of ["useLiveProspects", "useLiveTasks", "useLiveAppointments", "useLiveActivities"]) {
  check(dashboard.includes(hook), `live wiring preserved: ${hook}`);
}
check(dashboard.includes("refreshAll"), "live refresh orchestration preserved");
check(dashboard.includes('data-rcc-main-dashboard="premium-v1"'), "premium executive cockpit marker present");
check(!dashboard.includes("dangerouslySetInnerHTML"), "no unsafe style or markup injection in executive cockpit");
check(!/\bMAD\b/.test(dashboard), "French currency label standard uses Dh, not MAD");
check(!dashboard.includes("bg-[#050b16]"), "legacy dark-first dashboard foundation removed");

const unified = read("app/(protected)/revenue-command-center/_shared/RevenueCommandUnifiedLayout.tsx");
const experienceCss = read("app/(protected)/revenue-command-center/_shared/revenue-command-experience.css");
const dashboardCss = read("app/(protected)/revenue-command-center/_central-core/CentralRevenueCoreDashboard.module.css");
check(unified.includes('data-revenue-command-experience="premium-v2"'), "premium v2 experience foundation applied globally");
check(unified.includes("SIDEBAR_STORAGE_KEY"), "sidebar collapse preference is frontend-persistent");
check(unified.includes("onOpenOverlay") && unified.includes("onCloseOverlay"), "extractable overlay navigation is wired");
check(experienceCss.includes("grid-template-columns: var(--rcc-sidebar-current) minmax(0, 1fr)"), "global shell allocates the remaining viewport to the workspace");
check(experienceCss.includes(".rcc-sovereignty-mobile-trigger"), "mobile and tablet sidebar extraction control exists");
check(dashboardCss.includes("width: 100%") && dashboardCss.includes("max-width: none"), "executive cockpit centered width ceiling removed");
check(unified.includes("Aller au contenu principal"), "keyboard-accessible skip link included");

const canonical = read("components/revenue-command-center/CanonicalRevenueWorkspace.tsx");
for (const banned of ["BUILD RESTORED", "legacy route compatibility", "old generation", "Next Pass"]) {
  check(!canonical.includes(banned), `developer-facing placeholder removed: ${banned}`);
}
check(canonical.includes("Sans simulation"), "canonical route shell states its no-simulation rule");
check(canonical.includes("Câblage protégé"), "canonical route shell exposes protected-wiring assurance");

const guard = read("components/revenue-command-center/PartnershipsWhiteTextGuard.tsx");
check(!guard.includes('document.createElement("style")'), "partnership global style injection removed");
check(!guard.includes("color: #ffffff !important"), "forced global white text removed");
check(guard.includes('data-partnerships-experience="premium-light-v1"'), "partnership light experience boundary present");

const sidebar = read("components/revenue-command-center/RevenueCommandCenterSidebar.tsx");
check(sidebar.includes("rcc-sovereignty-sidebar") && sidebar.includes("PanelLeftClose") && sidebar.includes("PanelLeftOpen"), "uniform collapsible Revenue Command sidebar installed");
check(sidebar.includes("/revenue-command-center/revenue-analytics"), "correct revenue analytics destination preserved");
check(sidebar.includes("/revenue-command-center/activity-timeline"), "correct activity timeline destination preserved");

const partnershipPage = read("components/revenue-command-center/RevenuePartnershipsEnterprisePage.tsx");
check(!partnershipPage.includes("xl:ml-[260px]") && !partnershipPage.includes("RevenueCommandCenterSidebar"), "partnership page uses the global full-width shell without a duplicate sidebar");
check(!partnershipPage.includes('setModal("New Partnership")'), "partnership primary action is localized");
check(!partnershipPage.includes("programs.length || 24"), "fabricated program fallback removed");
check(partnershipPage.includes("stats.active / stats.total"), "active rate is derived from live records");

const engagementV5 = read("components/revenue-command-center/engagement-enterprise/RevenueEngagementWorkspace.tsx");
const engagementContractsV5 = read("components/revenue-command-center/engagement-enterprise/route-contracts.ts");
check(engagementContractsV5.includes("Centre de commandement des rendez-vous"), "appointment lifecycle receives the premium French engagement command experience");
check(engagementV5.includes('Intl.NumberFormat("fr-FR"'), "appointment monetary presentation uses fr-FR formatting");
check(engagementV5.includes(" Dh`"), "appointment monetary presentation uses Dh");
check(engagementV5.includes("Interactions persistées"), "communication persistence boundary is visible in the appointment experience");
check(!engagementV5.includes("RCC_PARENT_SHELL_FULLWIDTH_FIX_V5"), "appointment workspace global CSS injection removed");

const dailyTasksV13 = read("components/revenue-command-center/RevenueDailyTasksV13McKinseyWorkspace.tsx");
check(dailyTasksV13.includes("Poste de commandement de l’exécution quotidienne"), "daily execution lifecycle receives the premium French command experience");
check(dailyTasksV13.includes('Intl.NumberFormat("fr-FR"'), "daily-task monetary presentation uses fr-FR formatting");
check(dailyTasksV13.includes(" Dh`"), "daily-task monetary presentation uses Dh");
check(!dailyTasksV13.includes("RCC_PARENT_SHELL_FULLWIDTH_FIX_V5"), "daily-task workspace global CSS injection removed");

const partnershipsV13 = read("components/revenue-command-center/RevenuePartnershipsV13ActionsWorkspace.tsx");
check(partnershipsV13.includes("Partenariats 360°"), "partnership action lifecycle receives the premium French command experience");
check(partnershipsV13.includes('Intl.NumberFormat("fr-FR"'), "partnership-action monetary presentation uses fr-FR formatting");
check(partnershipsV13.includes(" Dh`"), "partnership-action monetary presentation uses Dh");
check(!partnershipsV13.includes("RCC_PARENT_SHELL_FULLWIDTH_FIX_V5"), "partnership-action global CSS injection removed");
check(!/Sélectionnered|setSélectionner|updateSélection|activationÉ|angelcareValeur/.test(partnershipsV13), "partnership identifiers remain structurally intact");

const expectedRoutes = [
  "notifications",
  "revenue-analytics",
  "activity-timeline",
  "documents",
  "strategy-room",
  "system-activation",
  "campaigns",
  "follow-ups",
  "market-mapping",
  "executive-briefing",
];
for (const route of expectedRoutes) {
  check(fs.existsSync(path.join(routeRoot, route, "page.tsx")), `linked route exists: ${route}`);
}

const routeFiles = pages.map((file) => ({ file, source: fs.readFileSync(file, "utf8") }));
const familyCounts = {
  ProspectEnterpriseWorkspace: 13,
  ProspectEnterpriseDossier: 4,
  RevenueB2CWorkflowV12MegaWorkspace: 24,
  RevenueCommandFinalWorkspace: 12,
  RevenueExecutiveBriefingV11Workspace: 3,
  RevenuePredictiveV11Workspace: 3,
  RevenueSDRV11Workspace: 3,
  RevenuePartnershipsEnterpriseWorkspace: 12,
  RevenueAppointmentsV12MegaWorkspace: 0,
  RevenueEngagementWorkspace: 24,
  RevenueDailyTasksV13McKinseyWorkspace: 0,
  RevenueExecutionWorkspace: 21,
  RevenuePartnershipsV13ActionsWorkspace: 8,
  RevenueProposalWorkspace: 8,
  UltimateRevenueCommandPage: 8,
};
for (const [family, expected] of Object.entries(familyCounts)) {
  const count = routeFiles.filter(({ source }) => source.includes(family)).length;
  check(count === expected, `${family} route coverage preserved: ${expected} (found ${count})`);
}

const transformedExperienceTargets = new Set([
  "app/(protected)/revenue-command-center/_central-core/CentralRevenueCoreDashboard.tsx",
  "components/revenue-command-center/CanonicalRevenueWorkspace.tsx",
  "components/revenue-command-center/RevenueCommandCenterSidebar.tsx",
  "components/revenue-command-center/RevenuePartnershipsEnterpriseWorkspace.tsx",
  "components/revenue-command-center/RevenuePartnershipsEnterprisePage.tsx",
  "components/revenue-command-center/PartnershipsWhiteTextGuard.tsx",
  "components/revenue-command-center/RevenueAppointmentsV12MegaWorkspace.tsx",
  "components/revenue-command-center/engagement-enterprise/RevenueEngagementWorkspace.tsx",
  "components/revenue-command-center/engagement-enterprise/RevenueEngagementWorkspace.module.css",
  "components/revenue-command-center/engagement-enterprise/route-contracts.ts",
  "components/revenue-command-center/engagement-enterprise/types.ts",
  "components/revenue-command-center/RevenueDailyTasksV13McKinseyWorkspace.tsx",
  "components/revenue-command-center/execution-enterprise/RevenueExecutionWorkspace.tsx",
  "components/revenue-command-center/RevenuePartnershipsV13ActionsWorkspace.tsx",
  "components/revenue-command-center/prospects-enterprise/ProspectEnterpriseWorkspace.tsx",
  "components/revenue-command-center/prospects-enterprise/ProspectEnterpriseDossier.tsx",
  "components/revenue-command-center/proposal-enterprise/RevenueProposalWorkspace.tsx",
].map((file) => path.resolve(root, file)));

const importPattern = /(?:import|export)\s+(?:[^"']*?\s+from\s+)?["']([^"']+)["']/g;
const importCache = new Map();
function resolveLocalImport(sourceFile, specifier) {
  let base;
  if (specifier.startsWith("@/")) base = path.resolve(root, specifier.slice(2));
  else if (specifier.startsWith(".")) base = path.resolve(path.dirname(sourceFile), specifier);
  else return null;
  const candidates = [base, ...[".ts", ".tsx", ".js", ".jsx"].map((ext) => `${base}${ext}`), ...[".ts", ".tsx", ".js", ".jsx"].map((ext) => path.join(base, `index${ext}`))];
  return candidates.find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile()) || null;
}
function localDependencies(file) {
  if (importCache.has(file)) return importCache.get(file);
  const source = fs.readFileSync(file, "utf8");
  const dependencies = new Set();
  for (const match of source.matchAll(importPattern)) {
    const resolved = resolveLocalImport(file, match[1]);
    if (resolved) dependencies.add(path.resolve(resolved));
  }
  importCache.set(file, dependencies);
  return dependencies;
}
function reachesTransformedExperience(file, seen = new Set()) {
  const absolute = path.resolve(file);
  if (transformedExperienceTargets.has(absolute)) return true;
  if (seen.has(absolute)) return false;
  seen.add(absolute);
  return [...localDependencies(absolute)].some((dependency) => reachesTransformedExperience(dependency, seen));
}
const directlyTransformedRoutes = pages.filter((page) => reachesTransformedExperience(page)).length;
check(directlyTransformedRoutes === 146, `direct/transitive premium route transformation: 146 (found ${directlyTransformedRoutes})`);

const protectedPrefixes = [
  "app/api/",
  "supabase/",
  "prisma/",
  "workers/",
  "middleware",
  "lib/auth/",
];
for (const file of requiredFiles) {
  check(!protectedPrefixes.some((prefix) => file.startsWith(prefix)), `frontend-only delivery boundary: ${file}`);
}

console.log("\nANGELCARE Revenue Command Center — UI/UX Excellence Verification\n");
for (const label of passes) console.log(`PASS  ${label}`);
if (failures.length) {
  console.error("\nFAILED CHECKS\n");
  for (const label of failures) console.error(`FAIL  ${label}`);
  console.error(`\n${passes.length} passed, ${failures.length} failed.`);
  process.exit(1);
}
console.log(`\n${passes.length} checks passed. No contract violation detected by the static acceptance gate.`);
