import { PublicHospitalityExperience } from '@/angelcare-marketplace/b2b-verticals/components/PublicHospitalityExperience'
import { publicVerticalSnapshot } from '@/angelcare-marketplace/b2b-verticals/repository'
import { getPublishedSurface } from '@/angelcare-marketplace/total-commerce-control/repository'
export default async function Page({params}:{params:Promise<{locale:string}>}){const {locale:raw}=await params;const locale=raw==='ar'?'ar':raw==='en'?'en':'fr';const [snapshot,experience]=await Promise.all([publicVerticalSnapshot('hospitality'),getPublishedSurface('hospitality',{locale}).catch(()=>null)]);return <PublicHospitalityExperience locale={locale} mode="hospitality" activePrograms={snapshot.activePrograms} organizations={snapshot.organizations} experience={experience}/>}
