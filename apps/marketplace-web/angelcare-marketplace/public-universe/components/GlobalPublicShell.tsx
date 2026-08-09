import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { GitCompareArrows, Heart, MapPin, Menu, Search, ShoppingBag, UserRound } from 'lucide-react'
import type { CmsMenuItem } from '../../experience-builder/types'
import styles from '../public.module.css'
import { EnterpriseFooter } from '../../footer-studio/components/EnterpriseFooter'
import { LiveExperienceLayer } from '../../live-experience-command/components/LiveExperienceLayer'

const localeNames={fr:'FR',en:'EN',ar:'AR'} as const

export function GlobalPublicShell({locale,navigation,children,preview=false,variant='standard'}:{locale:'fr'|'en'|'ar';navigation:CmsMenuItem[];children:ReactNode;preview?:boolean;variant?:'standard'|'marketplace'}){
  const marketplace=variant==='marketplace'
  return <div id="angelcare-marketplace-top" className={styles.publicRoot} data-variant={variant} dir={locale==='ar'?'rtl':'ltr'} lang={locale}>
    {marketplace ? <>
      <div className={styles.marketTop}><div><span>Copyright ANGELCARE MARKET PLACE</span><div><Link href={`/angelcare-marketplace/${locale}/trust`}>Trust & Quality</Link><Link href={`/angelcare-marketplace/${locale}/contact`}>Support</Link><Link href={`/angelcare-marketplace/${locale}/partner-os`}>Professionnels</Link></div></div></div>
      <header className={styles.marketHeader}><div className={styles.marketHeaderInner}><button className={styles.mobileMenu} type="button" aria-label="Menu"><Menu/></button><Link href={`/angelcare-marketplace/${locale}`} className={styles.marketBrand}><Image src="/b2b-plaquette-partenaires/assets/angelcare-original-logo.png" alt="ANGELCARE Preschool & Kindergarten" width={722} height={198} priority/><span><strong>GLOBAL MARKETPLACE</strong><small>Kids · Family · Partner Universe</small></span></Link><form action={`/angelcare-marketplace/${locale}/marketplace`} className={styles.headerSearch}><Search size={20}/><input name="q" aria-label="Recherche Marketplace" placeholder={locale==='ar'?'ابحث في سوق أنجل كير':locale==='en'?'Search the ANGELCARE Marketplace':'Rechercher dans tout le Marketplace'}/><button type="submit">{locale==='ar'?'بحث':locale==='en'?'Search':'Rechercher'}</button></form><div className={styles.marketActions}><Link href={`/angelcare-marketplace/${locale}/marketplace?territory=MA-MASTER`}><MapPin/><span>Morocco<small>Territoire</small></span></Link><Link href={`/angelcare-marketplace/${locale}/marketplace?saved=1`} aria-label="Saved"><Heart/></Link><Link href={`/angelcare-marketplace/${locale}/marketplace?compare=1`} aria-label="Compare"><GitCompareArrows/></Link><Link href={`/angelcare-marketplace/${locale}/quote-basket`} aria-label="Quote basket"><ShoppingBag/></Link><Link href={`/angelcare-marketplace/${locale}/account`} aria-label="Account"><UserRound/></Link></div></div></header>
      <div className={styles.marketNav}><div>{navigation.slice(0,9).map(item=><Link href={item.href} key={item.id}>{item.label}</Link>)}<Link href={`/angelcare-marketplace/${locale}/marketplace`}>{locale==='ar'?'كل السوق':locale==='en'?'All Marketplace':'Tout le Marketplace'}</Link><div className={styles.marketLocale}>{(['fr','en','ar'] as const).map(code=><Link href={`/angelcare-marketplace/${code}`} data-active={locale===code} key={code}>{localeNames[code]}</Link>)}</div></div></div>
    </> : <header className={styles.header}><div className={styles.headerInner}><Link href={`/angelcare-marketplace/${locale}`} className={styles.brand}><Image src="/logo.png" alt="ANGELCARE" width={180} height={62} priority/><span className={styles.brandMeta}><strong>Build 360</strong><span>Kids, Family & Partner Universe</span></span></Link><nav className={styles.nav} aria-label="Navigation publique">{navigation.slice(0,7).map(item=><Link href={item.href} key={item.id}>{item.label}</Link>)}<Link href={`/angelcare-marketplace/${locale}/contact`}>Contact</Link></nav><div className={styles.locale}>{(['fr','en','ar'] as const).map(code=><Link href={`/angelcare-marketplace/${code}`} data-active={locale===code} key={code}>{localeNames[code]}</Link>)}</div></div></header>}
    <LiveExperienceLayer locale={locale}/>{preview ? <div role="status" className={styles.previewStatus}>PRÉVISUALISATION GOUVERNÉE · NON PUBLIÉE</div> : null}<main className={marketplace?styles.marketMain:styles.main}>{children}</main>
    <EnterpriseFooter locale={locale} marketplace={marketplace}/>
  </div>
}
