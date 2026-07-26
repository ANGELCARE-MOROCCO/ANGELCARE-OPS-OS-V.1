import CommandKernelWorkspace from './_components/CommandKernelWorkspace'
import CanonicalCsvImportDock from '../_components/imports/CanonicalCsvImportDock'

export default function CommandKernelPage() {
  return <div data-revenue-workspace="command-kernel"><CommandKernelWorkspace section="overview" /><CanonicalCsvImportDock kind="commands" /></div>
}
