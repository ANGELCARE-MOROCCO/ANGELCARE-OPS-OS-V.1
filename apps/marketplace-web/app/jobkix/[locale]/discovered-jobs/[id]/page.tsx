// Legacy external vacancy URL: preserve links, route to the existing detailed vacancy.
import {notFound,redirect} from 'next/navigation';
import {isLocale} from '@/angelcare-marketplace/jobkix/contracts';
import {uuid} from '@/angelcare-marketplace/jobkix/validation';
export const dynamic='force-dynamic';
export const metadata={robots:{index:false,follow:true}};
export default async function Page({params}:{params:Promise<{locale:string;id:string}>}){
 const {locale,id}=await params;if(!isLocale(locale))notFound();
 try{uuid(id);}catch{notFound();}
 redirect(`/jobkix/${locale}/jobs/${id}`);
}
