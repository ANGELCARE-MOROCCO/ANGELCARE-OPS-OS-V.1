import Angelcare360InventoryAuditDrawer from '@/components/angelcare360/inventory/Angelcare360InventoryAuditDrawer'
import Angelcare360InventorySectionScreen from '@/components/angelcare360/inventory/Angelcare360InventorySectionScreen'
import { listAngelcare360InventoryAuditEvents } from '@/lib/angelcare360/server/inventory'
import { getAngelcare360InventoryContext } from '../_utils'

export const dynamic = 'force-dynamic'

export default async function Angelcare360InventoryAuditPage() {
  const context = await getAngelcare360InventoryContext()
  const events = await listAngelcare360InventoryAuditEvents({ schoolId: context.school.id })
  return (
    <Angelcare360InventorySectionScreen title="Audit inventaire" description="Journal des opérations et blocages inventaire.">
      <Angelcare360InventoryAuditDrawer events={events} />
    </Angelcare360InventorySectionScreen>
  )
}
