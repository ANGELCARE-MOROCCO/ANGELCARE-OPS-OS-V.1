#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
const app=path.resolve(process.argv[2]||process.cwd())
const require=createRequire(path.join(app,'package.json'))
let ts
try{ts=require('typescript')}catch{console.error('FAIL: project-local TypeScript is unavailable.');process.exit(1)}
const roots=['angelcare-marketplace/customer-commerce','app/api/angelcare-marketplace/customer','app/api/angelcare-marketplace/wallet','app/api/angelcare-marketplace/checkout','app/api/angelcare-marketplace/payments','app/api/angelcare-marketplace/admin/wallet','app/api/angelcare-marketplace/admin/orders','app/api/angelcare-marketplace/admin/payments','app/angelcare-marketplace/[locale]/auth','app/angelcare-marketplace/[locale]/account','app/angelcare-marketplace/(protected)/admin/wallet','app/angelcare-marketplace/(protected)/admin/orders','app/angelcare-marketplace/(protected)/admin/payments']
const files=[]
function walk(p){if(!fs.existsSync(p))return;const stat=fs.statSync(p);if(stat.isDirectory())for(const n of fs.readdirSync(p))walk(path.join(p,n));else if(/\.(ts|tsx)$/.test(p))files.push(p)}
for(const root of roots)walk(path.join(app,root))
for(const rel of ['angelcare-marketplace/category-native-experience/components/AdaptiveExperience.tsx','angelcare-marketplace/conversion-universe/components/CheckoutExperience.tsx','angelcare-marketplace/shells/AdminNavigation.tsx'])files.push(path.join(app,rel))
let failures=0
for(const file of [...new Set(files)]){const source=fs.readFileSync(file,'utf8');const result=ts.transpileModule(source,{fileName:file,reportDiagnostics:true,compilerOptions:{jsx:ts.JsxEmit.Preserve,target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}});const diagnostics=result.diagnostics||[];if(diagnostics.length){failures++;console.error(`\n${path.relative(app,file)}`);for(const d of diagnostics)console.error(ts.flattenDiagnosticMessageText(d.messageText,'\n'))}}
console.log(`Customer/Payment/Wallet syntax files: ${files.length}`);console.log(`Syntax failures: ${failures}`)
if(failures)process.exit(1)
console.log('RESULT: CUSTOMER PAYMENT WALLET TYPESCRIPT SYNTAX PASSED')
