const base = process.env.EMAIL_OS_BASE_URL || "http://localhost:3000"
const mailboxId = process.env.EMAIL_OS_TEST_MAILBOX_ID || "mbx_supports_angelcare_ma"
const toEmail = process.env.EMAIL_OS_TEST_TO

if (!toEmail) {
  console.error("Missing EMAIL_OS_TEST_TO")
  process.exit(1)
}

const payload = {
  mailboxId,
  toEmail,
  subject: "Email-OS Proof — queue/outbox alignment",
  body: "Test réel : compose → outbox → queue worker → SMTP."
}

console.log("\nEMAIL-OS SEND WORKER PROOF")
console.log("==========================")

const send = await fetch(`${base}/api/email-os/send`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload)
})

const sendJson = await send.json().catch(() => null)
console.log("Send:", send.status, sendJson)

const before = await fetch(`${base}/api/email-os/outbox`)
const beforeJson = await before.json().catch(() => null)
console.log("Outbox before worker:", beforeJson?.data?.[0])

const worker = await fetch(`${base}/api/email-os/cron/queue-worker`, {
  method: "POST",
  headers: { "Content-Type": "application/json" }
})

const workerJson = await worker.json().catch(() => null)
console.log("Worker:", worker.status, workerJson)

const after = await fetch(`${base}/api/email-os/outbox`)
const afterJson = await after.json().catch(() => null)
console.log("Outbox after worker:", afterJson?.data?.[0])
