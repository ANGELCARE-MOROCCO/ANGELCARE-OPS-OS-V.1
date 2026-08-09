import {requireMarketplacePageContext} from '@/angelcare-marketplace/auth/context'
import {FulfillmentDossier} from '@/angelcare-marketplace/operations-reconciliation/components/FulfillmentDossier'
import {getFulfillmentDossier} from '@/angelcare-marketplace/operations-reconciliation/repository'
export default async function Page({params}:{params:Promise<{caseId:string}>}){const{caseId}=await params;const c=await requireMarketplacePageContext('marketplace.operations.view');return <FulfillmentDossier data={await getFulfillmentDossier(caseId,c)}/>}
