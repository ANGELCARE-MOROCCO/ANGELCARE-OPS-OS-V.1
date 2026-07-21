import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
async function loadTypeScript(){
  try{return (await import('typescript')).default;}catch{}
  const globalRoot=execFileSync('npm',['root','-g'],{encoding:'utf8'}).trim();
  return (await import(pathToFileURL(path.join(globalRoot,'typescript/lib/typescript.js')).href)).default;
}
const ts=await loadTypeScript();
const files=['app/api/revenue-command-os/command-kernel/commands-2000/route.ts','app/(protected)/revenue-command-os/command-kernel/_components/CommandKernelFrame.tsx','app/(protected)/revenue-command-os/command-kernel/_components/CommandKernelWorkspace.tsx','lib/revenue-command-os/command-kernel/commands-2000/catalog.ts','lib/revenue-command-os/command-kernel/commands-2000/index.ts'];
let errors=[];
for(const f of files){const source=fs.readFileSync(f,'utf8');const r=ts.transpileModule(source,{fileName:f,reportDiagnostics:true,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.Preserve,esModuleInterop:true}});for(const d of r.diagnostics||[])if(d.category===ts.DiagnosticCategory.Error)errors.push({file:f,message:ts.flattenDiagnosticMessageText(d.messageText,' ')})}
if(errors.length){console.error(errors);process.exit(1)}
console.log(JSON.stringify({phase:'MZ08',files:files.length,errors:0},null,2));