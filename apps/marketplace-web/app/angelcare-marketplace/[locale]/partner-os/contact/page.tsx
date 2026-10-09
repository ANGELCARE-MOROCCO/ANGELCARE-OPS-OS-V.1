import {EnquiryPage} from '@/angelcare-marketplace/business-worlds/EnquiryPage'
export default async function Page({params,searchParams}:{params:Promise<{locale:string}>;searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const [{locale},query]=await Promise.all([params,searchParams])
 return <EnquiryPage world="partner-os" rawLocale={locale} brief={query.brief} sourceRoute="partner-os/contact"/>
}
