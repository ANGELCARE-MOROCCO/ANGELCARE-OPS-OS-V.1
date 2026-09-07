import { getAngelcare360AccessContext } from '@/lib/angelcare360/server/context'
import { getSanilaCommandCenterSnapshot, isTrustedSanilaMasterDemoContext } from '@/lib/angelcare360/server/command-center-experience'
import { getSanilaDemoExperienceState } from '@/lib/angelcare360/server/demo-experience-state'
import MasterDemoExperienceCenter from '@/components/angelcare360/demo-experience/MasterDemoExperienceCenter'
import TenantExecutiveCommandCenter from '@/components/angelcare360/command-center/TenantExecutiveCommandCenter'

export const dynamic = 'force-dynamic'

export default async function Angelcare360CommandCenterPage() {
  const context = await getAngelcare360AccessContext()
  if (!context?.school) return null

  const snapshot = await getSanilaCommandCenterSnapshot(context)

  if (isTrustedSanilaMasterDemoContext(context)) {
    const visitState = await getSanilaDemoExperienceState(context)
    return (
      <MasterDemoExperienceCenter
        snapshot={snapshot}
        initialState={visitState}
        visitorName={context.user.full_name || context.user.name || context.user.email || null}
      />
    )
  }

  return (
    <TenantExecutiveCommandCenter
      snapshot={snapshot}
      viewerName={context.user.full_name || context.user.name || context.user.email || null}
    />
  )
}
