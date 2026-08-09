const base = process.env.EMAIL_OS_BASE_URL || "http://localhost:3000"

const mailboxId = process.env.EMAIL_OS_TEST_MAILBOX_ID
const toEmail = process.env.EMAIL_OS_TEST_TO

if (!mailboxId || !toEmail) {
  console.error("Missing EMAIL_OS_TEST_MAILBOX_ID or EMAIL_OS_TEST_TO")
  console.error("Example:")
  console.error("EMAIL_OS_TEST_MAILBOX_ID=mbx_supports_angelcare_ma EMAIL_OS_TEST_TO=you@gmail.com node scripts/email-os-send-lifecycle-test.mjs")
  process.exit(1)
}

const payload = {
  mailboxId,
  toEmail,
  subject: "Test Email-OS — validation opérationnelle",
  body: "Ceci est un test réel du cycle Compose → Queue → Outbox → SMTP."
}

console.log("\nEMAIL-OS SEND LIFECYCLE TEST")
console.log("============================")
console.log(`Base URL: ${base}`)

const send = await fetch(`${base}/api/email-os/send`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload)
})

const sendJson = await send.json().catch(() => null)
console.log("Send API:", send.status, sendJson)

const outbox = await fetch(`${base}/api/email-os/outbox`)
const outboxJson = await outbox.json().catch(() => null)
console.log("Outbox count:", Array.isArray(outboxJson?.data) ? outboxJson.data.length : "unknown")

const worker = await fetch(`${base}/api/email-os/cron/queue-worker`, {
  method: "POST",
  headers: { "Content-Type": "application/json" }
})

const workerJson = await worker.json().catch(() => null)
console.log("Queue worker:", worker.status, workerJson)

console.log("\nNow check /email-os/outbox-real and your recipient inbox.")
