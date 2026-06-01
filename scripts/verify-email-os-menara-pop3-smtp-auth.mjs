import fs from "node:fs"
const files = ["lib/email-os-core/multi-mailbox-resolver.ts","lib/email-os-core/mailbox-credentials.ts","app/api/email-os/mailbox-liveness/route.ts","app/api/email-os/auth-diagnostics/route.ts","ENV_MENARA_POP3_SMTP_AUTH_CLEAN_BLOCK.txt"]
let failed = false
console.log("EMAIL-OS MENARA POP3 SMTP AUTH VERIFY")
for (const file of files) { const ok = fs.existsSync(file); console.log(`${ok ? "✓" : "✗"} ${file}`); if (!ok) failed = true }
const all = files.filter((f) => fs.existsSync(f)).map((f) => fs.readFileSync(f, "utf8")).join("\n")
for (const marker of ["smtp-auth.angelcare.ma","pop.angelcare.ma","EMAIL_OS_INCOMING_PROTOCOL","pop3","GLOBAL_POP_PORT"]) { const ok = all.includes(marker); console.log(`${ok ? "✓" : "✗"} ${marker}`); if (!ok) failed = true }
if (failed) process.exit(1)
console.log("Ready.")
