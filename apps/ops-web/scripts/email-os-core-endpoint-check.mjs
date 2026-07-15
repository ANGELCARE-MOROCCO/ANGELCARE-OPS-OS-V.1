const base = process.env.EMAIL_OS_CHECK_BASE_URL || "http://localhost:3000"

const endpoints = [
  "/api/email-os/health",
  "/api/email-os/launch-readiness",
  "/api/email-os/provider-readiness",
  "/api/email-os/diagnostics",
  "/api/email-os/backup-manifest",
  "/api/email-os/entities/mailboxes",
  "/api/email-os/entities/threads",
  "/api/email-os/analytics",
  "/api/email-os/governance/audit-summary",
  "/api/email-os/access/audit"
]

console.log("\nEMAIL-OS ENDPOINT CHECK")
console.log("======================")

let failed = false

for (const endpoint of endpoints) {
  const url = `${base}${endpoint}`
  try {
    const res = await fetch(url)
    const json = await res.json().catch(() => null)
    const ok = res.ok && json?.ok !== false
    console.log(`${ok ? "✓" : "✗"} ${endpoint}`)
    if (!ok) failed = true
  } catch (error) {
    console.log(`✗ ${endpoint} - ${error instanceof Error ? error.message : "failed"}`)
    failed = true
  }
}

if (failed) {
  console.error("\nEndpoint check failed.")
  process.exit(1)
}

console.log("\nAll Email-OS endpoint checks passed.")
