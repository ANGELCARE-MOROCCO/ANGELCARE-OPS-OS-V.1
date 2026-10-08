import Image from 'next/image'
import Link from 'next/link'

import { CUSTOMER_ACCESS, SANILA_PUBLIC_ROOT, sanilaHref } from '../content'
import { SanilaIcon } from '../SanilaIcon'
import styles from '../SanilaPublic.module.css'

const productLinks = [
  ['Architecture produit', 'produit'],
  ['Atlas des capacités', 'fonctionnalites'],
  ['Direction', 'direction'],
  ['Admissions', 'admissions'],
  ['Pédagogie', 'pedagogie'],
  ['Finance', 'finance'],
  ['Transport', 'transport'],
]

const trustLinks = [
  ['Sécurité', 'securite'],
  ['Mise en service', 'mise-en-service'],
  ['Tarifs', 'tarifs'],
  ['FAQ', 'faq'],
]

export function SanilaHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.utilityBar}>
        <div className={styles.utilityInner}>
          <Link href="/angelcare-marketplace/fr">AngelCare Marketplace <SanilaIcon name="arrow" size={12} /></Link>
          <div><span>School Operating System</span><i /> <span>France • Maroc • International</span></div>
        </div>
      </div>
      <div className={styles.headerInner}>
        <Link href={SANILA_PUBLIC_ROOT} className={styles.logoLink} aria-label="SANILA — accueil">
          <Image src="/sanila/sanila-operating-system-logo.png" alt="SANILA Operating System" width={188} height={66} priority />
        </Link>
        <nav className={styles.nav} aria-label="Navigation principale SANILA">
          <details>
            <summary>Produit</summary>
            <div className={styles.navPanel}>
              <div className={styles.navPanelIntro}><span>SANILA</span><strong>Comprendre l’architecture avant les fonctionnalités.</strong><p>Une institution, des responsabilités distinctes, une continuité opérationnelle.</p></div>
              <div className={styles.navPanelLinks}>{productLinks.map(([label, slug]) => <Link href={sanilaHref(slug)} key={slug}>{label}<SanilaIcon name="arrow" size={12} /></Link>)}</div>
            </div>
          </details>
          <Link href={sanilaHref('solutions')}>Solutions</Link>
          <details>
            <summary>Confiance</summary>
            <div className={`${styles.navPanel} ${styles.navPanelCompact}`}><div className={styles.navPanelLinks}>{trustLinks.map(([label, slug]) => <Link href={sanilaHref(slug)} key={slug}>{label}<SanilaIcon name="arrow" size={12} /></Link>)}</div></div>
          </details>
          <Link href={sanilaHref('ressources')}>Ressources</Link>
        </nav>
        <div className={styles.headerActions}>
          <Link className={styles.headerLogin} href={sanilaHref('connexion')}>Accéder à SANILA</Link>
          <Link className={styles.headerDemo} href={sanilaHref('demonstration')}>Demander une démonstration <SanilaIcon name="arrow" size={14} /></Link>
        </div>
        <details className={styles.mobileMenu}>
          <summary aria-label="Ouvrir la navigation">Menu</summary>
          <div className={styles.mobileMenuPanel}>
            <Link href={sanilaHref('produit')}>Produit</Link>
            <Link href={sanilaHref('fonctionnalites')}>Fonctionnalités</Link>
            <Link href={sanilaHref('solutions')}>Solutions</Link>
            <Link href={sanilaHref('securite')}>Sécurité</Link>
            <Link href={sanilaHref('mise-en-service')}>Mise en service</Link>
            <Link href={sanilaHref('demonstration')}>Démonstration</Link>
            <Link href={sanilaHref('connexion')}>Accéder à SANILA</Link>
          </div>
        </details>
      </div>
    </header>
  )
}

export function SanilaFooter() {
  const domains = ['direction', 'administration', 'admissions', 'presences', 'pedagogie', 'finance', 'paie', 'transport', 'communication', 'bibliotheque', 'inventaire', 'reclamations', 'rapports']
  return (
    <footer className={styles.footer}>
      <div className={styles.footerStatement}>
        <span>SANILA / ANGELCARE</span>
        <h2>L’établissement fonctionne déjà comme un système. SANILA lui donne enfin une architecture.</h2>
        <Link href={sanilaHref('demonstration')}>Demander une démonstration <SanilaIcon name="arrow" size={16} /></Link>
      </div>
      <div className={styles.footerTop}>
        <div className={styles.footerBrand}>
          <Image src="/sanila/sanila-operating-system-logo-white.png" alt="SANILA Operating System" width={190} height={67} />
          <p>Le système d’exploitation complet de votre établissement.</p>
          <small>Produit AngelCare • conçu pour une exploitation institutionnelle exigeante.</small>
        </div>
        <div className={styles.footerColumn}><strong>Produit</strong>{domains.slice(0, 7).map((slug) => <Link key={slug} href={sanilaHref(slug)}>{slug === 'presences' ? 'Présences' : slug === 'pedagogie' ? 'Pédagogie' : slug === 'paie' ? 'Paie' : slug.charAt(0).toUpperCase() + slug.slice(1)}</Link>)}</div>
        <div className={styles.footerColumn}><strong>Opérations</strong>{domains.slice(7).map((slug) => <Link key={slug} href={sanilaHref(slug)}>{slug === 'bibliotheque' ? 'Bibliothèque' : slug === 'reclamations' ? 'Réclamations' : slug.charAt(0).toUpperCase() + slug.slice(1)}</Link>)}</div>
        <div className={styles.footerColumn}><strong>Décider</strong><Link href={sanilaHref('solutions')}>Solutions</Link><Link href={sanilaHref('securite')}>Sécurité</Link><Link href={sanilaHref('mise-en-service')}>Mise en service</Link><Link href={sanilaHref('tarifs')}>Tarifs</Link><Link href={sanilaHref('faq')}>FAQ</Link><Link href={sanilaHref('contact')}>Contact</Link></div>
        <div className={styles.footerColumn}><strong>Accès</strong>{CUSTOMER_ACCESS.map((entry) => <Link key={entry.href} href={entry.href}>{entry.title}</Link>)}</div>
      </div>
      <div className={styles.footerBottom}><span>© 2026 SANILA Operating System • AngelCare</span><span>Les capacités dépendant d’un fournisseur ou d’une infrastructure externe restent décrites comme conditionnelles.</span></div>
    </footer>
  )
}
