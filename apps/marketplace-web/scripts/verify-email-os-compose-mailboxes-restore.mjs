import fs from "node:fs"

const files = [
  "app/api/email-os/compose-resources/route.ts",
  "app/api/email-os/mailboxes/route.ts"
]

let failed = false

console.log("EMAIL-OS COMPOSE MAILBOXES RESTORE VERIFY")
console.log("=========================================")

for (const file of files) {
  const ok = fs.existsSync(file)
  console.log(`${ok ? "✓" : "✗"} ${file}`)
  if (!ok) failed = true
}

const all = files.filter((file) => fs.existsSync(file)).map((file) => fs.readFileSync(file, "utf8")).join("\n")

for (const marker of [
  "listEmailOSMultiMailboxes",
  "envMailboxCount",
  "finalMailboxCount",
  "menara_smtp_pop",
  "Compose must never lose mailboxes",
  "mailbox_id"
]) {
  const ok = all.includes(marker)
  console.log(`${ok ? "✓" : "✗"} ${marker}`)
  if (!ok) failed = true
}

if (failed) process.exit(1)

console.log("Ready.")
