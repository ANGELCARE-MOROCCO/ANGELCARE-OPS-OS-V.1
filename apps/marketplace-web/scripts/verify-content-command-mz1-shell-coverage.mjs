import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const layout = fs.readFileSync(path.join(root, "app/(protected)/market-os/content-command-center/layout.tsx"), "utf8")
const shell = fs.readFileSync(path.join(root, "components/market-os/content-command/ContentCommand360Shell.tsx"), "utf8")
const sidebar = fs.readFileSync(path.join(root, "components/market-os/content-command/shell/ContentCommandSidebar.tsx"), "utf8")
const topbar = fs.readFileSync(path.join(root, "components/market-os/content-command/shell/ContentCommandTopbar.tsx"), "utf8")
const failures = []

const requiredShellTokens = [
  "ContentCommandSidebar",
  "ContentCommandTopbar",
  "ContentCommandCommandPalette",
  "data-content-command-360",
  "data-sidebar-mode",
  "data-experience-mode",
  "data-density",
]
const requiredSidebarTokens = [
  '"expanded"',
  '"compact"',
  '"focus-hidden"',
  "mobileDrawer",
  "expandedGroups",
  "favorites",
  "recentRoutes",
]
const requiredTopbarTokens = ["Breadcrumbs", "Notifications", "Session AngelCare", "Création rapide", "Studios de création"]

if (!layout.includes("<ContentCommand360Shell>{children}</ContentCommand360Shell>")) failures.push("Protected layout does not mount the sovereign shell.")
requiredShellTokens.forEach((token) => { if (!shell.includes(token)) failures.push(`Shell token missing: ${token}`) })
requiredSidebarTokens.forEach((token) => { if (!sidebar.includes(token)) failures.push(`Sidebar capability missing: ${token}`) })
requiredTopbarTokens.forEach((token) => { if (!topbar.includes(token)) failures.push(`Topbar capability missing: ${token}`) })
if (/<ContentCommandNavigation\s/.test(shell)) failures.push("Old horizontal navigation is still mounted.")

if (failures.length) {
  console.error("FAIL — Content Command MZ1 shell coverage")
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}

console.log("PASS — sovereign shell mounted across protected layout")
console.log("PASS — expanded, compact, focus and mobile navigation capabilities present")
console.log("PASS — old horizontal navigation retired")
