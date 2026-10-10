import {AcademyPage} from '@/angelcare-marketplace/specialist-worlds/AcademyPage'
export const dynamic='force-dynamic'
export default async function Page({params,searchParams}:{params:Promise<{locale:string}>;searchParams:Promise<{brief?:string|string[]}>}){const [{locale},query]=await Promise.all([params,searchParams]);return <AcademyPage rawLocale={locale} request brief={query.brief}/>;}
