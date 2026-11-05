import {notFound} from 'next/navigation';
import type {Metadata} from 'next';
import {GlobalPublicShell} from '@/angelcare-marketplace/public-universe/components/GlobalPublicShell';
import {PublicPageRenderer} from '@/angelcare-marketplace/public-universe/components/PublicPageRenderer';
import {getPublicPage} from '@/angelcare-marketplace/public-universe/repository';
import {AngelCareCookieInformation} from '@/angelcare-marketplace/compliance/CookieInformation';
type Locale='fr'|'en'|'ar';
export async function generateMetadata({params}:{params:Promise<{locale:string}>}):Promise<Metadata>{const {locale}=await params;if(!['fr','en','ar'].includes(locale))notFound();return {title:locale==='fr'?'Cookies et confidentialité · ANGELCARE':'Cookies & privacy · ANGELCARE',robots:{index:false,follow:true}};}
export default async function Page({params}:{params:Promise<{locale:string}>}){
 const {locale}=await params;if(!['fr','en','ar'].includes(locale))notFound();
 const published=await getPublicPage({locale,slug:'legal/cookies'}).catch(()=>null);
 return <GlobalPublicShell locale={locale as Locale} navigation={published?.navigation||[]} variant='marketplace'>
  {published?<PublicPageRenderer experience={published} locale={locale as Locale}/>:<AngelCareCookieInformation locale={locale as Locale}/>}
 </GlobalPublicShell>;
}
