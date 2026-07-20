import fs from "node:fs"
import path from "node:path"
import { execFileSync } from "node:child_process"
import { createRequire } from "node:module"

const require = createRequire(import.meta.url)
const ts = require("typescript")

const root = process.cwd()
const files = {
  service: "lib/email-os-core/sender-identity.ts",
  sendMail: "lib/email-os-core/send-mail.ts",
  bridge: "bridge/windows-email-bridge/server.js",
  bridgeDeploy: "bridge/windows-email-bridge/deploy-sender-identity-update.ps1",
  ui: "components/opsos/windows-node/SenderIdentityControlCenter.tsx",
  windowsNode: "components/opsos/windows-node/WindowsNodeControlCenter.tsx",
  compose: "components/email-os-core/EnterpriseComposeModal.tsx",
  registryApi: "app/api/opsos/windows-node/sender-identities/route.ts",
  proofApi: "app/api/opsos/windows-node/sender-identities/[identityId]/test/route.ts",
  activateApi: "app/api/opsos/windows-node/sender-identities/[identityId]/activate/route.ts",
  senderPreviewApi: "app/api/email-os/access/sender-identity/route.ts",
  migration: "supabase/migrations/20260719_email_os_sender_identity_control_plane.sql",
}

for (const [name, relative] of Object.entries(files)) {
  const absolute = path.join(root, relative)
  if (!fs.existsSync(absolute)) throw new Error(`${name} missing: ${relative}`)
}

const contracts = {
  [files.service]: [
    "resolveSenderIdentity",
    "standardSenderDisplayName",
    "saveSenderIdentityDraft",
    "activateSenderIdentity",
    "rollbackSenderIdentity",
    "bulkStandardizeSenderIdentities",
    "senderIdentitySnapshot",
  ],
  [files.sendMail]: [
    "senderIdentityOverride",
    "senderIdentity.fromName",
    "senderIdentity.replyToAddress",
    "X-AngelCare-Sender-Identity-ID",
  ],
  [files.bridge]: [
    "fromName",
    "replyToName",
    "X-AngelCare-From-Name",
    "X-AngelCare-Sender-Identity-ID",
  ],
  [files.ui]: [
    "Identités d’expéditeur Email OS",
    "Appliquer le standard ANGELCARE",
    "Aperçu boîte de réception",
    "Test réel dans Gmail",
    "Versions, comparaison et restauration",
    "Tester toutes les identités",
    "Dupliquer vers…",
    "Créer une identité",
    "Appliquer le standard ANGELCARE",
    "Aperçu boîte de réception",
  ],
  [files.windowsNode]: [
    'id: "sender-identities"',
    "<SenderIdentityControlCenter />",
  ],
  [files.compose]: [
    "Identité externe gouvernée",
    "/api/email-os/access/sender-identity",
  ],
  [files.migration]: [
    "email_os_sender_identities",
    "email_os_sender_identity_versions",
    "email_os_sender_identity_audit",
    "resolved_from_name",
    "freeze_sender_identity",
  ],
}

for (const [relative, required] of Object.entries(contracts)) {
  const source = fs.readFileSync(path.join(root, relative), "utf8")
  for (const token of required) {
    if (!source.includes(token)) throw new Error(`Contract missing in ${relative}: ${token}`)
  }
}

const syntaxFiles = [
  files.service,
  files.sendMail,
  files.ui,
  files.windowsNode,
  files.compose,
  files.registryApi,
  files.proofApi,
  files.activateApi,
  files.senderPreviewApi,
  "app/api/opsos/windows-node/sender-identities/_shared.ts",
  "app/api/opsos/windows-node/sender-identities/[identityId]/route.ts",
  "app/api/opsos/windows-node/sender-identities/[identityId]/suspend/route.ts",
  "app/api/opsos/windows-node/sender-identities/[identityId]/rollback/route.ts",
  "app/api/opsos/windows-node/sender-identities/bulk-standardize/route.ts",
  "app/api/email-os/send-direct/route.ts",
  "app/api/email-os/compose/send/route.ts",
  "app/api/email-os/compose/draft/route.ts",
  "app/api/email-os/cron/queue-worker/route.ts",
]

let failed = false
for (const relative of syntaxFiles) {
  const source = fs.readFileSync(path.join(root, relative), "utf8")
  const result = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      jsx: ts.JsxEmit.Preserve,
      isolatedModules: true,
    },
    reportDiagnostics: true,
    fileName: relative,
  })
  if (result.diagnostics?.length) {
    failed = true
    console.error(`Syntax diagnostics: ${relative}`)
    for (const diagnostic of result.diagnostics) {
      console.error(ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"))
    }
  } else {
    console.log(`Syntax OK: ${relative}`)
  }
}
if (failed) process.exit(1)

execFileSync(process.execPath, ["--check", path.join(root, files.bridge)], { stdio: "inherit" })

console.log("Email OS sender identity control plane verified.")
