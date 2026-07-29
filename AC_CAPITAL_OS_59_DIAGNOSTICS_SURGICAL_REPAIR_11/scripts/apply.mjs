import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const SIGNATURE = "AC_CAPITAL_OS_59_DIAGNOSTICS_SURGICAL_REPAIR_11";

function locateRepository() {
  const starts = [process.cwd(), path.dirname(fileURLToPath(import.meta.url))];
  for (const start of starts) {
    let current = path.resolve(start);
    for (let index = 0; index < 10; index += 1) {
      if (fs.existsSync(path.join(current, "apps", "ops-web", "package.json"))) return current;
      const parent = path.dirname(current);
      if (parent === current) break;
      current = parent;
    }
  }
  throw new Error("FAIL: AngelCare repository root was not found.");
}

const root = locateRepository();
const ops = path.join(root, "apps", "ops-web");
const changes = new Map();

function read(relative) {
  const absolute = path.join(ops, relative);
  if (!fs.existsSync(absolute)) throw new Error(`FAIL: Missing required file: ${relative}`);
  return changes.has(absolute) ? changes.get(absolute) : fs.readFileSync(absolute, "utf8");
}

function replaceOnce(relative, oldText, newText) {
  const absolute = path.join(ops, relative);
  const source = read(relative);
  const count = source.split(oldText).length - 1;
  if (count === 0) {
    if (source.includes(newText)) return;
    throw new Error(`FAIL: Repair anchor not found in ${relative}`);
  }
  if (count !== 1) throw new Error(`FAIL: Expected one repair anchor in ${relative}; found ${count}.`);
  changes.set(absolute, source.replace(oldText, newText));
}

replaceOnce(
  "components/ac-capital-os/pages/certification/CertificationPage.tsx",
  "  const mergedWorkspaces = useMemo(\n",
  "  const mergedWorkspaces = useMemo<Row[]>(\n",
);
replaceOnce(
  "components/ac-capital-os/pages/certification/CertificationPage.tsx",
  "  const mergedScenarios = useMemo(\n",
  "  const mergedScenarios = useMemo<Row[]>(\n",
);

replaceOnce(
  "components/ac-capital-os/core/AsyncState.tsx",
  `export function EmptyState({ title, copy, action, onAction }: { title: string; copy: string; action: string; onAction: () => void }) {
  return <div className={styles.emptyState}><div className={styles.emptyIcon}><DatabaseZap size={26} /></div><strong>{title}</strong><p>{copy}</p><button onClick={onAction}>{action}</button><small>Nothing is represented as live until the API confirms it.</small></div>;
}`,
  `export function EmptyState({
  title,
  copy,
  action,
  onAction,
}: {
  title: string;
  copy: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className={styles.emptyState}>
      <div className={styles.emptyIcon}><DatabaseZap size={26} /></div>
      <strong>{title}</strong>
      <p>{copy}</p>
      {action && onAction ? <button onClick={onAction}>{action}</button> : null}
      <small>Nothing is represented as live until the API confirms it.</small>
    </div>
  );
}`,
);

replaceOnce(
  "components/ac-capital-os/pages/orchestrator/OrchestratorPage.tsx",
  `<span>{label}</span><strong>{id ? text(id).slice(0, 12) : "Not created"}</strong>`,
  `<span>{text(label)}</span><strong>{id ? text(id).slice(0, 12) : "Not created"}</strong>`,
);

replaceOnce(
  "app/api/ac-capital-os/agents/run/route.ts",
  `    });
    const execution = await processCapitalEventById(actor, clean(event.id));`,
  `    });
    if (!event?.id) {
      throw Object.assign(
        new Error("AC_CAPITAL_EVENT_PERSISTENCE_FAILED"),
        { status: 500 },
      );
    }
    const execution = await processCapitalEventById(actor, clean(event.id));`,
);

