import CommandKernelWorkspace from '../_components/CommandKernelWorkspace'
import CanonicalCsvImportDock from '../../_components/imports/CanonicalCsvImportDock'

export default async function CommandKernelSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params
  return <div data-revenue-workspace="command-kernel" data-command-section={section}><CommandKernelWorkspace section={section} /><CanonicalCsvImportDock kind="commands" /></div>
}
