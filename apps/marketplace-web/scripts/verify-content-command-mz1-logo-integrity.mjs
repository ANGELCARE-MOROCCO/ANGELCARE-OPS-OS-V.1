import crypto from "node:crypto"
import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const logoPath = path.join(root, "public/logo.png")
const logoComponentPath = path.join(root, "components/brand/AngelCareLogo.tsx")
const sidebarPath = path.join(root, "components/market-os/content-command/shell/ContentCommandSidebar.tsx")
const expectedHash = "4f505544243d940b9295d246e4c33fe46b39f51c38492a94cca0536c176c8a3e"
const failures = []

if (!fs.existsSync(logoPath)) failures.push("public/logo.png is missing.")
if (fs.existsSync(logoPath)) {
  const hash = crypto.createHash("sha256").update(fs.readFileSync(logoPath)).digest("hex")
  if (hash !== expectedHash) failures.push(`Official logo hash changed: ${hash}`)
}

const logoComponent = fs.readFileSync(logoComponentPath, "utf8")
const sidebar = fs.readFileSync(sidebarPath, "utf8")
if (!logoComponent.includes('src="/logo.png"')) failures.push("AngelCareLogo no longer references /logo.png.")
if (!logoComponent.includes("data-angelcare-official-logo")) failures.push("Official logo ownership marker is missing.")
if (!sidebar.includes('import AngelCareLogo from "@/components/brand/AngelCareLogo"')) failures.push("Sidebar does not use the official logo component.")
if (!sidebar.includes("<AngelCareLogo")) failures.push("Sidebar does not render AngelCareLogo.")

if (failures.length) {
  console.error("FAIL — Content Command MZ1 logo integrity")
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}

console.log("PASS — official AngelCare logo hash preserved")
console.log("PASS — official logo component enforced in sovereign sidebar")
