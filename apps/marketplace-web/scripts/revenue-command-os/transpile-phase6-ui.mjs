import fs from 'node:fs';import path from 'node:path';import {createRequire} from 'node:module';import {execFileSync} from 'node:child_process';
const require=createRequire(import.meta.url);let ts;
for(const candidate of ['typescript',path.join(process.cwd(),'node_modules/typescript'),path.join(process.cwd(),'../../node_modules/typescript')]){try{ts=require(candidate);break}catch{}}
if(!ts){try{const globalRoot=execFileSync('npm',['root','-g'],{encoding:'utf8'}).trim();ts=require(path.join(globalRoot,'typescript'))}catch{}}
if(!ts)throw new Error('TypeScript package unavailable for UI syntax transpile.');
const root=process.cwd();const files=[
'app/(protected)/revenue-command-os/command-kernel/_components/CommandKernelFrame.tsx',
'app/(protected)/revenue-command-os/command-kernel/_components/CommandKernelWorkspace.tsx',
'app/api/revenue-command-os/command-kernel/golden-300/route.ts'
];let failures=0;for(const relative of files){const source=fs.readFileSync(path.join(root,relative),'utf8');const result=ts.transpileModule(source,{fileName:relative,reportDiagnostics:true,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.Preserve}});const errors=(result.diagnostics||[]).filter(d=>d.category===ts.DiagnosticCategory.Error);if(errors.length){failures+=errors.length;console.error(relative,errors.map(d=>ts.flattenDiagnosticMessageText(d.messageText,' ')))}else console.log(`✓ ${relative}`)}console.log(JSON.stringify({suite:'MZ06 UI/API transpile',files:files.length,failures},null,2));if(failures)process.exit(1);
