import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

const root = process.cwd()
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8')
const exists = (p) => fs.existsSync(path.join(root, p))
const fail = (msg) => { console.error(`FAIL  ${msg}`); process.exitCode = 1 }
const pass = (msg) => console.log(`PASS  ${msg}`)
const assert = (cond, msg) => cond ? pass(msg) : fail(msg)

const files = {
  gateway: 'lib/email-os-core/storage-gateway.ts',
  send: 'lib/email-os-core/send-mail.ts',
  ticket: 'lib/email-os-core/storage-transfer-ticket.ts',
  attachments: 'lib/email-os-core/compose-attachments.ts',
  enterprise: 'components/email-os-core/EnterpriseComposeModal.tsx',
  production: 'components/email-os-core/ProductionComposeStudio.tsx',
  sendDirect: 'app/api/email-os/send-direct/route.ts',
  draft: 'app/api/email-os/compose/draft/route.ts',
  composeAttachments: 'app/api/email-os/compose/attachments/route.ts',
  savedDrafts: 'app/api/email-os/saved-drafts/route.ts',
  queue: 'app/api/email-os/cron/queue-worker/route.ts',
  uploadTicket: 'app/api/storage/upload-ticket/route.ts',
  uploadFinalize: 'app/api/storage/upload-finalize/route.ts',
  download: 'app/api/storage/download/[fileId]/route.ts',
  bridge: 'bridge/windows-email-bridge/server.js',
  migration: 'supabase/migrations/20260808020000_email_os_attachment_transport_integrity.sql',
}

for (const [key, p] of Object.entries(files)) assert(exists(p), `${key} file exists: ${p}`)
if (process.exitCode) process.exit(process.exitCode)

const gateway = read(files.gateway)
const send = read(files.send)
const ticket = read(files.ticket)
const attachments = read(files.attachments)
const enterprise = read(files.enterprise)
const production = read(files.production)
const sendDirect = read(files.sendDirect)
const draft = read(files.draft)
const composeAttachments = read(files.composeAttachments)
const savedDrafts = read(files.savedDrafts)
const queue = read(files.queue)
const uploadTicket = read(files.uploadTicket)
const uploadFinalize = read(files.uploadFinalize)
const download = read(files.download)
const bridge = read(files.bridge)
const migration = read(files.migration)

assert(gateway.includes('responseMode: "json" | "binary" = "json"'), 'storage gateway has explicit binary response mode')
assert(gateway.includes('response.clone().text()'), 'binary error parsing uses a clone')
assert(gateway.includes('}, "binary")'), 'download helper requests binary mode')
const binaryBranch = gateway.slice(gateway.indexOf('if (responseMode === \"binary\")'), gateway.indexOf('const text = await response.text()', gateway.indexOf('if (responseMode === \"binary\")')))
assert(binaryBranch.includes('response.clone().text()') && !binaryBranch.includes('await response.text()'), 'binary success path does not consume original response body')

assert(ticket.includes('EMAIL_STORAGE_TRANSFER_SIGNING_SECRET'), 'dedicated transfer signing secret is required')
assert(ticket.includes('crypto.timingSafeEqual'), 'ticket verification uses timingSafeEqual')
assert(ticket.includes('storage_upload_receipt'), 'ticket model includes upload receipts')
assert(ticket.includes('TRANSFER_PURPOSE_MISMATCH'), 'ticket purpose mismatch is rejected')

for (const [name, source] of [['EnterpriseComposeModal', enterprise], ['ProductionComposeStudio', production]]) {
  assert(source.includes('/api/storage/upload-ticket'), `${name} requests signed upload ticket`)
  assert(source.includes('x-email-storage-ticket'), `${name} sends transfer ticket directly to bridge`)
  assert(source.includes('/api/storage/upload-finalize'), `${name} finalizes signed upload receipt`)
  const helperStart = source.indexOf('async function uploadAttachmentToGateway')
  const helperEnd = source.indexOf('\n}\n', helperStart) + 3
  const helper = source.slice(helperStart, helperEnd)
  assert(!helper.includes('/api/storage/upload"'), `${name} normal attachment helper no longer proxies binary through legacy upload API`)
  assert(!helper.includes('FileReader'), `${name} direct upload helper does not convert new file to Base64`)
}

