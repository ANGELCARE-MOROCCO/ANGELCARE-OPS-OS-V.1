import { requireAccess } from '@/lib/auth/requireAccess'
import MegaProductionConsole from './_components/MegaProductionConsole'
import ProductionControlWorkbench from './_components/ProductionControlWorkbench'

export const dynamic = 'force-dynamic'

export default async function MegaProductionPage() {
  await requireAccess(['revenue_os.mega_production.view', 'revenue_os.mega_production.manage', 'revenue_os.manage'])
  return <div data-revenue-workspace="mega-production"><MegaProductionConsole /><ProductionControlWorkbench /></div>
}
