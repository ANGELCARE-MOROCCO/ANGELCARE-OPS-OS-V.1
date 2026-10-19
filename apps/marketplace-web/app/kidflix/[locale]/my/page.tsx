import {notFound} from 'next/navigation';
import {isLocale} from '@/angelcare-marketplace/kidflix/catalogue';
import {Workspace} from '@/angelcare-marketplace/kidflix/journey/Workspace';
export default async function Page({params}:{params:Promise<{locale:string}>}){const {locale}=await params;if(!isLocale(locale))notFound();return <Workspace locale={locale}/>;}
