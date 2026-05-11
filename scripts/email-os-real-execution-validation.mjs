const base = process.env.EMAIL_OS_BASE_URL || "http://localhost:3000"

const checks = [
  { name: "Mailbox hydration", method: "GET", path: "/api/email-os/mailboxes" },
  { name: "Outbox hydration", method: "GET", path: "/api/email-os/outbox" },
  { name: "Inbox hydration", method: "GET", path: "/api/email-os/inbox" },
  { name: "Provider logs", method: "GET", path: "/api/email-os/provider-logs" },
  { name: "System health", method: "GET", path: "/api/email-os/system/health" }
]

async function request(check) {
  const res = await fetch(`${base}${check.path}`, {
    method: check.method,
    headers: { "Content-Type": "application/json" }
  })

  const json = await res.json().catch(() => null)

  return {
    ...check,
    status: res.status,
    ok: res.ok && json?.ok !== false,
    json
  }
}

console.log("\nEMAIL-OS REAL EXECUTION VALIDATION")
console.log("==================================")
console.log(`Base URL: ${base}\n`)

let failed = false

for (const check of checks) {
  try {
    const result = await request(check)
    console.log(`${result.ok ? "✓" : "✗"} ${check.name} — ${check.path} — ${result.status}`)

    if (!result.ok) {
      failed = true
      console.log("  Error:", result.json?.error || "Unknown")
    }
  } catch (error) {
    failed = true
    console.log(`✗ ${check.name} — ${check.path}`)
    console.log("  Error:", error instanceof Error ? error.message : "Unknown")
  }
}

console.log("\nManual required tests:")
console.log("1. Open /email-os/compose-real")
console.log("2. Select mailbox")
console.log("3. Send test email")
console.log("4. Open /email-os/outbox-real")
console.log("5. Confirm status becomes queued/sent/failed")
console.log("6. POST /api/email-os/cron/queue-worker")
console.log("7. POST /api/email-os/sync")
console.log("8. Confirm inbox/outbox persistence")

if (failed) {
  console.log("\nResult: Validation failed. Fix failed endpoints first.")
  process.exit(1)
}

console.log("\nResult: Base API validation passed.")
