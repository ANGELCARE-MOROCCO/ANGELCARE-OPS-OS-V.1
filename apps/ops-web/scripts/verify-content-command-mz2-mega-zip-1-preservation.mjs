import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const required = [
  "components/market-os/content-command/shell/ContentCommandSidebar.tsx",
  "components/market-os/content-command/shell/ContentCommandTopbar.tsx",
  "components/market-os/content-command/shell/ContentCommandCommandPalette.tsx",
  "components/market-os/content-command/shell/content-command-shell.module.css",
  "components/market-os/content-command/ContentCommand360Shell.tsx",
  "components/brand/AngelCareLogo.tsx",
  "public/logo.png",
]
const failures = []
for (const relative of required) if (!fs.existsSync(path.join(root, relative))) failures.push(`Mega ZIP 1 foundation missing: ${relative}`)
if (!failures.length) {
  const shell = fs.readFileSync(path.join(root, "components/market-os/content-command/ContentCommand360Shell.tsx"), "utf8")
  const sidebar = fs.readFileSync(path.join(root, "components/market-os/content-command/shell/ContentCommandSidebar.tsx"), "utf8")
  const logo = fs.readFileSync(path.join(root, "components/brand/AngelCareLogo.tsx"), "utf8")
  if (!shell.includes("data-sidebar-mode") || !shell.includes("data-experience-mode") || !shell.includes("data-density")) failures.push("Mega ZIP 1 shell state attributes changed or disappeared.")
  if (!sidebar.includes("AngelCareLogo")) failures.push("Mega ZIP 1 sidebar no longer renders the official logo component.")
  if (!logo.includes('src="/logo.png"')) failures.push("Official AngelCare logo path changed.")
}
if (failures.length) {
  console.error("FAIL — Mega ZIP 1 preservation")
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}
console.log("PASS — finalized Mega ZIP 1 sovereign shell, sidebar, modes, density and official logo remain intact")
