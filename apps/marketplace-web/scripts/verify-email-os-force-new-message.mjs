import fs from "node:fs"
const files = ["components/email-os-core/EmailOSWorkspacePro.tsx","components/email-os-core/EnterpriseComposeModal.tsx","components/email-os-core/InboxActionToolbar.tsx","hooks/useEmailOSActionEngine.ts","app/api/email-os/message-action/route.ts"]
let failed = false
console.log("EMAIL-OS FORCE NEW MESSAGE VERIFY")
for (const file of files) { const ok = fs.existsSync(file); console.log(`${ok ? "✓" : "✗"} ${file}`); if (!ok) failed = true }
const all = files.filter(f => fs.existsSync(f)).map(f => fs.readFileSync(f, "utf8")).join("\n")
for (const marker of ["Nouveau message", "EnterpriseComposeModal", "InboxActionToolbar", "setComposeOpen(true)"]) { const ok = all.includes(marker); console.log(`${ok ? "✓" : "✗"} ${marker}`); if (!ok) failed = true }
if (failed) process.exit(1)
console.log("Ready.")
