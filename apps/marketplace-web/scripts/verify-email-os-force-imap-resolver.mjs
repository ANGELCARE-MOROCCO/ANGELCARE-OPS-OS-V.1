import fs from "node:fs"

const file = "lib/email-os-core/multi-mailbox-resolver.ts"
let failed = false

console.log("EMAIL-OS FORCE IMAP RESOLVER VERIFY")
console.log("===================================")

if (!fs.existsSync(file)) {
  console.log(`✗ ${file}`)
  process.exit(1)
}

const text = fs.readFileSync(file, "utf8")

const checks = [
  ["uses imap.menara.ma fallback", text.includes('"imap.menara.ma"')],
  ["incomingProtocol is imap", text.includes('incomingProtocol: "imap"')],
  ["protocol hardcoded imap", text.includes('protocol: "imap"')],
  ["no pop.angelcare fallback", !text.includes("pop.angelcare.ma")],
  ["no pop3 protocol fallback", !text.includes('|| "pop3"')],
  ["no GLOBAL_POP_HOST", !text.includes("GLOBAL_POP_HOST")],
  ["no EMAIL_OS_INCOMING_PROTOCOL", !text.includes("EMAIL_OS_INCOMING_PROTOCOL")]
]

for (const [label, ok] of checks) {
  console.log(`${ok ? "✓" : "✗"} ${label}`)
  if (!ok) failed = true
}

if (failed) process.exit(1)
console.log("Ready.")
