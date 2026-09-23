import Image from 'next/image'
import Link from 'next/link'

import { CUSTOMER_ACCESS, PRIMARY_NAVIGATION, SANILA_PUBLIC_ROOT, sanilaHref } from '../content'
import { SanilaIcon } from '../SanilaIcon'
import styles from '../SanilaPublic.module.css'

export function SanilaHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.utilityBar}>
        <div className={styles.utilityInner}>
          <Link href="/angelcare-marketplace/fr">← AngelCare Marketplace</Link>
          <span>Produit destiné aux établissements éducatifs</span>
        </div>
      </div>
      <div className={styles.headerInner}>
        <Link href={SANILA_PUBLIC_ROOT} className={styles.logoLink} aria-label="SANILA — accueil">
          <Image src="/sanila/sanila-operating-system-logo.png" alt="SANILA Operating System" width={188} height={66} priority />
        </Link>
        <nav className={styles.nav} aria-label="Navigation principale SANILA">
          {PRIMARY_NAVIGATION.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}
        </nav>
        <div className={styles.headerActions}>
          <Link className={styles.headerDemo} href={sanilaHref('demonstration')}>Demander une démo</Link>
          <Link className={styles.headerLogin} href={sanilaHref('connexion')}>Se connecter <SanilaIcon name="arrow" size={15} /></Link>
        </div>
        <details className={styles.mobileMenu}>
          <summary aria-label="Ouvrir la navigation">Menu</summary>
          <div className={styles.mobileMenuPanel}>
            {PRIMARY_NAVIGATION.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}
            <Link href={sanilaHref('demonstration')}>Demander une démo</Link>
            <Link href={sanilaHref('connexion')}>Se connecter</Link>
          </div>
        </details>
      </div>
    </header>
  )
}

export function SanilaFooter() {
  const domains = ['direction', 'administration', 'admissions', 'presences', 'pedagogie', 'finance', 'transport', 'rapports']
  return (
    <footer className={styles.footer}>
      <div className={styles.footerTop}>
        <div className={styles.footerBrand}>
          <Image src="/sanila/sanila-operating-system-logo.png" alt="SANILA Operating System" width={190} height={67} />
          <p>Le système d’exploitation complet de votre établissement.</p>
          <Link href={sanilaHref('demonstration')}>Demander une démonstration <SanilaIcon name="arrow" size={15} /></Link>
        </div>
        <div className={styles.footerColumn}>
          <strong>Produit</strong>
          {domains.map((slug) => <Link key={slug} href={sanilaHref(slug)}>{slug === 'presences' ? 'Présences' : slug === 'pedagogie' ? 'Pédagogie' : slug.charAt(0).toUpperCase() + slug.slice(1)}</Link>)}
        </div>
        <div className={styles.footerColumn}>
          <strong>Solutions</strong>
          <Link href={sanilaHref('solutions/creches-maternelles')}>Crèches & maternelles</Link>
          <Link href={sanilaHref('solutions/ecoles-privees')}>Écoles privées</Link>
          <Link href={sanilaHref('solutions/groupes-scolaires')}>Groupes scolaires</Link>
          <Link href={sanilaHref('mise-en-service')}>Mise en service</Link>
        </div>
        <div className={styles.footerColumn}>
          <strong>Décider</strong>
          <Link href={sanilaHref('securite')}>Sécurité</Link>
          <Link href={sanilaHref('tarifs')}>Tarifs</Link>
          <Link href={sanilaHref('faq')}>FAQ</Link>
          <Link href={sanilaHref('contact')}>Contact</Link>
        </div>
        <div className={styles.footerColumn}>
          <strong>Accès utilisateurs</strong>
          {CUSTOMER_ACCESS.map((entry) => <Link key={entry.href} href={entry.href}>{entry.title}</Link>)}
        </div>
      </div>
      <div className={styles.footerBottom}>
        <span>© 2026 SANILA Operating System • AngelCare</span>
        <span>Les capacités dépendant d’une configuration ou d’un fournisseur externe ne sont jamais présentées comme actives par défaut.</span>
      </div>
    </footer>
  )
}
