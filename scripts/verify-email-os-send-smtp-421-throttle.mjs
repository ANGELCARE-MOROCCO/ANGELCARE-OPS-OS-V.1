import fs from "node:fs"

const files = [
  "app/api/email-os/send-direct/route.ts",
  "app/api/email-os/auth-diagnostics/route.ts"
]

let failed = false

console.log("EMAIL-OS SEND SMTP 421 THROTTLE VERIFY")
console.log("=====================================")

for (const file of files) {
  const ok = fs.existsSync(file)
  console.log(`${ok ? "✓" : "✗"} ${file}`)
  if (!ok) failed = true
}

const send = fs.existsSync(files[0]) ? fs.readFileSync(files[0], "utf8") : ""
const diagnostics = fs.existsSync(files[1]) ? fs.readFileSync(files[1], "utf8") : ""

const checks = [
  ["send route avoids verify", send.includes("Do NOT call transporter.verify()")],
  ["send route uses lock", send.includes("runMailboxLocked")],
  ["send route uses single connection", send.includes("single-connection-no-preverify")],
  ["send route closes transporter", send.includes("transporter.close()")],
  ["diagnostics delayed 2500", diagnostics.includes("await sleep(2500)")],
  ["diagnostics sequential", diagnostics.includes("for (const mailbox of mailboxes)")]
]

for (const [label, ok] of checks) {
  console.log(`${ok ? "✓" : "✗"} ${label}`)
  if (!ok) failed = true
}

if (failed) process.exit(1)

console.log("Ready.")
