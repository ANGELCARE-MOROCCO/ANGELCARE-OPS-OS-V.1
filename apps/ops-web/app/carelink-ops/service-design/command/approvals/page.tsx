import { ApprovalInboxWorkspace } from '@/components/carelink/service-design/workspaces/ApprovalInboxWorkspace'
import { requireHomeServiceAccess } from '@/lib/homeservice-design/server/auth'
import { getServiceDesignSnapshot } from '@/lib/homeservice-design/server/repository'
export const dynamic = 'force-dynamic'
export default async function Page(){ await requireHomeServiceAccess('homeservice_design.review'); const snapshot=await getServiceDesignSnapshot(); return <ApprovalInboxWorkspace approvals={snapshot.approvals}/> }
