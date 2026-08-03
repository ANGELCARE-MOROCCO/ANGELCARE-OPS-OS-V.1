import {requireMarketplacePageContext} from '@/angelcare-marketplace/auth/context'
import {OperationsQueuePage} from '@/angelcare-marketplace/operations-reconciliation/components/OperationsQueuePage'
import {listFulfillmentCases} from '@/angelcare-marketplace/operations-reconciliation/repository'
export default async function Page(){const c=await requireMarketplacePageContext('marketplace.operations.view');return <OperationsQueuePage title="Partner OS Fulfillment" eyebrow="TENANT ACTIVATION OBLIGATIONS" description="Provisioning, modules, usage limits, onboarding milestones and activation evidence." items={await listFulfillmentCases(c,{kind:'partner_activation'})}/>}
