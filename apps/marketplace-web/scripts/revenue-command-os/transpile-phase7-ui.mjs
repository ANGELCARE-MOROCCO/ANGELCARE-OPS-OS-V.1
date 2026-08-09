import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

async function loadTypeScript() {
  try {
    return (await import('typescript')).default;
  } catch {
    const npmRoot = execFileSync('npm', ['root', '-g'], { encoding: 'utf8' }).trim();
    return (await import(pathToFileURL(path.join(npmRoot, 'typescript/lib/typescript.js')).href)).default;
  }
}

const ts = await loadTypeScript();
const root = process.cwd();
const files = [];
function walk(directory) {
  if (!fs.existsSync(directory)) return;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(absolute);
    else if (/\.(ts|tsx)$/.test(entry.name)) files.push(absolute);
  }
}
walk(path.join(root, 'app/(protected)/revenue-command-os/command-kernel'));
walk(path.join(root, 'app/api/revenue-command-os/command-kernel'));
let errors = 0;
for (const file of files) {
  const source = fs.readFileSync(file, 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: {
      jsx: ts.JsxEmit.ReactJSX,
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
    },
    reportDiagnostics: true,
    fileName: file,
  });
  for (const diagnostic of output.diagnostics ?? []) {
    if (diagnostic.category === ts.DiagnosticCategory.Error) {
      errors += 1;
      console.error(file, ts.flattenDiagnosticMessageText(diagnostic.messageText, ' '));
    }
  }
}
console.log(`MZ07 UI/API transpile: ${files.length} files, ${errors} errors`);
if (errors) process.exit(1);
