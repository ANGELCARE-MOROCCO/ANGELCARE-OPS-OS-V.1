import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

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
const requireFromOps = createRequire(path.join(ops, "package.json"));
const ts = requireFromOps("typescript");
const tsconfigPath = path.join(ops, "tsconfig.json");
const configRead = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
if (configRead.error) throw new Error(ts.flattenDiagnosticMessageText(configRead.error.messageText, "\n"));
const parsed = ts.parseJsonConfigFileContent(configRead.config, ts.sys, ops, { noEmit: true, incremental: false }, tsconfigPath);

const includedRoots = [
  path.join(ops, "app", "(protected)", "ac-capital-os"),
  path.join(ops, "app", "api", "ac-capital-os"),
  path.join(ops, "components", "ac-capital-os"),
  path.join(ops, "lib", "ac-capital-os"),
];
const rootNames = parsed.fileNames.filter((file) => includedRoots.some((directory) => file.startsWith(directory + path.sep)) || file === path.join(ops, "next-env.d.ts"));
const program = ts.createProgram({ rootNames, options: parsed.options });
const diagnostics = ts.getPreEmitDiagnostics(program).filter((diagnostic) => {
  if (!diagnostic.file) return false;
  return includedRoots.some((directory) => diagnostic.file.fileName.startsWith(directory + path.sep));
});

if (diagnostics.length) {
  for (const diagnostic of diagnostics) {
    const file = diagnostic.file;
    const start = diagnostic.start ?? 0;
    const position = file.getLineAndCharacterOfPosition(start);
    const relative = path.relative(ops, file.fileName);
    const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
    console.error(`${relative}:${position.line + 1}:${position.character + 1} — TS${diagnostic.code} — ${message}`);
  }
  throw new Error(`AC_CAPITAL_OS_DIAGNOSTICS_REMAIN:${diagnostics.length}`);
}

console.log("AC_CAPITAL_OS_59_DIAGNOSTICS_SURGICAL_REPAIR_11_VERIFIED");
console.log(`Focused AC Capital TypeScript/TSX files: ${rootNames.length}`);
console.log("Unique AC Capital diagnostics: 0");
