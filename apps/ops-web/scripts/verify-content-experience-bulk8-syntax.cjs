#!/usr/bin/env node
const fs=require('node:fs')
const path=require('node:path')
let ts
try{ts=require('typescript')}catch{console.error('FAIL — TypeScript package is required.');process.exit(1)}
const root=path.resolve(__dirname,'..')
const files=fs.readFileSync(path.join(root,'BULK8_PATCH_FILE_LIST.txt'),'utf8').split(/\r?\n/).map(v=>v.trim()).filter(v=>/\.(ts|tsx)$/.test(v)&&!v.endsWith('.d.ts'))
let errors=0
for(const rel of files){
 const file=path.join(root,rel);const source=fs.readFileSync(file,'utf8')
 const out=ts.transpileModule(source,{fileName:file,reportDiagnostics:true,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.Preserve,isolatedModules:true}})
 for(const diagnostic of (out.diagnostics||[]).filter(d=>d.category===ts.DiagnosticCategory.Error)){errors++;console.error(`FAIL — ${rel}: ${ts.flattenDiagnosticMessageText(diagnostic.messageText,' ')}`)}
}
const importPattern=/(?:from\s+|import\s*)["'](\.[^"']+)["']/g
for(const rel of files){
 const file=path.join(root,rel);const source=fs.readFileSync(file,'utf8');let match
 while((match=importPattern.exec(source))){const base=path.resolve(path.dirname(file),match[1]);const candidates=[base,`${base}.ts`,`${base}.tsx`,`${base}.js`,`${base}.mjs`,`${base}.cjs`,`${base}.css`,`${base}.d.ts`,path.join(base,'index.ts'),path.join(base,'index.tsx')];if(!candidates.some(fs.existsSync)){errors++;console.error(`FAIL — unresolved relative import ${match[1]} in ${rel}`)}}
}
const cssRel='components/market-os/content-command/experience-bulk8/bulk8-ai.module.css'
const css=fs.readFileSync(path.join(root,cssRel),'utf8');const dts=fs.readFileSync(path.join(root,`${cssRel}.d.ts`),'utf8')
const uiFiles=['components/market-os/content-command/experience-bulk8/Bulk8AiExecutiveWorkspace.tsx','components/market-os/content-command/experience-bulk8/bulk8-ui.tsx']
const refs=new Set(uiFiles.flatMap(rel=>[...fs.readFileSync(path.join(root,rel),'utf8').matchAll(/styles\.([A-Za-z_][\w]*)/g)].map(m=>m[1])))
for(const ref of refs){if(!new RegExp(`\\.${ref}(?![A-Za-z0-9_-])`).test(css)){errors++;console.error(`FAIL — missing CSS class .${ref}`)}if(!new RegExp(`readonly\\s+["']?${ref}["']?\\s*:`).test(dts)){errors++;console.error(`FAIL — missing CSS declaration ${ref}`)}}
if(errors)process.exit(1)
console.log(`PASS — ${files.length} Bulk 8 TS/TSX files pass isolated syntax, relative-import and CSS-reference checks`)
