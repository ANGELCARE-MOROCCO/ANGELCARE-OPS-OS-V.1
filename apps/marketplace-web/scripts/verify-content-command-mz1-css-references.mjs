import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const shellDir = path.join(root, "components/market-os/content-command/shell")
const cssPath = path.join(shellDir, "content-command-shell.module.css")
const css = fs.readFileSync(cssPath, "utf8")
const cssClasses = new Set([...css.matchAll(/^\.([A-Za-z_][\w-]*)/gm)].map((match) => match[1]))
const componentFiles = [
  path.join(root, "components/market-os/content-command/ContentCommand360Shell.tsx"),
  path.join(shellDir, "ContentCommandSidebar.tsx"),
  path.join(shellDir, "ContentCommandTopbar.tsx"),
  path.join(shellDir, "ContentCommandCommandPalette.tsx"),
]
const references = new Set()
for (const file of componentFiles) {
  const source = fs.readFileSync(file, "utf8")
  for (const match of source.matchAll(/styles\.([A-Za-z_][\w]*)/g)) references.add(match[1])
}
const missing = [...references].filter((name) => !cssClasses.has(name)).sort()

if (missing.length) {
  console.error("FAIL — Content Command MZ1 CSS references")
  missing.forEach((name) => console.error(`- Missing CSS module class: ${name}`))
  process.exit(1)
}

console.log(`PASS — ${references.size} CSS-module references resolve`)
