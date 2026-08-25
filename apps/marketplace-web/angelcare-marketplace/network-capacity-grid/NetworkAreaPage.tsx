import {requireMarketplacePageContext} from '@/angelcare-marketplace/auth/context'
import {networkCapacitySnapshot} from './repository'
import {NetworkCapacityGrid} from './components/NetworkCapacityGrid'
import type {NetworkWorkspaceMode} from './types'
export const dynamic='force-dynamic'
export async function NetworkAreaPage({mode}:{mode:NetworkWorkspaceMode}){const context=await requireMarketplacePageContext('marketplace.providers.view');return <NetworkCapacityGrid initial={await networkCapacitySnapshot(context)} mode={mode}/>}
