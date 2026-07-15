import type { ComponentType } from 'react'
import { listMissionControlRecords } from '@/lib/missions/repository'
import * as MissionControlModule from '@/components/carelink/ops/missions/CareLinkMissionControlCenter'
import { CareLinkMissionsProductionHardeningBanner } from '@/components/carelink/ops/missions/CareLinkMissionsProductionHardeningBanner'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function CareLinkOpsMissionsPage() {
  const records = await listMissionControlRecords()

  const MissionControlComponent = ((MissionControlModule as any).CareLinkMissionControlCenter || (MissionControlModule as any).default) as ComponentType<{ initialRecords: any[] }>

  if (!MissionControlComponent) {
    throw new Error('CareLinkMissionControlCenter export is unavailable. Check the mission control component export after the latest terminal patch.')
  }

  return (
    <>
      <CareLinkMissionsProductionHardeningBanner />
      <MissionControlComponent initialRecords={records} />
    </>
  )
}