replaceOnce(
  "lib/ac-capital-os/server/capital-orchestrator.ts",
  `      action: "create-opportunity-from-source",
      payload: { sourceId: entityId, reason: \`Orchestrated from \${type}\` },`,
  `      action: "create-opportunity-from-source",
      body: { sourceId: entityId, reason: \`Orchestrated from \${type}\` },`,
);
replaceOnce(
  "lib/ac-capital-os/server/capital-orchestrator.ts",
  `    output = await executeRadarWorkbenchAction({ action: "convert-full-chain", payload: { opportunityId: clean(payload.opportunityId), reason: \`Orchestrated from \${type}\` }, actor: actor as any });`,
  `    output = await executeRadarWorkbenchAction({ action: "convert-full-chain", body: { opportunityId: clean(payload.opportunityId), reason: \`Orchestrated from \${type}\` }, actor: actor as any });`,
);

replaceOnce(
  "lib/ac-capital-os/server/free-provider-runtime.ts",
  "number(row.strategicValueScore, row.relevanceScore)",
  "number(row.strategicValueScore, number(row.relevanceScore, 50))",
);

replaceOnce(
  "lib/ac-capital-os/server/radar-workbench.ts",
  `export async function executeRadarWorkbenchAction(input: {
  action: string;
  body: JsonRecord;
  actor: { id: string; name: string; email: string };
}) {`,
  `export async function executeRadarWorkbenchAction(input: {
  action: string;
  body: JsonRecord;
  actor: { id: string; name: string; email: string };
}): Promise<JsonRecord> {`,
);

replaceOnce(
  "app/api/ac-capital-os/artifacts/route.ts",
  "    let content = deterministicArtifactContent({ artifactType, title, context });",
  "    let content: JsonRecord = deterministicArtifactContent({ artifactType, title, context });",
);

const componentRoot = path.join(ops, "components", "ac-capital-os");
const cssImportPattern = /import\s+styles\s+from\s+["'](\.\/[^"']+\.module\.css)["']/g;
const cssModules = new Set();
let cssImportSites = 0;

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(absolute);
    else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
      const source = changes.has(absolute) ? changes.get(absolute) : fs.readFileSync(absolute, "utf8");
      for (const match of source.matchAll(cssImportPattern)) {
        cssImportSites += 1;
        const cssPath = path.resolve(path.dirname(absolute), match[1]);
        if (!fs.existsSync(cssPath)) throw new Error(`FAIL: Referenced CSS module is missing: ${cssPath}`);
        cssModules.add(cssPath);
      }
    }
  }
}
walk(componentRoot);

const declaration = "declare const styles: Readonly<Record<string, string>>;\nexport default styles;\n";
for (const cssPath of [...cssModules].sort()) {
  const declarationPath = `${cssPath}.d.ts`;
  const current = fs.existsSync(declarationPath) ? fs.readFileSync(declarationPath, "utf8") : null;
  if (current !== declaration) changes.set(declarationPath, declaration);
}

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupRoot = path.join(root, ".angelcare_backups", `ac-capital-59-diagnostics-repair-${timestamp}`);
fs.mkdirSync(backupRoot, { recursive: true });

for (const [absolute, content] of changes) {
  if (fs.existsSync(absolute)) {
    const relative = path.relative(root, absolute);
    const backup = path.join(backupRoot, relative);
    fs.mkdirSync(path.dirname(backup), { recursive: true });
    fs.copyFileSync(absolute, backup);
  }
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(absolute, content, "utf8");
}

const manifest = {
  signature: SIGNATURE,
  appliedAt: new Date().toISOString(),
  repositoryRoot: root,
  filesWritten: [...changes.keys()].map((file) => path.relative(root, file)),
  cssImportSites,
  cssModulesDeclared: cssModules.size,
  sha256: Object.fromEntries([...changes].map(([file, content]) => [path.relative(root, file), crypto.createHash("sha256").update(content).digest("hex")])),
};
fs.writeFileSync(path.join(backupRoot, "repair-manifest.json"), JSON.stringify(manifest, null, 2));

console.log("AC_CAPITAL_OS_59_DIAGNOSTICS_SURGICAL_REPAIR_11_APPLIED");
console.log(`Source contract files repaired: 8`);
console.log(`CSS import sites covered: ${cssImportSites}`);
console.log(`Unique CSS module declarations present: ${cssModules.size}`);
console.log(`Files written: ${changes.size}`);
console.log(`Backup: ${path.relative(root, backupRoot)}`);
console.log("No TypeScript, build, SQL, Git, provider, commit, push or deployment command was run.");
