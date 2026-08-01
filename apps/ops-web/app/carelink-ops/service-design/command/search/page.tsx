import { GlobalSearchWorkspace } from '@/components/carelink/service-design/workspaces/GlobalSearchWorkspace'
import { requireHomeServiceAccess } from '@/lib/homeservice-design/server/auth'
export const dynamic = 'force-dynamic'
export default async function Page({searchParams}:{searchParams:Promise<{q?:string}>}){ await requireHomeServiceAccess('homeservice_design.view'); const params=await searchParams; return <GlobalSearchWorkspace initialQuery={params.q || ''}/> }
