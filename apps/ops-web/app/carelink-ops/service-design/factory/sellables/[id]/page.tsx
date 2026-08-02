import { requireHomeServiceAccess } from '@/lib/homeservice-design/server/auth'
import { FactorySellableDossier } from '@/components/carelink/service-design/factory/FactorySellableDossier'
export const dynamic='force-dynamic'
export default async function Page({params}:{params:Promise<{id:string}>}){await requireHomeServiceAccess('homeservice_design.view');const{id}=await params;return <FactorySellableDossier id={id}/>}
