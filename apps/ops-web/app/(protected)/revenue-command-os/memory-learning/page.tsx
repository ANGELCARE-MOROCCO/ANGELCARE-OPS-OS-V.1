import KnowledgeMemoryWorkspace from './_components/KnowledgeMemoryWorkspace'
import CanonicalCsvImportDock from '../_components/imports/CanonicalCsvImportDock'

export const dynamic = 'force-dynamic'

export default function RevenueKnowledgeMemoryPage() {
  return <div data-revenue-workspace="memory-learning"><KnowledgeMemoryWorkspace sectionKey="overview" /><CanonicalCsvImportDock kind="doctrines" /></div>
}
