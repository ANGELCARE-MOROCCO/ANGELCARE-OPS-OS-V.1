import fs from "node:fs"
const files = ["components/email-os-core/EmailOSWorkspacePro.tsx","app/api/email-os/auth-diagnostics/route.ts","docs/MAILBOX_AUTH_FAILED_FIX.md"]
let failed = false
console.log("EMAIL-OS WORKSPACE TABS SETTINGS MAILBOX FIX VERIFY")
for (const file of files) { const ok = fs.existsSync(file); console.log(`${ok ? "✓" : "✗"} ${file}`); if (!ok) failed = true }
const workspace = fs.existsSync(files[0]) ? fs.readFileSync(files[0], "utf8") : ""
for (const marker of ["Settings & Liveness","selectedMailboxId","activeTab","currentTitle","Mailbox Production Control","Open liveness monitor"]) {
  const ok = workspace.includes(marker); console.log(`${ok ? "✓" : "✗"} ${marker}`); if (!ok) failed = true
}
if (failed) process.exit(1)
console.log("Ready.")
