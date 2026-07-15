import fs from "node:fs"

const files = [
  "app/api/email-os/auth-diagnostics/route.ts",
  "app/api/email-os/mailbox-liveness/route.ts",
  "app/api/email-os/mailbox-liveness/probe/route.ts"
]

let failed = false

console.log("EMAIL-OS MENARA CONNECTION THROTTLE VERIFY")
console.log("=========================================")

for (const file of files) {
  const ok = fs.existsSync(file)
  console.log(`${ok ? "✓" : "✗"} ${file}`)
  if (!ok) failed = true
}

const auth = fs.existsSync(files[0]) ? fs.readFileSync(files[0], "utf8") : ""
const live = fs.existsSync(files[1]) ? fs.readFileSync(files[1], "utf8") : ""

for (const marker of [
  "for (const mailbox of mailboxes)",
  "await sleep(850)",
  "Too many concurrent connections",
  "pool: false",
  "transporter.close()"
]) {
  const ok = (auth + live).includes(marker)
  console.log(`${ok ? "✓" : "✗"} ${marker}`)
  if (!ok) failed = true
}

if (failed) process.exit(1)

console.log("Ready.")
