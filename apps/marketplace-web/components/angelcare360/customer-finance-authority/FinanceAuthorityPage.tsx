import FinanceAuthorityWorkspace from './FinanceAuthorityWorkspace'
import { getFinanceAuthoritySnapshot } from '@/lib/angelcare360/server/finance-authority'
import type { FinanceAuthorityScene } from '@/types/angelcare360/customer-finance-authority'

export default async function FinanceAuthorityPage({ scene, defaultPlane }: { scene: FinanceAuthorityScene; defaultPlane?: string }) {
  const snapshot = await getFinanceAuthoritySnapshot(scene)
  return <FinanceAuthorityWorkspace scene={scene} snapshot={snapshot} defaultPlane={defaultPlane}/>
}
