import type { Metadata } from 'next'
import { SeoEnhancements } from '../../seo-power/public'
import {MarketplaceBrandPair} from '../../jobkix/MarketplaceEntry'
import {KidFlixMarketplaceEntry} from '../../kidflix/MarketplaceEntry'
import { HEADER_BRAND_COPY } from '../header-brand-copy'
import {LiveExperienceSlot} from '../../live-experience-command/components/LiveExperienceSlot'
import Image from 'next/image'
import {VisitorCountry} from '../../visitor-country/VisitorCountry'
import countryStyles from '../../visitor-country/country.module.css'
import Link from '@/angelcare-marketplace/navigation-care-orbit/CareOrbitLink'
import type { ReactNode } from 'react'
import { GitCompareArrows, Heart, MapPin, Menu, Search, ShoppingBag, UserRound } from 'lucide-react'
import type { CmsMenuItem } from '../../experience-builder/types'
import styles from '../public.module.css'
import { EnterpriseFooter } from '../../footer-studio/components/EnterpriseFooter'
import { LiveExperienceLayer } from '../../live-experience-command/components/LiveExperienceLayer'
import { buildStructuredData } from '../../web-presence/runtime'
import { getPublicStorefrontNavigation } from '../../public-experience-authority/storefront-navigation'

const localeNames={fr:'FR',en:'EN',ar:'AR'} as const

export async function GlobalPublicShell({locale,navigation,children,preview=false,variant='standard',contentElement='main',seoPath,seoBase}:{locale:'fr'|'en'|'ar';navigation:CmsMenuItem[];children:ReactNode;preview?:boolean;variant?:'standard'|'marketplace';contentElement?:'main'|'div';seoPath?:string;seoBase?:Metadata}){
  const ContentElement=contentElement
  const marketplace=variant==='marketplace'
  const structuredData=preview?null:await buildStructuredData('MARKETPLACE')
  const storefrontNavigation=marketplace?getPublicStorefrontNavigation(locale):[]
  return <div id="angelcare-marketplace-top" className={styles.publicRoot} data-variant={variant} dir={locale==='ar'?'rtl':'ltr'} lang={locale}>
    {structuredData?<script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(structuredData).replace(/</g,'\\u003c')}}/>:null}
    {marketplace ? <>
      <div className={styles.marketTop}><div><span>Copyright ANGELCARE MARKET PLACE</span><div><Link href={`/angelcare-marketplace/${locale}/trust`}>Trust & Quality</Link><Link href={`/angelcare-marketplace/${locale}/account/support`}>{locale==='ar'?'الدعم':locale==='en'?'Support':'Support'}</Link><Link href={`/angelcare-marketplace/${locale}/professionals`}>{locale==='ar'?'المحترفون':locale==='en'?'Professionals':'Professionnels'}</Link></div></div></div>
      <header className={styles.marketHeader}><div className={styles.marketHeaderInner}><a className={styles.mobileMenu} href="#marketplace-primary-navigation" aria-label="Ouvrir la navigation"><Menu/></a><Link href={`/angelcare-marketplace/${locale}`} className={styles.marketBrand}><Image src="/brand/angelcare-pearl-rim-colour-r1.png" alt="ANGELCARE" width={720} height={240} priority/><span><strong>{HEADER_BRAND_COPY.audience}</strong><small>{HEADER_BRAND_COPY.promise}</small></span></Link><form action={`/angelcare-marketplace/${locale}/marketplace/search`} className={styles.headerSearch}><Search size={20}/><input name="q" aria-label="Recherche Marketplace" placeholder={locale==='ar'?'ابحث في سوق أنجل كير':locale==='en'?'Search the ANGELCARE Marketplace':'Rechercher dans tout le Marketplace'}/><button type="submit">{locale==='ar'?'بحث':locale==='en'?'Search':'Rechercher'}</button></form><div className={styles.marketActions}><VisitorCountry locale={locale}/><Link href={`/angelcare-marketplace/${locale}/account/saved`} aria-label={locale==='ar'?'المحفوظات':locale==='en'?'Saved items':'Favoris'}><Heart/></Link><Link href={`/angelcare-marketplace/${locale}/marketplace/compare`} aria-label={locale==='ar'?'المقارنة':locale==='en'?'Compare':'Comparer'}><GitCompareArrows/></Link><Link href={`/angelcare-marketplace/${locale}/basket`} aria-label={locale==='fr'?'Panier':locale==='ar'?'السلة':'Basket'}><ShoppingBag/></Link><Link href={`/angelcare-marketplace/${locale}/account`} aria-label="Account"><UserRound/></Link></div></div></header>
      <LiveExperienceSlot name="above_navigation"/><nav className={styles.marketNav} id="marketplace-primary-navigation" aria-label={locale==='ar'?'واجهات سوق أنجل كير':locale==='en'?'ANGELCARE atomic storefronts':'Storefronts atomiques ANGELCARE'}><div><div className={styles.marketStorefrontRail}>{storefrontNavigation.map(item=><Link className={styles.marketStorefrontLink} data-accent={item.accent} data-storefront={item.key} href={item.href} key={item.key}>{item.label}</Link>)}<MarketplaceBrandPair><KidFlixMarketplaceEntry/></MarketplaceBrandPair><Link className={styles.marketAllLink} href={`/angelcare-marketplace/${locale}/marketplace`}>{locale==='ar'?'كل السوق':locale==='en'?'All Marketplace':'Tout le Marketplace'}</Link></div><div className={styles.marketLocale}>{(['fr','en','ar'] as const).map(code=><Link href={`/angelcare-marketplace/${code}`} data-active={locale===code} key={code}>{localeNames[code]}</Link>)}</div></div></nav>
    </> : <header className={styles.header}><div className={styles.headerInner}><Link href={`/angelcare-marketplace/${locale}`} className={styles.brand}><Image src="/brand/angelcare-pearl-rim-colour-r1.png" alt="ANGELCARE" width={720} height={240} priority/><span className={styles.brandMeta}><strong>{HEADER_BRAND_COPY.audience}</strong><span>{HEADER_BRAND_COPY.promise}</span></span></Link><nav className={styles.nav} aria-label="Navigation publique">{navigation.slice(0,7).map(item=><Link href={item.href} key={item.id}>{item.label}</Link>)}<Link href={`/angelcare-marketplace/${locale}/contact`}>Contact</Link><MarketplaceBrandPair><KidFlixMarketplaceEntry/></MarketplaceBrandPair></nav><div className={styles.locale}><VisitorCountry locale={locale}/>{(['fr','en','ar'] as const).map(code=><Link href={`/angelcare-marketplace/${code}`} data-active={locale===code} key={code}>{localeNames[code]}</Link>)}</div></div></header>}
    <LiveExperienceSlot name="after_header"/><LiveExperienceSlot name="below_navigation"/>{!preview?<LiveExperienceLayer locale={locale}/>:null}{preview ? <div role="status" className={styles.previewStatus}>PRÉVISUALISATION GOUVERNÉE · NON PUBLIÉE</div> : null}<ContentElement className={marketplace?styles.marketMain:styles.main}><LiveExperienceSlot name="before_content"/>{children}{seoPath&&!preview?<SeoEnhancements world="angelcare" path={seoPath} base={seoBase}/>:null}<LiveExperienceSlot name="after_content"/></ContentElement>
    <LiveExperienceSlot name="before_footer"/><EnterpriseFooter locale={locale} marketplace={marketplace}/><div className={countryStyles.credit}><a href="https://db-ip.com" target="_blank" rel="noopener noreferrer">IP Geolocation by DB-IP</a></div>
  </div>
}
