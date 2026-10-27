import { Landing,landingMetadata } from '@/angelcare-marketplace/seo-power/Landing';

export const dynamic='force-dynamic';
type Props={params:Promise<{locale:string;slug:string}>};
export async function generateMetadata({params}:Props){const p=await params;return landingMetadata('jobkix',p.locale,p.slug);}
export default async function Page({params}:Props){const p=await params,body=await Landing({world:'jobkix',...p});return body;}
