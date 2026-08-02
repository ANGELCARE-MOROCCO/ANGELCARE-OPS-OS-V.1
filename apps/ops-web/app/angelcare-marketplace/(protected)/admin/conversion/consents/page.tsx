import {ConversionEvidenceBoard} from '@/angelcare-marketplace/conversion-universe/components/ConversionEvidenceBoard'
import {listConversionEvidence} from '@/angelcare-marketplace/conversion-universe/repository'
import {requireMarketplacePageContext} from '@/angelcare-marketplace/auth/context'
export default async function Page(){const context=await requireMarketplacePageContext('marketplace.conversion.view');return <ConversionEvidenceBoard eyebrow="CONSENT EVIDENCE AUTHORITY" title="Consentements versionnés et traçables" records={await listConversionEvidence(context,'consents',400)}/>}
