import{apiSuccess,apiFailure,requestId}from '@/angelcare-marketplace/server/request'
import{requireMarketplaceApiContext}from '@/angelcare-marketplace/auth/context'
import{enterpriseControlSnapshot}from '@/angelcare-marketplace/enterprise-closure/repository'
import{frontendControlSnapshot}from '@/angelcare-marketplace/total-commerce-control/repository'
import{ADMIN_WORKSPACE_REGISTRY}from '@/angelcare-marketplace/admin-excellence/workspace-registry'
export const dynamic='force-dynamic'
export async function GET(request:Request){const rid=requestId(request);try{await requireMarketplaceApiContext('marketplace.admin.access');const[commerce,frontend]=await Promise.all([enterpriseControlSnapshot(),frontendControlSnapshot()]);return apiSuccess({status:'ready',workspaceCount:ADMIN_WORKSPACE_REGISTRY.length,commerce:{customers:commerce.customers.length,orders:commerce.orders.length,invoices:commerce.invoices.length,receipts:commerce.receipts.length,promotions:commerce.promotions.length,subscriptions:commerce.subscriptions.length,bookings:commerce.bookings.length},frontend:frontend.metrics},{requestId:rid})}catch(error){return apiFailure(error,rid)}}
