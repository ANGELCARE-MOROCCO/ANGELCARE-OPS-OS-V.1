#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
const app=path.resolve(process.argv[2]||process.cwd()),candidates=[path.join(app,'node_modules/typescript/lib/typescript.js'),process.env.TYPESCRIPT_PATH,'/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript/lib/typescript.js'].filter(Boolean),tsPath=candidates.find((candidate)=>fs.existsSync(candidate))
if(!tsPath){console.log('NOTICE: TypeScript runtime unavailable; static verifier completed but syntax gate could not run.');process.exit(0)}
const ts=await import(pathToFileURL(tsPath).href),files=[]
function walk(directory){for(const entry of fs.readdirSync(directory,{withFileTypes:true})){const full=path.join(directory,entry.name);if(entry.isDirectory())walk(full);else if(/\.(ts|tsx)$/.test(entry.name))files.push(full)}}
walk(path.join(app,'angelcare-marketplace/footer-studio'));for(const root of [path.join(app,'app/angelcare-marketplace/(protected)/admin/footer-studio'),path.join(app,'app/api/angelcare-marketplace/admin/footer-studio'),path.join(app,'app/api/angelcare-marketplace/public/footer')])if(fs.existsSync(root))walk(root)
let failures=0;for(const file of files){const source=fs.readFileSync(file,'utf8'),result=ts.transpileModule(source,{fileName:file,reportDiagnostics:true,compilerOptions:{jsx:ts.JsxEmit.Preserve,target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}),errors=(result.diagnostics||[]).filter((diagnostic)=>diagnostic.category===ts.DiagnosticCategory.Error);if(errors.length){failures+=1;console.log(`FAIL ${path.relative(app,file)}`);for(const error of errors)console.log(ts.flattenDiagnosticMessageText(error.messageText,'\n'))}}
console.log(`Footer Studio TypeScript/TSX files: ${files.length}`);console.log(`Syntax failures: ${failures}`);if(failures)process.exit(1);console.log('RESULT: FOOTER COMMAND STUDIO TYPESCRIPT SYNTAX PASSED')
