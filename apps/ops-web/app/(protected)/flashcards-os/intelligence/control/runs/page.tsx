import IntelligenceRunLedger from '@/components/flashcards-os/intelligence/IntelligenceRunLedger'
import { requireFlashcardsPageAccess } from '@/lib/flashcards-os/server/access'
import { loadIntelligenceOverview } from '@/lib/flashcards-os/intelligence/server/repository'

export default async function RunLedgerPage() {
  await requireFlashcardsPageAccess('flashcards_os.audit_intelligence')
  const data = await loadIntelligenceOverview()
  return <IntelligenceRunLedger runs={data.runs} usage={data.usage} />
}
