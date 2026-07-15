import fs from "node:fs";
import path from "node:path";

let failures = 0;

function ok(message) {
  console.log(`OK ${message}`);
}

function fail(message) {
  failures += 1;
  console.error(`FAIL ${message}`);
}

function read(file) {
  try {
    return fs.readFileSync(file, "utf8");
  } catch {
    fail(`missing file ${file}`);
    return "";
  }
}

function exists(file) {
  if (fs.existsSync(file)) ok(`${file} exists`);
  else fail(`missing file ${file}`);
}

function contains(file, needle) {
  const text = read(file);
  if (text.includes(needle)) ok(`${file} contains ${needle}`);
  else fail(`missing ${needle} in ${file}`);
}

function notContains(file, needle) {
  const text = read(file);
  if (!text.includes(needle)) ok(`${file} does not contain ${needle}`);
  else fail(`${file} must not contain ${needle}`);
}

function scanFiles(root, matcher = /\.(ts|tsx|js|jsx|mjs)$/) {
  const out = [];
  if (!fs.existsSync(root)) return out;

  for (const name of fs.readdirSync(root)) {
    const full = path.join(root, name);
    const stat = fs.statSync(full);

    if (stat.isDirectory()) {
      if (
        name === "node_modules" ||
        name === ".next" ||
        name === ".git" ||
        name === "backups"
      ) {
        continue;
      }
      out.push(...scanFiles(full, matcher));
    } else if (matcher.test(full)) {
      out.push(full);
    }
  }

  return out;
}

const routeFiles = [
  'app/(protected)/market-os/ambassadors/page.tsx',
  'app/(protected)/market-os/ambassadors/directory/page.tsx',
  'app/(protected)/market-os/ambassadors/recruitment/page.tsx',
  'app/(protected)/market-os/ambassadors/leads/page.tsx',
  'app/(protected)/market-os/ambassadors/conversions/page.tsx',
  'app/(protected)/market-os/ambassadors/resources/page.tsx',
  'app/(protected)/market-os/ambassadors/payouts/page.tsx',
  'app/(protected)/market-os/ambassadors/governance/page.tsx',
];

for (const file of routeFiles) exists(file);

const workspace = 'components/market-os/ambassadors/ambassador-production-workspace.tsx';
exists(workspace);
contains(workspace, "AmbassadorProductionWorkspace");
notContains(workspace, "RefferQ");
notContains(workspace, "alert(");
notContains(workspace, "confirm(");
notContains(workspace, "prompt(");

const cockpit = 'components/market-os/ambassadors/routes/AmbassadorCockpitRoute.tsx';
exists(cockpit);
contains(cockpit, "AmbassadorCockpitRoute");
contains(cockpit, "Cockpit de pilotage");
contains(cockpit, "Créer mission");
contains(cockpit, "Nouveau candidat");
contains(cockpit, "Nouveau lead");
contains(cockpit, "Conversions à valider");
contains(cockpit, "Incentives en attente");
notContains(cockpit, "RefferQ");
notContains(cockpit, "alert(");
notContains(cockpit, "confirm(");
notContains(cockpit, "prompt(");

const designFiles = [
  'components/market-os/ambassadors/design/ambassador-design-tokens.ts',
  'components/market-os/ambassadors/design/ambassador-enterprise-primitives.tsx',
];

for (const file of designFiles) {
  if (fs.existsSync(file)) {
    ok(`${file} exists`);
    notContains(file, "RefferQ");
    notContains(file, "alert(");
    notContains(file, "confirm(");
    notContains(file, "prompt(");
  }
}

const server = 'lib/market-os/ambassadors/server.ts';
exists(server);
contains(server, "ENTITY_LIMITS");
contains(server, "loadAmbassadorWorkspaceSnapshot");
contains(server, "createAmbassadorEntity");
contains(server, "assignAmbassadorTerritory");
contains(server, "generateAmbassadorReport");
notContains(server, "RefferQ");

const apiFiles = [
  'app/api/market-os/ambassadors/route.ts',
  'app/api/market-os/ambassadors/reports/export/route.ts',
  'app/api/market-os/ambassadors/operations/route.ts',
  'lib/market-os/ambassadors/api.ts',
];

for (const file of apiFiles) exists(file);

const activeAmbassadorFiles = [
  ...scanFiles('app/(protected)/market-os/ambassadors'),
  ...scanFiles('app/api/market-os/ambassadors'),
  ...scanFiles('components/market-os/ambassadors'),
  ...scanFiles('lib/market-os/ambassadors'),
];

for (const file of activeAmbassadorFiles) {
  const text = read(file);
  if (text.includes("RefferQ")) fail(`${file} contains forbidden RefferQ reference`);
  if (text.includes("ClipboardPaste")) fail(`${file} contains unsupported ClipboardPaste icon`);
}

if (fs.existsSync('app/api/market-os/refferq')) {
  fail('active app/api/market-os/refferq directory must not exist');
} else {
  ok('no active app/api/market-os/refferq directory');
}

if (fs.existsSync('integrations/refferq')) {
  fail('active integrations/refferq directory must not exist');
} else {
  ok('no active integrations/refferq directory');
}

if (failures > 0) {
  console.error(`Ambassador verification failed with ${failures} issue(s).`);
  process.exit(1);
}

console.log("Ambassador Market OS production verification passed.");
