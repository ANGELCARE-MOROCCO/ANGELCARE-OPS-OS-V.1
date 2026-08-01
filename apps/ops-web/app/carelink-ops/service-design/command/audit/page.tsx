import { AuditTimelineWorkspace } from '@/components/carelink/service-design/workspaces/AuditTimelineWorkspace'
import { requireHomeServiceAccess } from '@/lib/homeservice-design/server/auth'
import { getServiceDesignSnapshot } from '@/lib/homeservice-design/server/repository'
export const dynamic = 'force-dynamic'
export default async function Page(){ await requireHomeServiceAccess('homeservice_design.audit'); const snapshot=await getServiceDesignSnapshot(); return <AuditTimelineWorkspace events={snapshot.auditEvents}/> }
