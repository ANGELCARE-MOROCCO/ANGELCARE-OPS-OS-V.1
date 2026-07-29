#!/usr/bin/env node
const fs = require("node:fs")
const path = require("node:path")
let ts
try { ts = require("typescript") } catch { console.error("FAIL — TypeScript package is required."); process.exit(1) }
const root = path.resolve(__dirname, "..")
const listFile = path.join(root, "BULK7_PATCH_FILE_LIST.txt")
const files = fs.readFileSync(listFile, "utf8").split(/\r?\n/).map(x => x.trim()).filter(x => /\.(ts|tsx)$/.test(x) && !x.endsWith(".d.ts"))
let errors = 0
for (const rel of files) {
  const file = path.join(root, rel)
  const source = fs.readFileSync(file, "utf8")
  const output = ts.transpileModule(source, { fileName: file, reportDiagnostics: true, compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.Preserve, isolatedModules: true } })
  const diagnostics = (output.diagnostics || []).filter(d => d.category === ts.DiagnosticCategory.Error)
  if (diagnostics.length) {
    errors += diagnostics.length
    console.error(`FAIL — ${rel}`)
    for (const diagnostic of diagnostics) console.error(ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"))
  }
}
const importPattern = /(?:from\s+|import\s*)["'](\.[^"']+)["']/g
for (const rel of files) {
  const file = path.join(root, rel)
  const source = fs.readFileSync(file, "utf8")
  let match
  while ((match = importPattern.exec(source))) {
    const base = path.resolve(path.dirname(file), match[1])
    const candidates = [base, `${base}.ts`, `${base}.tsx`, `${base}.js`, `${base}.mjs`, `${base}.cjs`, `${base}.css`, `${base}.d.ts`, path.join(base, "index.ts"), path.join(base, "index.tsx")]
    if (!candidates.some(candidate => fs.existsSync(candidate))) { errors += 1; console.error(`FAIL — unresolved relative import ${match[1]} in ${rel}`) }
  }
}
const cssFile = path.join(root, "components/market-os/content-command/experience-bulk7/bulk7-impact.module.css")
const dtsFile = `${cssFile}.d.ts`
const uiFiles = ["components/market-os/content-command/experience-bulk7/Bulk7ImpactWorkspaces.tsx", "components/market-os/content-command/experience-bulk7/bulk7-ui.tsx"]
const css = fs.readFileSync(cssFile, "utf8")
const dts = fs.readFileSync(dtsFile, "utf8")
const refs = new Set(uiFiles.flatMap(rel => [...fs.readFileSync(path.join(root, rel), "utf8").matchAll(/styles\.([A-Za-z_][\w]*)/g)].map(m => m[1])))
for (const ref of refs) {
  if (!new RegExp(`\\.${ref}(?![A-Za-z0-9_-])`).test(css)) { errors += 1; console.error(`FAIL — missing CSS class .${ref}`) }
  if (!new RegExp(`readonly\\s+["']?${ref}["']?\\s*:`).test(dts)) { errors += 1; console.error(`FAIL — missing CSS declaration ${ref}`) }
}
if (errors) process.exit(1)
console.log(`PASS — ${files.length} Bulk 7 TS/TSX files pass isolated syntax, relative import and CSS reference checks`)
