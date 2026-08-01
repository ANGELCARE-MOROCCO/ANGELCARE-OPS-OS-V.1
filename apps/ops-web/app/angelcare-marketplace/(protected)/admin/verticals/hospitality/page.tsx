import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { HospitalityCommand } from '@/angelcare-marketplace/b2b-verticals/components/HospitalityCommand'
import { listHospitalityPrograms,listHospitalityProperties,verticalPortfolio } from '@/angelcare-marketplace/b2b-verticals/repository'
export default async function Page(){const context=await requireMarketplacePageContext('marketplace.b2b.hospitality.view');const [portfolio,properties,programs]=await Promise.all([verticalPortfolio({context,vertical:'hospitality'}),listHospitalityProperties(context),listHospitalityPrograms(context)]);return <HospitalityCommand portfolio={portfolio} properties={properties} programs={programs}/>}
