import {notFound} from 'next/navigation';
import {isLocale} from '@/angelcare-marketplace/kidflix/catalogue';
import {PersonalLibrary} from '@/angelcare-marketplace/kidflix/personal/PersonalLibrary';
export default async function Page({params}:{params:Promise<{locale:string}>}){const {locale}=await params;if(!isLocale(locale))notFound();return <PersonalLibrary locale={locale}/>;}
