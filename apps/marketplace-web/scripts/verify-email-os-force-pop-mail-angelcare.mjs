import fs from "node:fs"

const resolver = "lib/email-os-core/multi-mailbox-resolver.ts"
let failed = false

console.log("EMAIL-OS FORCE POP MAIL.ANGELCARE VERIFY")
console.log("========================================")

if (!fs.existsSync(resolver)) {
  console.log(`✗ ${resolver}`)
  process.exit(1)
}

const text = fs.readFileSync(resolver, "utf8")

const checks = [
  ["uses mail.angelcare.ma fallback", text.includes('"mail.angelcare.ma"')],
  ["incoming protocol pop3", text.includes('protocol: "pop3"')],
  ["no imap.menara fallback", !text.includes('"imap.menara.ma"')],
  ["reads GLOBAL_POP_HOST", text.includes("GLOBAL_POP_HOST")],
  ["reads GLOBAL_POP_PORT", text.includes("GLOBAL_POP_PORT")],
  ["reads GLOBAL_POP_SECURE", text.includes("GLOBAL_POP_SECURE")]
]

for (const [label, ok] of checks) {
  console.log(`${ok ? "✓" : "✗"} ${label}`)
  if (!ok) failed = true
}

if (failed) process.exit(1)

console.log("Ready.")
