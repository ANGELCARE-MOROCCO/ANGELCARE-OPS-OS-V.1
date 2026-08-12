import { PublicCorporateExperience } from '@/angelcare-marketplace/b2b-verticals/components/PublicCorporateExperience'
import { publicVerticalSnapshot } from '@/angelcare-marketplace/b2b-verticals/repository'
import { getPublishedSurface } from '@/angelcare-marketplace/total-commerce-control/repository'
export default async function Page({params}:{params:Promise<{locale:string}>}){const {locale:raw}=await params;const locale=raw==='ar'?'ar':raw==='en'?'en':'fr';const [snapshot,experience]=await Promise.all([publicVerticalSnapshot('corporate'),getPublishedSurface('corporates',{locale}).catch(()=>null)]);return <PublicCorporateExperience locale={locale} mode="corporates" activePrograms={snapshot.activePrograms} organizations={snapshot.organizations} experience={experience}/>}
