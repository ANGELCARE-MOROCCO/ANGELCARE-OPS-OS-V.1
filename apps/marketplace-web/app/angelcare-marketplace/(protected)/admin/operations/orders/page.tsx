import {requireMarketplacePageContext} from '@/angelcare-marketplace/auth/context'
import {OperationsQueuePage} from '@/angelcare-marketplace/operations-reconciliation/components/OperationsQueuePage'
import {listFulfillmentCases} from '@/angelcare-marketplace/operations-reconciliation/repository'
export default async function Page(){const c=await requireMarketplacePageContext('marketplace.operations.view');return <OperationsQueuePage title="Product & Kit Fulfillment" eyebrow="PRODUCT OPERATIONS" description="Stock, vendor acceptance, preparation, dispatch, delivery evidence, returns and closure." items={await listFulfillmentCases(c,{kind:'product_order'})}/>}
