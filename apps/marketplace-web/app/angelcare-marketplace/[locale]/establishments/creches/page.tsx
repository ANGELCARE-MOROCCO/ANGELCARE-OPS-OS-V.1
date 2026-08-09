import { PublicEstablishmentsExperience } from '@/angelcare-marketplace/b2b-verticals/components/PublicEstablishmentsExperience'
import { publicVerticalSnapshot } from '@/angelcare-marketplace/b2b-verticals/repository'
export default async function Page({params}:{params:Promise<{locale:string}>}){const {locale:raw}=await params;const locale=raw==='ar'?'ar':raw==='en'?'en':'fr';const snapshot=await publicVerticalSnapshot('establishment');return <PublicEstablishmentsExperience locale={locale} mode="creches" activePrograms={snapshot.activePrograms} organizations={snapshot.organizations}/>}
