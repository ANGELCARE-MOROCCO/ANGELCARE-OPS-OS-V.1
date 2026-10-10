import {Suspense} from 'react'
import {requireMarketplacePageContext} from '@/angelcare-marketplace/auth/context'
import {HotlineWorkspace} from '@/angelcare-marketplace/hotline-os/components/HotlineWorkspace'
export const dynamic='force-dynamic'
export default async function Page(){await requireMarketplacePageContext('marketplace.hotline.view');return <Suspense fallback={<div role="status">Chargement HOTLINE…</div>}><HotlineWorkspace/></Suspense>}
