const fs = require('fs')
const path = require('path')
const ts = require('typescript')
const root = process.cwd()
const list = fs.readFileSync(path.join(root, 'BULK10_PATCH_FILE_LIST.txt'), 'utf8').split(/\r?\n/).map((item) => item.trim()).filter(Boolean)
const files = list.filter((item) => /\.(ts|tsx)$/.test(item) && !/\.d\.ts$/.test(item))
const errors = []
for (const rel of files) {
  const full = path.join(root, rel)
  const source = fs.readFileSync(full, 'utf8')
  const result = ts.transpileModule(source, { fileName: rel, reportDiagnostics: true, compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX } })
  for (const diagnostic of result.diagnostics || []) if (diagnostic.category === ts.DiagnosticCategory.Error) errors.push(`${rel}: ${ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')}`)
  const imports = [...source.matchAll(/(?:from\s+|import\s*\()(['"])(\.\.?\/[^'"]+)\1/g)].map((match) => match[2])
  for (const specifier of imports) {
    const candidate = path.resolve(path.dirname(full), specifier)
    const variants = [candidate, `${candidate}.ts`, `${candidate}.tsx`, `${candidate}.js`, `${candidate}.mjs`, path.join(candidate, 'index.ts'), path.join(candidate, 'index.tsx')]
    if (!variants.some(fs.existsSync)) errors.push(`${rel}: unresolved relative import ${specifier}`)
  }
}
const component = fs.readFileSync(path.join(root, 'components/market-os/content-command/experience-bulk8/Bulk8AiExecutiveWorkspace.tsx'), 'utf8')
const css = fs.readFileSync(path.join(root, 'components/market-os/content-command/experience-bulk8/bulk8-ai.module.css'), 'utf8')
for (const match of component.matchAll(/styles\.([A-Za-z0-9_]+)/g)) if (!new RegExp(`\\.${match[1]}(?:\\b|[,{:])`).test(css)) errors.push(`missing CSS class: ${match[1]}`)
if (errors.length) { console.error(errors.join('\n')); process.exit(1) }
console.log(`PASS — ${files.length} Bulk 10 TS/TSX files pass isolated syntax, relative-import and CSS-reference checks.`)
