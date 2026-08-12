import { notFound } from 'next/navigation'
import { PublicDevelopmentExperience } from '@/angelcare-marketplace/development-engine/components/PublicDevelopmentExperience'
import { listDevelopmentActivities,listDevelopmentCategories,listDevelopmentKits } from '@/angelcare-marketplace/development-engine/repository'
import {getPublishedSurface} from '@/angelcare-marketplace/total-commerce-control/repository'
export default async function Page({params}:{params:Promise<{locale:string}>}){const {locale}=await params;if(!['fr','en','ar'].includes(locale))notFound();const safe=locale as 'fr'|'en'|'ar';const [categories,activities,kits,experience]=await Promise.all([listDevelopmentCategories(),listDevelopmentActivities({status:'published'}),listDevelopmentKits(),getPublishedSurface('development',{locale:safe}).catch(()=>null)]);return <PublicDevelopmentExperience locale={safe} categories={categories} activities={activities} kits={kits} experience={experience}/>}
