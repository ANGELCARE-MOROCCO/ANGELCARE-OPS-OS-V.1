import { requireHomeServiceAccess } from '@/lib/homeservice-design/server/auth'
import { getServiceDesignSnapshot } from '@/lib/homeservice-design/server/repository'
import { SkillsStaffingWorkspace } from '@/components/carelink/service-design/workspaces/SkillsStaffingWorkspace'

export const dynamic = 'force-dynamic'
export default async function Page() {
  await requireHomeServiceAccess('homeservice_design.manage_staffing')
  const snapshot = await getServiceDesignSnapshot()
  return <SkillsStaffingWorkspace snapshot={snapshot} />
}
