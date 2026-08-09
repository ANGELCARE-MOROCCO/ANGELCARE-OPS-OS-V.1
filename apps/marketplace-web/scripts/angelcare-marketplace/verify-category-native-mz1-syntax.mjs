import fs from 'node:fs'
import path from 'node:path'
import ts from '../../node_modules/typescript/lib/typescript.js'
const app=process.cwd()
const roots=[
  path.join(app,'angelcare-marketplace/category-native'),
  path.join(app,'app/angelcare-marketplace/(protected)/admin/category-native'),
  path.join(app,'app/api/angelcare-marketplace/admin/category-native'),
]
const files=[]
function walk(directory){if(!fs.existsSync(directory))return;for(const entry of fs.readdirSync(directory,{withFileTypes:true})){const target=path.join(directory,entry.name);if(entry.isDirectory())walk(target);else if(/\.(ts|tsx)$/.test(entry.name))files.push(target)}}
for(const root of roots)walk(root)
let failures=0
for(const file of files){const source=fs.readFileSync(file,'utf8');const result=ts.transpileModule(source,{fileName:file,reportDiagnostics:true,compilerOptions:{jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}});const diagnostics=(result.diagnostics||[]).filter((entry)=>entry.category===ts.DiagnosticCategory.Error);if(diagnostics.length){failures+=1;console.error(`FAIL ${path.relative(app,file)}`);for(const diagnostic of diagnostics)console.error(ts.flattenDiagnosticMessageText(diagnostic.messageText,'\n'))}}
console.log(`Category-Native syntax files: ${files.length}`)
console.log(`Syntax failures: ${failures}`)
if(failures)process.exit(1)
console.log('RESULT: CATEGORY-NATIVE MZ1 TYPESCRIPT SYNTAX PASSED')
