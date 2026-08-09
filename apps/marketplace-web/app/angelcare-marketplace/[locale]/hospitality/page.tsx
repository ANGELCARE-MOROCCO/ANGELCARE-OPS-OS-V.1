import { PublicHospitalityExperience } from '@/angelcare-marketplace/b2b-verticals/components/PublicHospitalityExperience'
import { publicVerticalSnapshot } from '@/angelcare-marketplace/b2b-verticals/repository'
export default async function Page({params}:{params:Promise<{locale:string}>}){const {locale:raw}=await params;const locale=raw==='ar'?'ar':raw==='en'?'en':'fr';const snapshot=await publicVerticalSnapshot('hospitality');return <PublicHospitalityExperience locale={locale} mode="hospitality" activePrograms={snapshot.activePrograms} organizations={snapshot.organizations}/>}
