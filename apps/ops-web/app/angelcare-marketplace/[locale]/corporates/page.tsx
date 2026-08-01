import { PublicCorporateExperience } from '@/angelcare-marketplace/b2b-verticals/components/PublicCorporateExperience'
import { publicVerticalSnapshot } from '@/angelcare-marketplace/b2b-verticals/repository'
export default async function Page({params}:{params:Promise<{locale:string}>}){const {locale:raw}=await params;const locale=raw==='ar'?'ar':raw==='en'?'en':'fr';const snapshot=await publicVerticalSnapshot('corporate');return <PublicCorporateExperience locale={locale} mode="corporates" activePrograms={snapshot.activePrograms} organizations={snapshot.organizations}/>}
