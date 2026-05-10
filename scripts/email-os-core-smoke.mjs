const base = process.env.EMAIL_OS_SMOKE_BASE_URL || "http://localhost:3000"

const urls = [
  "/api/email-os/health",
  "/api/email-os/provider-readiness",
  "/api/email-os/backup-manifest",
  "/api/email-os/entities/mailboxes",
  "/api/email-os/entities/threads"
]

console.log("\nEMAIL-OS CORE SMOKE")
console.log("===================")

let failed = false

for (const path of urls) {
  const url = `${base}${path}`
  try {
    const res = await fetch(url)
    const json = await res.json().catch(() => null)
    const ok = res.ok && json?.ok !== false
    console.log(`${ok ? "✓" : "✗"} ${path}`)
    if (!ok) failed = true
  } catch (error) {
    console.log(`✗ ${path} - ${error instanceof Error ? error.message : "failed"}`)
    failed = true
  }
}

if (failed) process.exit(1)

console.log("\nEmail-OS smoke passed.")
