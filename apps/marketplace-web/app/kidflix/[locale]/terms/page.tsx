import {notFound} from 'next/navigation';
import type {Metadata} from 'next';
import {isLocale} from '@/angelcare-marketplace/kidflix/catalogue';
import {KidFlixComplianceInformation} from '@/angelcare-marketplace/kidflix/information/ComplianceInformation';
export async function generateMetadata({params}:{params:Promise<{locale:string}>}):Promise<Metadata>{const {locale}=await params;if(!isLocale(locale))notFound();return {title:'KidFlix · Usage terms',robots:{index:false,follow:true}};}
export default async function Page({params}:{params:Promise<{locale:string}>}){const {locale}=await params;if(!isLocale(locale))notFound();return <KidFlixComplianceInformation locale={locale} topic='terms'/>;}
