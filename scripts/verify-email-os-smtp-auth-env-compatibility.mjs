import fs from "node:fs"

const files = [
  "lib/email-os-core/multi-mailbox-resolver.ts",
  "lib/email-os-core/mailbox-credentials.ts",
  "app/api/email-os/auth-diagnostics/route.ts",
  "app/api/email-os/send-direct/route.ts"
]

let failed = false

console.log("EMAIL-OS SMTP AUTH ENV COMPATIBILITY VERIFY")
console.log("==========================================")

for (const file of files) {
  const ok = fs.existsSync(file)
  console.log(`${ok ? "✓" : "✗"} ${file}`)
  if (!ok) failed = true
}

const all = files.filter((file) => fs.existsSync(file)).map((file) => fs.readFileSync(file, "utf8")).join("\n")

for (const marker of [
  "MAILBOX_",
  "FLASHCARDS",
  "EXCURSIONS",
  "HOME_SERVICE",
  "candidateUsers",
  "workingUser",
  "createWorkingTransport",
  "envSources"
]) {
  const ok = all.includes(marker)
  console.log(`${ok ? "✓" : "✗"} ${marker}`)
  if (!ok) failed = true
}

if (failed) process.exit(1)

console.log("Ready.")
