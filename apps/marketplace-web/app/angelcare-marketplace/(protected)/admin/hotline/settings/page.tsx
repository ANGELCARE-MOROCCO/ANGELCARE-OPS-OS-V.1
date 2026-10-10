import {Suspense} from 'react'
import {requireMarketplacePageContext} from '@/angelcare-marketplace/auth/context'
import {HotlineStudio} from '@/angelcare-marketplace/hotline-os/components/HotlineStudio'
export const dynamic='force-dynamic'
export default async function Page(){await requireMarketplacePageContext('marketplace.hotline.settings');return <Suspense fallback={<div role="status">Chargement HOTLINE…</div>}><HotlineStudio/></Suspense>}
