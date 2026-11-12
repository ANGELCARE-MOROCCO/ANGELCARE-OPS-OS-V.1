import type {ReactNode} from 'react'
import {notFound} from 'next/navigation'
import Link from '@/angelcare-marketplace/navigation-care-orbit/CareOrbitLink'
import {CommerceFrame} from '@/angelcare-marketplace/customer-experience/CommerceFrame'
import styles from './account-frame.module.css'
export default async function Layout({children,params}:{children:ReactNode;params:Promise<{locale:string}>}) {
 const {locale}=await params
 if(locale!=='fr'&&locale!=='en'&&locale!=='ar')notFound()
 const word=(fr:string,en:string,ar:string)=>locale==='fr'?fr:locale==='ar'?ar:en
 return <div className={styles.accountFrame} data-ac-account-frame="r1"><CommerceFrame locale={locale}>{children}<footer className={styles.accountLegal}><span>ANGELCARE <small>{word('Votre espace privé','Your private account','مساحتك الخاصة')}</small></span><nav aria-label={word('Liens utiles','Useful links','روابط مفيدة')}><Link href={'/angelcare-marketplace/'+locale+'/account/support'}>{word('Assistance','Support','الدعم')}</Link><Link href={'/angelcare-marketplace/'+locale+'/legal/privacy'}>{word('Confidentialité','Privacy','الخصوصية')}</Link><Link href={'/angelcare-marketplace/'+locale+'/legal/terms'}>{word('Conditions','Terms','الشروط')}</Link><Link href={'/angelcare-marketplace/'+locale+'/legal/cookies'}>{word('Cookies','Cookies','ملفات الارتباط')}</Link></nav></footer></CommerceFrame></div>
}
