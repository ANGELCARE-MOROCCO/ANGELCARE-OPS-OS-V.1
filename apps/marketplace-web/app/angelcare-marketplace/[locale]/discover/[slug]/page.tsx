import { Landing,landingMetadata } from '@/angelcare-marketplace/seo-power/Landing';
import { GlobalPublicShell } from '@/angelcare-marketplace/public-universe/components/GlobalPublicShell';
export const dynamic='force-dynamic';
type Props={params:Promise<{locale:string;slug:string}>};
export async function generateMetadata({params}:Props){const p=await params;return landingMetadata('angelcare',p.locale,p.slug);}
export default async function Page({params}:Props){const p=await params,body=await Landing({world:'angelcare',...p});return <GlobalPublicShell locale={p.locale as 'en'|'fr'|'ar'} navigation={[]} variant="marketplace">{body}</GlobalPublicShell>;}
