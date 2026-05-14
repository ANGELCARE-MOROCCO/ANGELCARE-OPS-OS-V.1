import fs from "node:fs"

const required = [
  "app/api/email-os/send-direct/route.ts",
  "docs/PATCH_COMPOSE_TO_DIRECT_SEND.md",
  "docs/PATCH_WORKSPACE_OUTBOX_LINK.md"
]

console.log("\nEMAIL-OS DIRECT SEND VERIFY")
console.log("===========================")

let failed = false

for (const file of required) {
  const ok = fs.existsSync(file)
  console.log(`${ok ? "✓" : "✗"} ${file}`)
  if (!ok) failed = true
}

if (fs.existsSync("components/email-os-core/ProductionComposeStudio.tsx")) {
  const compose = fs.readFileSync("components/email-os-core/ProductionComposeStudio.tsx", "utf8")
  console.log(`${compose.includes("/api/email-os/send-direct") ? "✓" : "⚠"} compose uses /api/email-os/send-direct`)
}

if (fs.existsSync("components/email-os-core/EmailOSWorkspacePro.tsx")) {
  const workspace = fs.readFileSync("components/email-os-core/EmailOSWorkspacePro.tsx", "utf8")
  console.log(`${workspace.includes("CorporateOutboxCommandCenter") ? "✓" : "⚠"} workspace uses CorporateOutboxCommandCenter`)
}

if (failed) process.exit(1)
console.log("\nDirect send patch files are present.")