assert(/async function saveDraft\([\s\S]*?attachments:\s*safeAttachments/.test(production), 'ProductionComposeStudio saveDraft sends attachments')
assert(/async function sendQueue\([\s\S]*?attachments:\s*safeAttachments/.test(production), 'ProductionComposeStudio sendQueue sends attachments')
assert(enterprise.includes('composeAttachmentsFromSeed(selectedEmail?.attachments)'), 'Enterprise compose can hydrate durable server draft attachments without JSX change')

assert(sendDirect.indexOf('persistComposeAttachments') < sendDirect.indexOf('sendEmailOSDirect({'), 'send-direct persists attachment refs before transport')
assert(draft.includes('persistComposeAttachments'), 'draft route durably persists attachment refs')
assert(draft.includes('attachments,'), 'scheduled queue retains durable attachment refs')
assert(queue.includes('loadComposeAttachments'), 'queue worker can recover durable outbox attachments')
assert(savedDrafts.includes('loadComposeAttachments'), 'saved drafts endpoint hydrates durable attachments')
assert(composeAttachments.includes('persistComposeAttachments') && attachments.includes('storage_file_id'), 'compose attachment API persists storage_file_id through authoritative helper')
assert(composeAttachments.includes('export async function GET'), 'compose attachment API supports authorized hydration')

assert(attachments.includes('ATTACHMENT_ACCESS_DENIED'), 'server attachment validator enforces ownership failures')
assert(attachments.includes('EMAIL_OS_MAX_ATTACHMENT_BYTES'), 'server attachment validator enforces per-file limit')
assert(attachments.includes('EMAIL_OS_MAX_TOTAL_ATTACHMENT_BYTES'), 'server attachment validator enforces total limit')
assert(attachments.includes('mailbox_id'), 'server attachment validator checks mailbox metadata')

assert(uploadTicket.includes('requiredPermission: "can_send"'), 'upload ticket requires can_send')
assert(!uploadTicket.includes('EMAIL_BRIDGE_ADMIN_TOKEN'), 'upload ticket never exposes/reuses admin token')
assert(uploadFinalize.includes('verifyStorageTransferTicket(receipt, "storage_upload_receipt")'), 'upload finalize cryptographically verifies bridge receipt')
assert(download.includes('signStorageTransferTicket("storage_download"'), 'download API issues signed direct-download ticket')
assert(download.includes('NextResponse.redirect'), 'download API redirects binary delivery away from Vercel buffering')

assert(send.includes('prepareBridgeAttachments'), 'bridge send has compact attachment-reference preparation')
assert(send.includes('storageFileId'), 'bridge send payload supports storage references')
assert(send.includes('normalizeEmailAttachmentsForLocal'), 'local SMTP fallback retains binary compatibility path')
assert(send.indexOf('preparedAttachments = await prepareBridgeAttachments') < send.indexOf('response = await fetch(endpoint'), 'attachment preparation is outside bridge network fetch try boundary')
assert(send.includes('EMAIL_BRIDGE_CONNECTION_FAILED'), 'actual network errors have truthful bridge connection code')

assert(bridge.includes('function normalizeBridgeAttachments(input, diagnostics = {})'), 'Windows bridge resolves attachment refs with send diagnostics')
assert(bridge.includes('findStorageRecordById(storageFileId)'), 'Windows bridge resolves storageFileId locally')
assert(bridge.includes('path: found.filePath'), 'Nodemailer receives only bridge-resolved local path')
assert(!/path:\s*clean\(item/.test(bridge), 'Windows bridge never trusts client-supplied attachment filesystem path')
assert(bridge.includes('PUT" && pathname.startsWith("/storage/direct-upload/"'), 'Windows bridge exposes signed direct upload')
assert(bridge.includes('GET" && pathname.startsWith("/storage/direct-download/"'), 'Windows bridge exposes signed direct download')
assert(bridge.includes('crypto.timingSafeEqual'), 'Windows bridge verifies transfer signatures timing-safely')
assert(!bridge.includes('Access-Control-Allow-Origin": "*"'), 'direct transfer does not use wildcard CORS')
assert(bridge.includes('EMAIL_STORAGE_ALLOWED_ORIGINS'), 'direct upload uses exact configured origin allowlist')
assert(bridge.includes('STORAGE_TRANSFER_ALREADY_USED'), 'direct upload fileId is single-use against replay overwrite')
assert(bridge.includes('/admin/storage/upload'), 'existing admin storage upload remains')
assert(bridge.includes('/admin/storage/download/'), 'existing admin storage download remains')
assert(bridge.includes('pathname === "/send"'), 'existing /send route remains')
assert(bridge.includes('SMTP_REJECTED'), 'bridge surfaces SMTP rejection code')

const forbiddenSql = /\b(DROP|TRUNCATE|DELETE\s+FROM)\b/i
assert(!forbiddenSql.test(migration.replace(/--.*$/gm, '')), 'migration contains no DROP/TRUNCATE/DELETE FROM')
assert(migration.includes('add column if not exists storage_file_id'), 'migration adds durable storage_file_id')
assert(migration.includes('create unique index if not exists'), 'migration adds idempotency uniqueness')

function renderTailHash(source) {
  const idx = source.lastIndexOf('\n  return (')
  if (idx < 0) throw new Error('final render block not found')
  return crypto.createHash('sha256').update(source.slice(idx)).digest('hex')
}
const expectedEnterprise = '904fd999fc535483c9a0fc1275101e4c9d03b50236b9066762aca771bfce55e6'
const expectedProduction = 'fcb12b0673605765140069ee8911e1f7d071c5d2f9ee40610c453e6b627e8c0b'
assert(renderTailHash(enterprise) === expectedEnterprise, 'EnterpriseComposeModal final render block is byte-identical to forensic baseline')
assert(renderTailHash(production) === expectedProduction, 'ProductionComposeStudio final render block is byte-identical to forensic baseline')

if (process.exitCode) {
  console.error('\nEMAIL OS ATTACHMENT TRANSPORT ACCEPTANCE: FAIL')
  process.exit(process.exitCode)
}
console.log('\nEMAIL OS ATTACHMENT TRANSPORT ACCEPTANCE: PASS')
