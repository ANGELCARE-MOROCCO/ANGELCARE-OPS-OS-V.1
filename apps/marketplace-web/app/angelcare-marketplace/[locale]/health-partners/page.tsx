import { PublicHealthExperience } from '@/angelcare-marketplace/b2b-verticals/components/PublicHealthExperience'
import { publicVerticalSnapshot } from '@/angelcare-marketplace/b2b-verticals/repository'
import { getPublishedSurface } from '@/angelcare-marketplace/total-commerce-control/repository'
export default async function Page({params}:{params:Promise<{locale:string}>}){const {locale:raw}=await params;const locale=raw==='ar'?'ar':raw==='en'?'en':'fr';const [snapshot,experience]=await Promise.all([publicVerticalSnapshot('health_partner'),getPublishedSurface('health-partners',{locale}).catch(()=>null)]);return <PublicHealthExperience locale={locale} mode="health-partners" activePrograms={snapshot.activePrograms} organizations={snapshot.organizations} experience={experience}/>}
