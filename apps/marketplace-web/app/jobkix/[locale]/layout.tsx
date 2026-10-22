import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { jobkixIcons } from '@/angelcare-marketplace/jobkix/brand';
import { countryOptions } from '@/angelcare-marketplace/jobkix/country-format';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { isLocale } from '@/angelcare-marketplace/jobkix/contracts';
import { CountryProvider } from '@/angelcare-marketplace/jobkix/Country';
import { RuntimeClock } from '@/angelcare-marketplace/jobkix/client/RuntimeClock';
import { Shell } from '@/angelcare-marketplace/jobkix/Shell';
import { countryForHeaders } from '@/angelcare-marketplace/visitor-country/lookup';
import { t } from '@/angelcare-marketplace/jobkix/i18n';
export const dynamic='force-dynamic';
export async function generateMetadata({params}:{params:Promise<{locale:string}>}):Promise<Metadata>{
 const {locale}=await params;if(!isLocale(locale))return {robots:{index:false,follow:false}};
 return {title:{absolute:'JOBKIX · '+t(locale,'heroTitle')},description:t(locale,'heroDescription'),applicationName:'JOBKIX',alternates:{canonical:`/jobkix/${locale}`},icons:jobkixIcons(),openGraph:{type:'website',siteName:'JOBKIX',title:'JOBKIX · GLOBAL CAREERS PLATFORM',description:t(locale,'heroDescription'),images:[]},twitter:{card:'summary',title:'JOBKIX · GLOBAL CAREERS PLATFORM',description:t(locale,'heroDescription'),images:[]}};
}
export default async function JobkixLayout({children,params}:{children:ReactNode;params:Promise<{locale:string}>}){
 const {locale}=await params;if(!isLocale(locale))notFound();
 const country=await countryForHeaders(await headers());
 return <RuntimeClock initialNow={Date.now()}><CountryProvider initialDetected={country.code} locale={locale} countries={countryOptions(locale)}><Shell locale={locale}>{children}</Shell></CountryProvider></RuntimeClock>;
}
