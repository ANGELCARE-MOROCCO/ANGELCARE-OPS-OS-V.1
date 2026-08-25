import {requireMarketplacePageContext} from '@/angelcare-marketplace/auth/context'
import {financialControlLedgerSnapshot} from './repository'
import {FinanceControlLedger} from './components/FinanceControlLedger'
import type {FinanceWorkspaceMode} from './types'
export const dynamic='force-dynamic'
export async function FinanceAreaPage({mode}:{mode:FinanceWorkspaceMode}){const context=await requireMarketplacePageContext('marketplace.finance.view');return <FinanceControlLedger initial={await financialControlLedgerSnapshot(context)} mode={mode}/>}
