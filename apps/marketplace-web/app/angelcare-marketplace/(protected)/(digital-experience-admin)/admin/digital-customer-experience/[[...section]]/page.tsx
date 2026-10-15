import { notFound } from 'next/navigation'
import { requireMarketplaceAdminPageContext } from '@/angelcare-marketplace/auth/context'
import { MODULES } from '@/angelcare-marketplace/digital-customer-experience/registry'
import { bootstrap } from '@/angelcare-marketplace/digital-customer-experience/repository'
import { Workspace } from '@/angelcare-marketplace/digital-customer-experience/components/Workspace'
export const dynamic='force-dynamic'
export default async function Page({params}:{params:Promise<{section?:string[]}>}){const {section=[]}=await params;const module=section[0]||'dashboard';if(!MODULES.some(m=>m.key===module)||section.length>1)notFound();const context=await requireMarketplaceAdminPageContext('marketplace.digital_experience.view');const initial=await bootstrap(context);return <Workspace initial={initial} module={module}/>}
