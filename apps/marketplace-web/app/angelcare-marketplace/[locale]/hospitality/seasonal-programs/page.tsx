import {SpecialistPage} from '@/angelcare-marketplace/specialist-worlds/SpecialistPage'
export const dynamic='force-dynamic'
export default async function Page({params}:{params:Promise<{locale:string}>}){const {locale}=await params;return <SpecialistPage id='seasonal-programmes' rawLocale={locale}/>;}
