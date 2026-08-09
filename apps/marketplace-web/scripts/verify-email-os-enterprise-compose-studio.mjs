import fs from "node:fs"

const files = [
  "components/email-os-core/EnterpriseComposeModal.tsx",
  "app/api/email-os/compose/draft/route.ts",
  "app/api/email-os/send-direct/route.ts",
  "app/api/email-os/cron/queue-worker/route.ts",
  "app/api/email-os/templates/route.ts",
  "app/api/email-os/compose/ai-assist/route.ts",
  "app/api/email-os/workflows/route.ts",
  "database/email-os-enterprise-compose-studio-20260719.sql"
]

const markers = {
  "components/email-os-core/EnterpriseComposeModal.tsx": [
    "Studio de communication externe Email OS",
    "/api/email-os/compose-resources",
    "/api/email-os/templates",
    "/api/email-os/send-direct",
    "/api/email-os/compose/draft",
    "/api/email-os/compose/ai-assist",
    "/api/email-os/workflows",
    "RichEmailEditor",
    "Bibliothèque de modèles",
    "Variables appliquées au message",
    "Signature officielle appliquée à l’envoi",
    "Aperçu destinataire",
    "Programmer l’envoi",
    "Suivi sans réponse",
    "Message envoyé avec succès"
  ],
  "app/api/email-os/compose/draft/route.ts": [
    "scheduled-queue",
    "email_os_core_queue",
    "scheduledAt",
    "trackingEnabled",
    "attachments"
  ],
  "app/api/email-os/cron/queue-worker/route.ts": [
    "scheduled_at.is.null",
    "processing",
    "retry",
    "normalizeAttachments",
    "withTrackingPixel"
  ],
  "database/email-os-enterprise-compose-studio-20260719.sql": [
    "email_os_core_outbox_scheduled_idx",
    "email_os_core_queue_due_idx",
    "tracking_enabled",
    "scheduled_at"
  ]
}

console.log("EMAIL-OS ENTERPRISE COMPOSE STUDIO VERIFY")
console.log("=========================================")

let failed = false
for (const file of files) {
  const exists = fs.existsSync(file)
  console.log(`${exists ? "✓" : "✗"} ${file}`)
  if (!exists) failed = true
}

for (const [file, required] of Object.entries(markers)) {
  if (!fs.existsSync(file)) continue
  const text = fs.readFileSync(file, "utf8")
  for (const marker of required) {
    const ok = text.includes(marker)
    console.log(`${ok ? "✓" : "✗"} ${file}: ${marker}`)
    if (!ok) failed = true
  }
}

const modal = fs.readFileSync("components/email-os-core/EnterpriseComposeModal.tsx", "utf8")
const forbidden = [
  "Generate with AI",
  "This message has been reviewed for clarity",
  "Request read receipt On",
  "attachments is not defined"
]
for (const marker of forbidden) {
  const ok = !modal.includes(marker)
  console.log(`${ok ? "✓" : "✗"} removed obsolete marker: ${marker}`)
  if (!ok) failed = true
}

if (failed) process.exit(1)
console.log("\nEnterprise compose studio contract is present.")
