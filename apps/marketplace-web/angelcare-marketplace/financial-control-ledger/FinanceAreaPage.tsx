import {hasMarketplacePermission,requireMarketplacePageContext} from '@/angelcare-marketplace/auth/context'
import {financialControlLedgerSnapshot} from './repository'
import {FinanceControlLedger} from './components/FinanceControlLedger'
import type {FinanceWorkspaceMode} from './types'
export const dynamic='force-dynamic'
export async function FinanceAreaPage({mode}:{mode:FinanceWorkspaceMode}){const context=await requireMarketplacePageContext('marketplace.finance.view');return <FinanceControlLedger initial={await financialControlLedgerSnapshot(context)} mode={mode} permissions={{manage:hasMarketplacePermission(context,'marketplace.finance.manage'),refund:hasMarketplacePermission(context,'marketplace.finance.exceptions.approve'),walletAdjust:hasMarketplacePermission(context,'marketplace.finance.exceptions.approve'),reconcile:hasMarketplacePermission(context,'marketplace.finance.reconciliation.manage')}}/>}
