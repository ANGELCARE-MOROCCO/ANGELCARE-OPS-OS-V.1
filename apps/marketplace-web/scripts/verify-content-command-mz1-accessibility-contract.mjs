import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const sources = [
  "components/market-os/content-command/shell/ContentCommandSidebar.tsx",
  "components/market-os/content-command/shell/ContentCommandTopbar.tsx",
  "components/market-os/content-command/shell/ContentCommandCommandPalette.tsx",
  "components/market-os/content-command/shell/content-command-shell.module.css",
].map((file) => fs.readFileSync(path.join(root, file), "utf8")).join("\n")

const required = [
  'aria-current={active ? "page"',
  "aria-expanded",
  'aria-modal="true"',
  'role="dialog"',
  'role="listbox"',
  'role="option"',
  "aria-activedescendant",
  'event.key === "Escape"',
  'event.key === "ArrowDown"',
  'event.key === "ArrowUp"',
  "prefers-reduced-motion",
  ":focus-visible",
]
const missing = required.filter((token) => !sources.includes(token))
if (missing.length) {
  console.error("FAIL — Content Command MZ1 accessibility contract")
  missing.forEach((token) => console.error(`- Missing accessibility token: ${token}`))
  process.exit(1)
}
console.log("PASS — navigation, drawer and palette accessibility contract present")
console.log("PASS — keyboard, focus and reduced-motion provisions present")
