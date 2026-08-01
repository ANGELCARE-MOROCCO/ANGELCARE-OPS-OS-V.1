import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import type { CmsMenuItem } from '../../experience-builder/types'
import styles from '../public.module.css'

const localeNames={fr:'FR',en:'EN',ar:'AR'} as const
export function GlobalPublicShell({locale,navigation,children,preview=false}:{locale:'fr'|'en'|'ar';navigation:CmsMenuItem[];children:ReactNode;preview?:boolean}){
  return <div className={styles.publicRoot} dir={locale==='ar'?'rtl':'ltr'} lang={locale}>
    <header className={styles.header}><div className={styles.headerInner}><Link href={`/angelcare-marketplace/${locale}`} className={styles.brand}><Image src="/logo.png" alt="ANGELCARE" width={180} height={62} priority/><span className={styles.brandMeta}><strong>Build 360</strong><span>Kids, Family & Partner Universe</span></span></Link><nav className={styles.nav} aria-label="Navigation publique">{navigation.slice(0,7).map(item=><Link href={item.href} key={item.id}>{item.label}</Link>)}<Link href={`/angelcare-marketplace/${locale}/contact`}>Contact</Link></nav><div className={styles.locale}>{(['fr','en','ar'] as const).map(code=><Link href={`/angelcare-marketplace/${code}`} data-active={locale===code} key={code}>{localeNames[code]}</Link>)}</div></div></header>
    {preview ? <div role="status" style={{background:'#0f2747',color:'#fff',padding:'10px 24px',textAlign:'center',fontWeight:700}}>PRÉVISUALISATION GOUVERNÉE · NON PUBLIÉE</div> : null}<main className={styles.main}>{children}</main>
    <footer className={styles.footer}><div className={styles.footerInner}><div><Image src="/logo.png" alt="ANGELCARE" width={160} height={55}/><p>Un univers gouverné pour les familles, établissements, partenaires et professionnels de l’enfance.</p></div><div><strong>Familles</strong><Link href={`/angelcare-marketplace/${locale}/familles`}>Accompagnement</Link><br/><Link href="/angelcare-marketplace/family/request">Commencer</Link></div><div><strong>Organisations</strong><Link href={`/angelcare-marketplace/${locale}/establishments`}>Établissements</Link><br/><Link href={`/angelcare-marketplace/${locale}/corporates`}>Entreprises</Link></div><div><strong>Confiance</strong><Link href={`/angelcare-marketplace/${locale}/trust`}>Trust Center</Link><br/><Link href={`/angelcare-marketplace/${locale}/contact`}>Support</Link></div></div></footer>
  </div>
}
