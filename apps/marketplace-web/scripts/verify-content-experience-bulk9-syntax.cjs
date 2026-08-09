#!/usr/bin/env node
const fs=require('fs'),path=require('path'),ts=require('typescript')
const root=path.resolve(__dirname,'..')
const files=[
'lib/market-os/content-command-headquarters/record-lifecycle-service.ts',
'app/api/market-os/content-command-headquarters/record-governance/route.ts',
'app/(protected)/market-os/content-command-center/record-governance/page.tsx',
'components/market-os/content-command/experience-bulk9/bulk9-governance-model.ts',
'components/market-os/content-command/experience-bulk9/bulk9-governance-ui.tsx',
'components/market-os/content-command/experience-bulk9/RecordGovernanceAuthority.tsx',
'components/market-os/content-command/experience-bulk9/LifecycleControlDock.tsx',
'components/market-os/content-command/ContentCommand360Shell.tsx',
'components/market-os/content-command/content-command-navigation.tsx',
'lib/market-os/content-command-headquarters/auth.ts']
let bad=0
for(const rel of files){const file=path.join(root,rel);const text=fs.readFileSync(file,'utf8');const output=ts.transpileModule(text,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX,isolatedModules:true},fileName:file,reportDiagnostics:true});const errors=(output.diagnostics||[]).filter(item=>item.category===ts.DiagnosticCategory.Error);if(errors.length){bad++;console.error(`FAIL — ${rel}`);for(const error of errors)console.error(ts.flattenDiagnosticMessageText(error.messageText,' '))}else console.log(`PASS — syntax ${rel}`)}
const css=fs.readFileSync(path.join(root,'components/market-os/content-command/experience-bulk9/bulk9-governance.module.css'),'utf8')
const classes=new Set([...css.matchAll(/\.([A-Za-z_][A-Za-z0-9_-]*)/g)].map(match=>match[1]))
for(const rel of files.filter(file=>file.endsWith('.tsx'))){const text=fs.readFileSync(path.join(root,rel),'utf8');for(const match of text.matchAll(/styles\.([A-Za-z_][A-Za-z0-9_]*)/g)){if(!classes.has(match[1])&&rel.includes('experience-bulk9')){bad++;console.error(`FAIL — missing CSS class ${match[1]} in ${rel}`)}}}
if(bad)process.exit(1)
console.log(`PASS — ${files.length} Bulk 9 TS/TSX files pass isolated syntax and CSS reference checks`)
