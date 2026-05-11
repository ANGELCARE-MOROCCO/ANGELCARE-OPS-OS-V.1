const base = process.env.EMAIL_OS_BASE_URL || "http://localhost:3000"
const mailboxId = process.env.EMAIL_OS_TEST_MAILBOX_ID || "default"

console.log("\nEMAIL-OS IMAP LIFECYCLE TEST")
console.log("============================")
console.log(`Base URL: ${base}`)
console.log(`Mailbox: ${mailboxId}`)

const sync = await fetch(`${base}/api/email-os/sync`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ mailboxId, limit: 10 })
})

const syncJson = await sync.json().catch(() => null)
console.log("Sync API:", sync.status, syncJson)

const inbox = await fetch(`${base}/api/email-os/inbox`)
const inboxJson = await inbox.json().catch(() => null)
console.log("Inbox count:", Array.isArray(inboxJson?.data) ? inboxJson.data.length : "unknown")

console.log("\nNow check /email-os and confirm inbox messages appear.")
