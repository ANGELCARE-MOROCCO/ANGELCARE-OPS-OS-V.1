import { CsvConfigurationWorkspace } from '@/components/carelink/service-design/workspaces/CsvConfigurationWorkspace'
import { requireHomeServiceAccess } from '@/lib/homeservice-design/server/auth'
import { getServiceDesignSnapshot } from '@/lib/homeservice-design/server/repository'
export const dynamic = 'force-dynamic'
export default async function Page(){ await requireHomeServiceAccess('homeservice_design.import_configuration'); const snapshot=await getServiceDesignSnapshot(); return <CsvConfigurationWorkspace imports={snapshot.imports}/> }
