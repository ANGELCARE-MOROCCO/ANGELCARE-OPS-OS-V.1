import type { SovereignTowerKey } from '@/data/angelcare360/operator-sovereign-navigation'
import { loadSovereignWorkspaceSnapshot } from '@/lib/angelcare360/operator/sovereign/data'
import SovereignWorkspaceClient from './SovereignWorkspaceClient'

export default async function SovereignWorkspacePage({ tower }: { tower:SovereignTowerKey }) {
  const snapshot=await loadSovereignWorkspaceSnapshot(tower)
  return <SovereignWorkspaceClient snapshot={snapshot}/>
}
