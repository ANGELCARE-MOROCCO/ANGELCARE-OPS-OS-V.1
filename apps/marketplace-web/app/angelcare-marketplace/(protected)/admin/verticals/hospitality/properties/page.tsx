import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { HospitalityPropertyBoard } from '@/angelcare-marketplace/b2b-verticals/components/SpecializedBoards'
import { listHospitalityProperties } from '@/angelcare-marketplace/b2b-verticals/repository'
export default async function Page(){const context=await requireMarketplacePageContext('marketplace.b2b.hospitality.view');return <HospitalityPropertyBoard properties={await listHospitalityProperties(context)}/>}
