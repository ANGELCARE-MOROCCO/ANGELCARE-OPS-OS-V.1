import type { ReactNode } from 'react'
import Link from '@/angelcare-marketplace/navigation-care-orbit/CareOrbitLink'
import { ArrowUpRight, ChevronLeft, HeartHandshake, LockKeyhole, Sparkles, WalletCards } from 'lucide-react'
import type { CatalogLocale } from '../../catalog-discovery/types'
import { CUSTOMER_LOGO, customerAuthHref, customerLocaleReturnTo, type CustomerAuthMode } from '../auth-navigation'
import { customerAccessCopy } from '../customer-access-copy'
import styles from '../customer-access.module.css'

export function CustomerAccessShell({ locale, mode, returnTo, children }: { locale: CatalogLocale; mode: CustomerAuthMode | 'verified'; returnTo: string; children: ReactNode }) {
  const t = customerAccessCopy(locale)
  return <main className={styles.root} dir={locale === 'ar' ? 'rtl' : 'ltr'} lang={locale} data-localization-ignore>
    <a className={styles.skip} href="#customer-access-form">{t.access}</a>
    <header className={styles.header}>
      <Link href={`/angelcare-marketplace/${locale}`} className={styles.logoLink} aria-label="ANGELCARE"><img src={CUSTOMER_LOGO} alt="ANGEL CARE" width={310} height={100} /></Link>
      <div className={styles.headerActions}><Link href={`/angelcare-marketplace/${locale}`} className={styles.back}><ChevronLeft size={15} />{t.back}</Link>
        <nav className={styles.languages} aria-label={locale === 'ar' ? 'اللغة' : locale === 'fr' ? 'Langue' : 'Language'}>{(['fr', 'en', 'ar'] as const).map(item => <Link key={item} href={customerAuthHref(item, mode, customerLocaleReturnTo(returnTo, item))} hrefLang={item} aria-current={item === locale ? 'page' : undefined}>{item === 'ar' ? 'العربية' : item.toUpperCase()}</Link>)}</nav>
      </div>
    </header>
    <div className={styles.stage}>
      <section className={styles.story} aria-label={t.story}>
        <div className={styles.eyebrow}><span className={styles.dot}/>{t.access}</div>
        <h1>{t.hero.split('\n').map((line, i) => <span key={line} data-accent={i === 2}>{line}</span>)}</h1>
        <p className={styles.heroLead}>{t.heroLead}</p>
        <div className={styles.editorial}>
          <img src="/angelcare-marketplace/customer-access/family-editorial.jpg" alt="" width={1000} height={700} fetchPriority="high" />
          <div className={styles.photoShade}/><div className={styles.photoTag}><Sparkles size={14}/>{t.storyTag}</div>
          <div className={styles.photoCaption}><span>ANGELCARE</span><strong>{t.story}</strong><Link href={`/angelcare-marketplace/${locale}/marketplace/category/families`} aria-label={t.back}><ArrowUpRight size={22}/></Link></div>
          <div className={styles.photoSeal}><HeartHandshake size={19}/><span>{t.private}</span></div>
        </div>
        <div className={styles.benefits}><article><div className={styles.benefitIcon}><HeartHandshake size={21}/></div><strong>{t.service}</strong><p>{t.serviceLead}</p></article><article><div className={styles.benefitIcon}><WalletCards size={21}/></div><strong>{t.wallet}</strong><p>{t.walletLead}</p></article></div>
      </section>
      <section className={styles.panel} id="customer-access-form" tabIndex={-1}>
        <div className={styles.panelRibbon}><LockKeyhole size={13}/>{t.secure}<span>MON ANGELCARE</span></div>
        {children}
      </section>
    </div>
    <section className={styles.faq} aria-label={t.faq}><div><span className={styles.eyebrow}>ANGELCARE</span><h2>{t.faq}</h2></div>{([1, 2, 3] as const).map(i => <details key={i}><summary>{t[`faq${i}`]}<span aria-hidden>+</span></summary><p>{t[`answer${i}`]}</p></details>)}</section>
    <footer className={styles.footer}><span>ANGELCARE · {t.footer}</span><span><LockKeyhole size={12}/>{t.secure} · FR / EN / العربية</span></footer>
  </main>
}
