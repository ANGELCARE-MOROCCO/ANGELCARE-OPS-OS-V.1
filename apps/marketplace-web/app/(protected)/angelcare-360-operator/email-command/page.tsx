import EmailCommandOperatingSystem from '@/components/angelcare360/operator/email-command/EmailCommandOperatingSystem'
import { normalizeEmailCommandMode } from '@/components/angelcare360/operator/email-command/EmailCommandContract'
import { loadEmailCommandSnapshot } from '@/lib/angelcare360/operator/email-command'

export const dynamic = 'force-dynamic'

export default async function Angelcare360OperatorEmailCommandPage({ searchParams }: { searchParams: Promise<{ view?: string | string[] }> }) {
  const params = await searchParams
  const raw = Array.isArray(params.view) ? params.view[0] : params.view
  const snapshot = await loadEmailCommandSnapshot()
  return <EmailCommandOperatingSystem snapshot={snapshot} initialMode={normalizeEmailCommandMode(raw)} />
}
