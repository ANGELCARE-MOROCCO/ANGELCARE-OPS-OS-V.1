const fs = require("fs");
const path = require("path");

const targets = [
  { moduleKey: "revenue_command_center", label: "Revenue Command Center", roots: ["app/(protected)/revenue-command-center", "components/revenue-command-center", "components/revenue"] },
  { moduleKey: "market_os", label: "Market OS", roots: ["app/(protected)/market-os", "components/market-os"] },
  { moduleKey: "academy", label: "Academy", roots: ["app/(protected)/academy", "components/academy"] },
  { moduleKey: "hr", label: "Human Resources", roots: ["app/(protected)/hr", "components/hr"] },
  { moduleKey: "service_os", label: "Service OS", roots: ["app/(protected)/service-os", "components/service-os"] },
  { moduleKey: "connect", label: "Connect", roots: ["app/(protected)/connect", "components/connect"] },
];

const patterns = [
  { field: "city", group: "cities", component: "FactoryCitySelect", regex: /\b(city|cities|Casablanca|Rabat|Marrakech|Tanger|F[eè]s|Agadir)\b/gi },
  { field: "department", group: "departments", component: "FactoryDepartmentSelect", regex: /\b(department|departments|Operations|Human Resources|Academy|Revenue|Market|Finance|HR)\b/gi },
  { field: "service_category", group: "service_categories", component: "FactoryServiceCategorySelect", regex: /\b(serviceCategory|service_category|Childcare|Academy Training|Care Service)\b/gi },
  { field: "lead_source", group: "lead_sources", component: "FactoryOptionSelect", regex: /\b(leadSource|lead_source|Referral|Website|B2B Partnership|Market Activation)\b/gi },
  { field: "raw_select", group: "unknown", component: "FactoryOptionSelect", regex: /<select[\s>]/g },
];

const exts = new Set([".ts", ".tsx", ".js", ".jsx"]);
const skip = new Set(["node_modules", ".next", ".git", "dist", "build"]);

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".") || skip.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (exts.has(path.extname(entry.name))) out.push(full);
  }
  return out;
}

const findings = [];

for (const target of targets) {
  const files = target.roots.flatMap((root) => walk(path.join(process.cwd(), root)));
  for (const file of files) {
    const content = fs.readFileSync(file, "utf8");
    if (content.includes("FactoryCitySelect") || content.includes("FactoryOptionSelect")) continue;

    for (const pattern of patterns) {
      const matches = content.match(pattern.regex);
      if (!matches?.length) continue;

      findings.push({
        moduleKey: target.moduleKey,
        moduleLabel: target.label,
        file: path.relative(process.cwd(), file),
        field: pattern.field,
        group: pattern.group,
        recommendedComponent: pattern.component,
        count: matches.length,
        preview: matches.slice(0, 8),
      });
    }
  }
}

const report = {
  generatedAt: new Date().toISOString(),
  findingCount: findings.length,
  findings,
};

const reportDir = path.join(process.cwd(), "reports");
fs.mkdirSync(reportDir, { recursive: true });
const reportPath = path.join(reportDir, "saas-factory-phase5-adoption-plan.json");
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

console.log("SAAS FACTORY PHASE 5 ADOPTION PLAN");
console.log("===================================");
console.log(`Findings: ${findings.length}`);
console.log(`Report: ${path.relative(process.cwd(), reportPath)}`);

const grouped = findings.reduce((acc, item) => {
  const key = `${item.moduleKey}.${item.field}`;
  acc[key] = (acc[key] || 0) + item.count;
  return acc;
}, {});
console.log("Grouped:", grouped);
