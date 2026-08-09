import fs from 'node:fs'

const requiredFiles = [
  'components/email-os-core/EmailOSWorkspacePro.tsx',
  'components/email-os-core/EnterpriseComposeModal.tsx',
  'components/email-os-core/InboxActionToolbar.tsx',
  'hooks/useEmailOSActionEngine.ts',
  'app/api/email-os/message-action/route.ts',
  'app/api/email-os/workspace-action/route.ts',
  'app/api/email-os/assistant-action/route.ts',
  'lib/email-os-core/send-mail.ts',
  'database/email-os-core-phase34-message-state-actions.sql'
]

const requiredSnippets = [
  ['components/email-os-core/EmailOSWorkspacePro.tsx', 'AssistantActionModal'],
  ['components/email-os-core/EmailOSWorkspacePro.tsx', '/api/email-os/assistant-action'],
  ['components/email-os-core/EmailOSWorkspacePro.tsx', '/api/email-os/message-action'],
  ['components/email-os-core/InboxActionToolbar.tsx', 'mark_unread'],
  ['hooks/useEmailOSActionEngine.ts', '/api/email-os/message-action'],
  ['app/api/email-os/message-action/route.ts', 'move_folder'],
  ['app/api/email-os/workspace-action/route.ts', 'email_os_core_outbox'],
  ['app/api/email-os/assistant-action/route.ts', 'email_os_core_audit'],
  ['components/email-os-core/EmailOSWorkspacePro.tsx', 'withSource(asArray(inboxRes.data), "inbox")'],
  ['components/email-os-core/EmailOSWorkspacePro.tsx', 'sourceOf(selected, view)'],
  ['components/email-os-core/EmailOSWorkspacePro.tsx', 'setActiveTab("starred")'],
  ['app/api/email-os/message-action/route.ts', 'patch.starred = true'],
  ['app/api/email-os/message-action/route.ts', 'patch.status = "trash"'],
  ['app/api/email-os/workspace-action/route.ts', 'patch.deleted_at = now'],
  ['app/api/email-os/message-action/route.ts', 'appliedPatch'],
  ['database/email-os-core-phase34-message-state-actions.sql', 'add column if not exists starred'],
  ['database/email-os-core-phase34-message-state-actions.sql', 'add column if not exists read_at'],
  ['app/api/email-os/message-action/route.ts', 'candidateTables'],
  ['app/api/email-os/message-action/route.ts', 'email_os_core_inbox'],
  ['app/api/email-os/message-action/route.ts', 'tryUpdate'],
  ['app/api/email-os/message-action/route.ts', 'maybeSingle()'],
  ['app/api/email-os/message-action/route.ts', '__emailOsSource'],
  ['app/api/email-os/workspace-action/route.ts', 'email_os_core_inbox'],
  ['hooks/useEmailOSActionEngine.ts', 'targetType: source'],
  ['hooks/useEmailOSActionEngine.ts', 'export function optimisticPatch'],
  ['components/email-os-core/EmailOSWorkspacePro.tsx', 'patchRowsBySource'],
  ['components/email-os-core/EmailOSWorkspacePro.tsx', 'setActionBusy'],
  ['components/email-os-core/EmailOSWorkspacePro.tsx', 'selectedBulkRows'],
  ['components/email-os-core/EmailOSWorkspacePro.tsx', 'runBulkWorkspaceAction'],
  ['components/email-os-core/EmailOSWorkspacePro.tsx', 'Delete forever'],
  ['components/email-os-core/EmailOSWorkspacePro.tsx', 'normalizeActionForView'],
  ['components/email-os-core/InboxActionToolbar.tsx', 'trashMode'],
  ['app/api/email-os/message-action/route.ts', 'permanent_delete'],
  ['app/api/email-os/message-action/route.ts', 'tryPermanentDelete'],
  ['app/api/email-os/message-action/route.ts', '.delete().eq("id", id)'],
  ['database/email-os-core-phase34-message-state-actions.sql', 'public.email_os_core_inbox'],
  ['lib/email-os-core/send-mail.ts', 'sendEmailOSDirect']
]

const forbiddenSnippets = [
  ['components/email-os-core/EmailOSWorkspacePro.tsx', 'Meeting modal ready'],
  ['components/email-os-core/EmailOSWorkspacePro.tsx', 'Task modal ready'],
  ['components/email-os-core/EmailOSWorkspacePro.tsx', 'CRM modal ready'],
  ['components/email-os-core/EmailOSWorkspacePro.tsx', 'available for inbox records only in this patch'],
  ['hooks/useEmailOSActionEngine.ts', 'action === "move_folder") return { ok: true }']
]

function read(file) {
  if (!fs.existsSync(file)) throw new Error(`Missing required file: ${file}`)
  return fs.readFileSync(file, 'utf8')
}

console.log('EMAIL-OS ENTERPRISE WORKSPACE FINAL VERIFY')
console.log('=========================================')

for (const file of requiredFiles) {
  read(file)
  console.log(`✓ ${file}`)
}

for (const [file, snippet] of requiredSnippets) {
  const content = read(file)
  if (!content.includes(snippet)) throw new Error(`${file} missing required snippet: ${snippet}`)
  console.log(`✓ ${file} includes ${snippet}`)
}

for (const [file, snippet] of forbiddenSnippets) {
  const content = read(file)
  if (content.includes(snippet)) throw new Error(`${file} still contains forbidden placeholder/no-op: ${snippet}`)
  console.log(`✓ ${file} no placeholder/no-op ${snippet}`)
}

const sendMail = read('lib/email-os-core/send-mail.ts')
const workspace = read('components/email-os-core/EmailOSWorkspacePro.tsx')
if (!sendMail.includes('resolveEmailOSMailboxIdentity') || !sendMail.includes('sendEmailOSDirect')) {
  throw new Error('Central send-mail resolver marker not found. Do not deploy without reviewing lib/email-os-core/send-mail.ts')
}
if (!workspace.includes('EnterpriseComposeModal')) throw new Error('Workspace lost EnterpriseComposeModal integration')

console.log('Ready.')
