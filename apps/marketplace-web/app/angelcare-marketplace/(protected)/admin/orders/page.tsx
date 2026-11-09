import { hasMarketplacePermission, hasMarketplaceWorkspaceAccess, requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { transactionFlightDeckSnapshot } from '@/angelcare-marketplace/transaction-flight-deck/repository'
import { OrdersWorkspace } from '@/angelcare-marketplace/orders360/Workspace'
import { assistedOrderOptions } from '@/angelcare-marketplace/total-commerce-control/repository'
export const dynamic='force-dynamic'
export default async function Page({searchParams}:{searchParams?:Promise<Record<string,string|string[]|undefined>>}) {
  const context=await requireMarketplacePageContext('marketplace.operations.view')
  const params=searchParams?await searchParams:{}
  const query=Object.fromEntries(Object.entries(params).map(([key,value])=>[key,Array.isArray(value)?value[0]:value]))
  const canCreate=hasMarketplacePermission(context,'marketplace.operations.missions.create')
  const [snapshot,options]=await Promise.allSettled([
    transactionFlightDeckSnapshot({allHistory:true}), canCreate?assistedOrderOptions():Promise.resolve(null),
  ])
  return <OrdersWorkspace initial={snapshot.status==='fulfilled'?snapshot.value:null} initialError={snapshot.status==='rejected'?'Le portefeuille n’a pas pu être chargé. Réessayez pour obtenir les données canoniques.':''} options={options.status==='fulfilled'?options.value:null} initialQuery={query} actorId={context.actor.id} permissions={{
    createOrder:canCreate,manageOrder:hasMarketplacePermission(context,'marketplace.operations.missions.manage'),
    manageLines:hasMarketplacePermission(context,'marketplace.operations.missions.manage'),manageFinance:hasMarketplacePermission(context,'marketplace.finance.manage'),exportDocuments:true,
    supplier:hasMarketplaceWorkspaceAccess(context,'workspace.supplier_command'),supplierApprove:hasMarketplacePermission(context,'marketplace.admin.access'),
    dispatch:hasMarketplacePermission(context,'marketplace.operations.dispatch.manage'),assign:hasMarketplacePermission(context,'marketplace.operations.assign'),
  }}/>
}
