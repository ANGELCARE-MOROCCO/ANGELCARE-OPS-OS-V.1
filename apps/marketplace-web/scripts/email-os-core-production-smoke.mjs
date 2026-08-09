const base = process.env.EMAIL_OS_CHECK_BASE_URL || "http://localhost:3000"

const endpoints = [
  "/api/email-os/production/readiness-score",
  "/api/email-os/production/provider-validation",
  "/api/email-os/production/mailbox-validation",
  "/api/email-os/production/route-protection",
  "/api/email-os/production/monitoring-events",
  "/api/email-os/final/readiness"
]

console.log("\nEMAIL-OS PRODUCTION SMOKE")
console.log("=========================")

let failed = false

for (const endpoint of endpoints) {
  try {
    const res = await fetch(`${base}${endpoint}`)
    const json = await res.json().catch(() => null)
    const ok = res.ok && json?.ok !== false
    console.log(`${ok ? "✓" : "✗"} ${endpoint}`)
    if (!ok) failed = true
  } catch (error) {
    console.log(`✗ ${endpoint} - ${error instanceof Error ? error.message : "failed"}`)
    failed = true
  }
}

if (failed) process.exit(1)
console.log("\nProduction smoke passed.")
