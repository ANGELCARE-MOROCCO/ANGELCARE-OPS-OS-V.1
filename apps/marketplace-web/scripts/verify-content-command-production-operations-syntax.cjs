#!/usr/bin/env node
const fs=require('fs');const path=require('path');
const appRoot=path.resolve(process.argv[2]||process.cwd())
const candidates=[process.env.TYPESCRIPT_PATH,path.join(appRoot,'node_modules/typescript/lib/typescript.js'),path.join(appRoot,'../../node_modules/typescript/lib/typescript.js'),'/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript/lib/typescript.js','/usr/local/lib/node_modules/typescript/lib/typescript.js'].filter(Boolean)
const found=candidates.find(p=>fs.existsSync(p));if(!found){console.error('FAIL — TypeScript compiler module was not found.');process.exit(2)}
const ts=require(found)
const files=[
'app/(protected)/market-os/content-command-center/my-home/page.tsx',
'app/(protected)/market-os/content-command-center/production-operations/page.tsx',
'app/api/market-os/content-command-headquarters/production-operations/route.ts',
'app/api/market-os/content-command/marketing-ai/cron/route.ts',
'app/api/market-os/content-command/research-control/cron/route.ts',
'components/market-os/content-command/content-command-navigation.tsx',
'components/market-os/content-command/production-operations/ProductionOperationsWorkspace.tsx',
'lib/market-os/ai-runtime/gateway.ts',
'lib/market-os/content-command-headquarters/market-scan.ts',
'lib/market-os/content-command-headquarters/opportunity-intelligence-service.ts',
'lib/market-os/content-command-headquarters/production-operations-service.ts',
'lib/market-os/content-command-headquarters/production-operations-types.ts',
'lib/market-os/content-command-headquarters/publication-release-service.ts',
]
let failed=0
for(const rel of files){const filename=path.join(appRoot,rel);if(!fs.existsSync(filename)){console.error(`FAIL — missing ${rel}`);failed++;continue}const out=ts.transpileModule(fs.readFileSync(filename,'utf8'),{fileName:rel,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.Preserve},reportDiagnostics:true});const errors=(out.diagnostics||[]).filter(d=>d.category===ts.DiagnosticCategory.Error);if(errors.length){failed++;console.error(`FAIL — ${rel}`);for(const error of errors)console.error(ts.flattenDiagnosticMessageText(error.messageText,'\n'))}}
if(failed)process.exit(1)
console.log(`PASS — ${files.length} Production Operations TS/TSX files pass isolated syntax transformation with TypeScript ${ts.version}.`)
