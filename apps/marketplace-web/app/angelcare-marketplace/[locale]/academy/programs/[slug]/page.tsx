import { PublicAcademyExperience } from '@/angelcare-marketplace/academy-engine/components/PublicAcademyExperience'
export default async function Page({params}:{params:Promise<{locale:string;slug:string}>}){const {locale}=await params;const safe=locale==='ar'||locale==='en'?locale:'fr';return <PublicAcademyExperience programs={[]} locale={safe}/>}
