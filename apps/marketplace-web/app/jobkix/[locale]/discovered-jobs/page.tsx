// Compatibility alias for previously indexed external-discovery URLs.
// All public jobs now use the existing canonical JOBKIX search experience.
import {notFound,redirect} from 'next/navigation';
import {isLocale} from '@/angelcare-marketplace/jobkix/contracts';
export const dynamic='force-dynamic';
export const metadata={robots:{index:false,follow:true}};
export default async function Page({params}:{params:Promise<{locale:string}>}){
 const {locale}=await params;if(!isLocale(locale))notFound();
 redirect(`/jobkix/${locale}/jobs`);
}
