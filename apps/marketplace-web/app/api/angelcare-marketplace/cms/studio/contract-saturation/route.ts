import { requireMarketplaceApiContext } from '@/angelcare-marketplace/auth/context'
import { studioContractSaturationDeveloperContractJson } from '@/angelcare-marketplace/studio-contract-saturation/developer-contract'
export const runtime='nodejs'
export const dynamic='force-dynamic'
export async function GET(){await requireMarketplaceApiContext('marketplace.cms.export');return Response.json({data:studioContractSaturationDeveloperContractJson()},{headers:{'Cache-Control':'no-store'}})}
