import { PublicHealthExperience } from '@/angelcare-marketplace/b2b-verticals/components/PublicHealthExperience'
import { publicVerticalSnapshot } from '@/angelcare-marketplace/b2b-verticals/repository'
export default async function Page({params}:{params:Promise<{locale:string}>}){const {locale:raw}=await params;const locale=raw==='ar'?'ar':raw==='en'?'en':'fr';const snapshot=await publicVerticalSnapshot('health_partner');return <PublicHealthExperience locale={locale} mode="mother-baby-care" activePrograms={snapshot.activePrograms} organizations={snapshot.organizations}/>}
