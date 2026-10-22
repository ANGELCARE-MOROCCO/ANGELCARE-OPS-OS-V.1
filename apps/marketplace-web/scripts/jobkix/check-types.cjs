const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const app = path.resolve(__dirname, '../..');
const config = ts.readConfigFile(path.join(app, 'tsconfig.json'), ts.sys.readFile);
if (config.error) throw Error(ts.flattenDiagnosticMessageText(config.error.messageText, '\n'));
const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, app);
const roots = [];
function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (/\.tsx?$/.test(entry.name)) roots.push(file);
  }
}
for (const dir of ['angelcare-marketplace/jobkix','app/jobkix','app/api/jobkix','app/angelcare-marketplace/(protected)/admin/jobkix']) walk(path.join(app, dir));
// Existing ambient bridge declarations are required by the registered root-layout transitive imports.
roots.push(path.join(app,'types/angelcare-desktop.d.ts'));
// Include registered shared edits as explicit roots, plus their actual transitive dependencies.
const crypto=require('node:crypto');
const shared=JSON.parse(fs.readFileSync(path.join(app,'docs/jobkix/shared-file-register.json'),'utf8'));
for(const entry of shared){const relative=entry.path.replace(/^apps\/marketplace-web\//,''),file=path.join(app,relative);if(!/\.tsx?$/.test(file)||!fs.existsSync(file))continue;const hash=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');if(hash!==entry.baselineSha256&&!roots.includes(file))roots.push(file);}
const program = ts.createProgram(roots, { ...parsed.options, noEmit: true, incremental: false, tsBuildInfoFile: undefined });
const diagnostics = ts.getPreEmitDiagnostics(program);
if (diagnostics.length) console.error(ts.formatDiagnosticsWithColorAndContext(diagnostics, {
  getCanonicalFileName: value => value, getCurrentDirectory: () => app, getNewLine: () => '\n',
}));
console.log(JSON.stringify({ scope:'JOBKIX and transitive dependencies', roots: roots.length, transitiveFiles: program.getSourceFiles().length, diagnostics:diagnostics.length, productionBuild:false }));
process.exitCode = diagnostics.length ? 1 : 0;
