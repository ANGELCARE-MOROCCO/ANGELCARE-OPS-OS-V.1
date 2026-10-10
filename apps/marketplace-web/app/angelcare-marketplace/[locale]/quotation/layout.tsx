import type {ReactNode} from 'react'
import {notFound} from 'next/navigation'
import {CommerceFrame} from '@/angelcare-marketplace/customer-experience/CommerceFrame'
export default async function Layout({children,params}:{children:ReactNode;params:Promise<{locale:string}>}) {const {locale}=await params;if(locale!=='fr'&&locale!=='en'&&locale!=='ar')notFound();return <CommerceFrame locale={locale}>{children}</CommerceFrame>}
