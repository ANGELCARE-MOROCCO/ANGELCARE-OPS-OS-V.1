const fs = require("fs");
const path = require("path");

const ROOTS = ["app", "components", "lib"];
const EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx"]);
const SKIP = new Set(["node_modules", ".next", ".git", "dist", "build"]);

const patterns = [
  { type: "hardcoded_city", regex: /\b(Casablanca|Rabat|Marrakech|Tanger|F[eè]s|Agadir)\b/g },
  { type: "hardcoded_department", regex: /\b(Operations|Academy|Revenue|Market|Finance|Human Resources|HR)\b/g },
  { type: "hardcoded_status_array", regex: /(const|let|var)\s+\w*(status|statuses|cities|departments|categories)\w*\s*=\s*\[/gi },
  { type: "select_without_factory", regex: /<select[\s>]/g },
];

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".") || SKIP.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (EXTENSIONS.has(path.extname(entry.name))) out.push(full);
  }
  return out;
}

const files = ROOTS.flatMap((root) => walk(path.join(process.cwd(), root)));
const findings = [];

for (const file of files) {
  const content = fs.readFileSync(file, "utf8");
  for (const pattern of patterns) {
    const matches = content.match(pattern.regex);
    if (matches && matches.length) {
      findings.push({
        file: path.relative(process.cwd(), file),
        type: pattern.type,
        count: matches.length,
        preview: matches.slice(0, 5),
      });
    }
  }
}

const reportDir = path.join(process.cwd(), "reports");
fs.mkdirSync(reportDir, { recursive: true });
const reportPath = path.join(reportDir, "saas-factory-hardcoded-options-report.json");
fs.writeFileSync(reportPath, JSON.stringify({
  generatedAt: new Date().toISOString(),
  scannedFiles: files.length,
  findingCount: findings.length,
  findings,
}, null, 2));

console.log("SAAS FACTORY HARDCODED OPTIONS SCAN");
console.log("===================================");
console.log(`Scanned files: ${files.length}`);
console.log(`Findings: ${findings.length}`);
console.log(`Report: ${path.relative(process.cwd(), reportPath)}`);

if (findings.length) {
  const grouped = findings.reduce((acc, finding) => {
    acc[finding.type] = (acc[finding.type] || 0) + finding.count;
    return acc;
  }, {});
  console.log("Grouped:", grouped);
}
