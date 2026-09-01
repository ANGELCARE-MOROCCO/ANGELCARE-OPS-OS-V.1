'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

import { CUSTOMER_ACCESS, PRIMARY_NAVIGATION, PRODUCT_DOMAINS, getSanilaPublicPage } from './content'
import { SanilaDemoForm } from './SanilaDemoForm'
import { SanilaIcon } from './SanilaIcon'
import type { SanilaPublicPage } from './types'
import styles from './SanilaPublic.module.css'

const roleExperience = {
  Direction: {
    title: 'Piloter l’établissement avec une vision claire.',
    body: 'Priorités, fréquentation, admissions, finance et opérations réunies pour faciliter la décision.',
    metrics: ['Présence 94%', '12 dossiers à suivre', '3 alertes prioritaires'],
  },
  Administration: {
    title: 'Organiser les opérations quotidiennes sans perdre le fil.',
    body: 'Années scolaires, classes, dossiers, affectations et paramètres dans une même continuité.',
    metrics: ['18 classes actives', '6 actions aujourd’hui', 'Dossiers à jour'],
  },
  Enseignants: {
    title: 'Enseigner, suivre et évaluer.',
    body: 'Cours, devoirs, évaluations, notes et appréciations avec une expérience orientée vers le travail pédagogique.',
    metrics: ['5 cours aujourd’hui', '21 devoirs remis', '2 évaluations'],
  },
  Personnel: {
    title: 'Accéder aux outils utiles à son rôle.',
    body: 'Chaque membre de l’équipe retrouve les informations et actions correspondant à ses responsabilités.',
    metrics: ['Tâches du jour', 'Accès contrôlé', 'Historique disponible'],
  },
  Parents: {
    title: 'Rester connecté à la vie scolaire de son enfant.',
    body: 'Informations, documents et services accessibles selon les choix et règles définis par l’établissement.',
    metrics: ['2 nouveaux messages', '1 document', 'Situation à jour'],
  },
  Élèves: {
    title: 'Retrouver ses informations scolaires dans un espace adapté.',
    body: 'Cours, devoirs, résultats et documents selon la politique de l’établissement et le profil de l’élève.',
    metrics: ['4 cours', '3 devoirs', 'Résultats disponibles'],
  },
} as const

const daySteps = [
  ['07:45', 'Préparation de la journée', 'L’équipe vérifie les priorités, les classes et les points de vigilance.'],
  ['08:10', 'Présences', 'Les présences, absences et retards sont enregistrés.'],
  ['09:30', 'Nouvelle inscription', 'Une demande rejoint le parcours d’admission et son dossier.'],
  ['11:15', 'Pilotage', 'La direction consulte les indicateurs qui nécessitent une décision.'],
  ['13:40', 'Pédagogie', 'Les enseignants suivent les devoirs, évaluations et résultats.'],
  ['15:30', 'Transport', 'Circuits, véhicules, affectations et sécurité sont vérifiés.'],
  ['17:15', 'Clôture', 'L’administration termine les opérations et prépare le lendemain.'],
]

const faqs = [
  ['À qui s’adresse SANILA ?', 'Aux établissements qui veulent réunir administration, pédagogie, finance, opérations et relation avec les familles dans une architecture cohérente.'],
  ['Les utilisateurs ont-ils tous la même interface ?', 'Non. Direction, administration, enseignants, personnel, parents et élèves disposent d’expériences adaptées à leur rôle et à leurs autorisations.'],
  ['Comment se déroule la mise en service ?', 'AngelCare accompagne la préparation, la configuration, les accès, la prise en main et la mise en service selon le périmètre convenu.'],
  ['Tous les modules sont-ils inclus dans toutes les offres ?', 'Non. Certaines capacités dépendent de l’offre, du rôle, de la configuration ou d’un fournisseur externe. SANILA doit toujours présenter cet état de manière explicite.'],
  ['Comment sont protégés les espaces établissements ?', 'Les accès sont authentifiés et gouvernés par des rôles et permissions. Les données de chaque établissement restent séparées et accessibles uniquement selon les rôles et autorisations prévus.'],
  ['Les services externes fonctionnent-ils automatiquement ?', 'Non. Les services dépendant d’un fournisseur ou d’une configuration ne sont pas présentés comme actifs tant que les conditions nécessaires ne sont pas réunies.'],
]

function baseHref(slug: string) {
  return slug === 'accueil' ? '/angelcare-marketplace/fr' : `/angelcare-marketplace/fr/${slug}`
}

function ProductPreview({ page, compact = false }: { page: SanilaPublicPage; compact?: boolean }) {
  const rows = page.features.slice(0, compact ? 4 : 6)
  const summary = page.slug === 'finance'
    ? ['Encaissements', 'Factures', 'Soldes']
    : page.slug === 'admissions'
      ? ['Nouveaux dossiers', 'À suivre', 'Confirmés']
      : page.slug === 'transport'
        ? ['Circuits actifs', 'Véhicules', 'Élèves affectés']
        : ['Aujourd’hui', 'À suivre', 'À jour']

  return (
    <div className={`${styles.productPreview} ${compact ? styles.productPreviewCompact : ''}`} data-accent={page.accent}>
      <div className={styles.previewTopbar}>
        <div className={styles.previewBrand}>
          <span className={styles.previewMark}>S</span>
          <span>
            <strong>SANILA</strong>
            <small>Données de démonstration</small>
          </span>
        </div>
        <div className={styles.previewSearch}><SanilaIcon name="search" size={15}/> Rechercher</div>
        <div className={styles.previewAvatar}>AC</div>
      </div>
      <div className={styles.previewBody}>
        <aside className={styles.previewSidebar}>
          {['Vue d’ensemble', ...rows].map((row, i) => (
            <span key={row} className={i === 0 ? styles.previewActive : ''}>
              <span className={styles.previewDot} />
              {row}
            </span>
          ))}
        </aside>
        <div className={styles.previewCanvas}>
          <div className={styles.previewHeading}>
            <div>
              <small>{page.eyebrow}</small>
              <strong>{page.nav}</strong>
            </div>
            <button type="button">Nouvelle action</button>
          </div>
          <div className={styles.previewStats}>
            {summary.map((item, i) => (
              <div key={item}>
                <span>{item}</span>
                <strong>{i === 0 ? '24' : i === 1 ? '8' : '96%'}</strong>
                <small>{i === 2 ? 'situation actuelle' : '+3 cette semaine'}</small>
              </div>
            ))}
          </div>
          <div className={styles.previewTable}>
            <div className={styles.previewTableHead}><span>Dossier</span><span>Statut</span><span>Dernière mise à jour</span></div>
            {rows.slice(0, 4).map((item, i) => (
              <div className={styles.previewTableRow} key={item}>
                <span><b>{item}</b><small>Référence SAN-{2040 + i}</small></span>
                <span><em className={i % 3 === 0 ? styles.statusGood : i % 3 === 1 ? styles.statusWatch : styles.statusNeutral}>{i % 3 === 0 ? 'À jour' : i % 3 === 1 ? 'À suivre' : 'Préparé'}</em></span>
                <span>Aujourd’hui • {9 + i}:2{i}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <Link href="/angelcare-marketplace/fr" className={styles.logoLink} aria-label="SANILA — accueil">
          <Image src="/sanila/sanila-operating-system-logo.png" alt="SANILA Operating System" width={176} height={62} priority />
        </Link>
        <nav className={styles.nav} aria-label="Navigation principale">
          {PRIMARY_NAVIGATION.map((item) => (
            <Link key={item.href} href={item.href}>{item.label}</Link>
          ))}
        </nav>
        <div className={styles.headerActions}>
          <Link className={styles.headerDemo} href="/angelcare-marketplace/fr/demonstration">Demander une démo</Link>
          <Link className={styles.headerLogin} href="/angelcare-marketplace/fr/connexion">Se connecter <SanilaIcon name="arrow" size={15}/></Link>
        </div>
      </div>
    </header>
  )
}

function Footer() {
  const product = ['direction','administration','admissions','finance','pedagogie','transport','communication','rapports']
  return (
    <footer className={styles.footer}>
      <div className={styles.footerTop}>
        <div className={styles.footerBrand}>
          <Image src="/sanila/sanila-operating-system-logo.png" alt="SANILA Operating System" width={190} height={67} />
          <p>Le système d’exploitation complet de votre établissement.</p>
          <Link href="/angelcare-marketplace/fr/demonstration">Demander une démonstration <SanilaIcon name="arrow" size={15}/></Link>
        </div>
        <div><strong>Produit</strong>{product.map((s)=><Link key={s} href={baseHref(s)}>{getSanilaPublicPage(s)?.nav}</Link>)}</div>
        <div><strong>Solutions</strong><Link href={baseHref('solutions/creches-maternelles')}>Crèches & maternelles</Link><Link href={baseHref('solutions/ecoles-privees')}>Écoles privées</Link><Link href={baseHref('solutions/groupes-scolaires')}>Groupes scolaires</Link></div>
        <div><strong>Ressources</strong><Link href={baseHref('securite')}>Sécurité</Link><Link href={baseHref('mise-en-service')}>Mise en service</Link><Link href={baseHref('faq')}>FAQ</Link><Link href={baseHref('ressources')}>Ressources</Link></div>
        <div><strong>Accès</strong>{CUSTOMER_ACCESS.filter((x)=>x.key!=='portal').map((x)=><Link key={x.href} href={x.href}>{x.title}</Link>)}</div>
      </div>
      <div className={styles.footerBottom}>
        <span>© 2026 SANILA Operating System • by AngelCare</span>
        <span>Expérience publique destinée aux établissements et utilisateurs SANILA.</span>
      </div>
    </footer>
  )
}

function SystemMap() {
  const groups = [
    ['Pilotage', 'Direction', 'Rapports', 'Audit'],
    ['Vie scolaire', 'Élèves', 'Familles', 'Présences', 'Admissions'],
    ['Pédagogie', 'Cours', 'Devoirs', 'Évaluations', 'Notes'],
    ['Finance', 'Frais', 'Factures', 'Paiements', 'Soldes'],
    ['Équipe', 'Personnel', 'Enseignants', 'Paie'],
    ['Opérations', 'Transport', 'Bibliothèque', 'Inventaire', 'Réclamations'],
  ]
  return (
    <section className={`${styles.section} ${styles.systemSection}`}>
      <div className={styles.sectionIntro}>
        <span>ARCHITECTURE SANILA</span>
        <h2>Un système d’exploitation pour toute la vie de l’établissement.</h2>
        <p>Les modules ne vivent pas isolément. Ils partagent les mêmes personnes, classes, décisions et contextes opérationnels.</p>
      </div>
      <div className={styles.systemMap}>
        <div className={styles.systemCore}><span>S</span><strong>SANILA</strong><small>Une source de vérité</small></div>
        {groups.map((group, i)=>(
          <div className={styles.systemNode} data-node={i+1} key={group[0]}>
            <strong>{group[0]}</strong>
            <p>{group.slice(1).join(' • ')}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function PersonaSection() {
  const [role, setRole] = useState<keyof typeof roleExperience>('Direction')
  const current = roleExperience[role]
  const page = getSanilaPublicPage(role === 'Direction' ? 'direction' : role === 'Administration' ? 'administration' : role === 'Enseignants' ? 'pedagogie' : role === 'Parents' ? 'communication' : role === 'Élèves' ? 'pedagogie' : 'administration')!
  return (
    <section className={`${styles.section} ${styles.personaSection}`}>
      <div className={styles.sectionIntro}>
        <span>UNE PLATEFORME • PLUSIEURS EXPÉRIENCES</span>
        <h2>Le même établissement. Une expérience adaptée à chacun.</h2>
        <p>La cohérence vient du système partagé. La simplicité vient d’une expérience pensée pour le rôle de l’utilisateur.</p>
      </div>
      <div className={styles.roleTabs} role="tablist" aria-label="Choisir une expérience SANILA">
        {(Object.keys(roleExperience) as Array<keyof typeof roleExperience>).map((item)=>(
          <button key={item} onClick={()=>setRole(item)} className={item===role ? styles.roleActive : ''} type="button">{item}</button>
        ))}
      </div>
      <div className={styles.personaGrid}>
        <div className={styles.personaCopy}>
          <span className={styles.kicker}>{role}</span>
          <h3>{current.title}</h3>
          <p>{current.body}</p>
          <ul>{current.metrics.map((m)=><li key={m}><SanilaIcon name="check" size={17}/>{m}</li>)}</ul>
          <Link className={styles.textLink} href={role === 'Parents' ? '/angelcare-360-parent/login' : role === 'Élèves' ? '/angelcare-360-student/login' : role === 'Enseignants' ? '/angelcare-360-teacher/login' : role === 'Personnel' ? '/angelcare-360-staff/login' : '/angelcare-360-access/login'}>Accéder à cet espace <SanilaIcon name="arrow" size={15}/></Link>
        </div>
        <ProductPreview page={page} compact />
      </div>
    </section>
  )
}

function DaySection() {
  const [active, setActive] = useState(0)
  const previewPages = ['direction','presences','admissions','direction','pedagogie','transport','rapports']
  const page = getSanilaPublicPage(previewPages[active])!
  return (
    <section className={`${styles.section} ${styles.daySection}`}>
      <div className={styles.sectionIntro}>
        <span>UNE JOURNÉE AVEC SANILA</span>
        <h2>Le système suit le rythme réel de l’établissement.</h2>
        <p>De l’ouverture à la clôture, chaque équipe retrouve un espace cohérent pour son travail.</p>
      </div>
      <div className={styles.dayGrid}>
        <div className={styles.timeline}>
          {daySteps.map((step, i)=>(
            <button type="button" key={step[0]} onClick={()=>setActive(i)} className={i===active ? styles.timelineActive : ''}>
              <time>{step[0]}</time>
              <span><strong>{step[1]}</strong><small>{step[2]}</small></span>
            </button>
          ))}
        </div>
        <ProductPreview page={page} compact />
      </div>
    </section>
  )
}

function BeforeAfter() {
  const rows = [
    ['Informations dispersées','Données centralisées'],
    ['Suivi manuel','Processus structurés'],
    ['Rapports fragmentés','Vision consolidée'],
    ['Paiements sur plusieurs fichiers','Finance centralisée'],
    ['Outils différents par équipe','Environnement partagé'],
    ['Historique difficile à retrouver','Traçabilité'],
  ]
  return (
    <section className={`${styles.section} ${styles.beforeAfter}`}>
      <div className={styles.sectionIntro}>
        <span>AVANT / AVEC SANILA</span>
        <h2>Moins de dispersion. Plus de maîtrise.</h2>
      </div>
      <div className={styles.compareGrid}>
        <div className={styles.compareTitle}>Avant SANILA</div>
        <div className={styles.compareTitleStrong}>Avec SANILA</div>
        {rows.map((row)=>(
          <div className={styles.compareRow} key={row[0]}>
            <span>{row[0]}</span><strong><SanilaIcon name="check" size={17}/>{row[1]}</strong>
          </div>
        ))}
      </div>
    </section>
  )
}

function TrustStrip() {
  return (
    <section className={styles.trustStrip}>
      {[
        ['building','Multi-établissements'],
        ['shield','Accès par rôles'],
        ['layers','Espaces isolés'],
        ['file','Traçabilité'],
        ['users','Portails dédiés'],
        ['heart','Accompagnement AngelCare'],
      ].map(([icon,label])=>(
        <div key={label}><SanilaIcon name={icon as any} size={19}/><span>{label}</span></div>
      ))}
    </section>
  )
}

function FeatureExplorer() {
  const [selected, setSelected] = useState('finance')
  const page = getSanilaPublicPage(selected)!
  return (
    <section className={`${styles.section} ${styles.explorerSection}`}>
      <div className={styles.sectionIntro}>
        <span>EXPLORER SANILA</span>
        <h2>Chaque domaine mérite une expérience pensée pour son travail.</h2>
      </div>
      <div className={styles.domainPills}>
        {PRODUCT_DOMAINS.map((domain)=>(
          <button type="button" onClick={()=>setSelected(domain.slug)} className={domain.slug===selected ? styles.domainPillActive : ''} key={domain.slug}>{domain.nav}</button>
        ))}
      </div>
      <div className={styles.explorerGrid}>
        <div>
          <span className={styles.kicker}>{page.eyebrow}</span>
          <h3>{page.title}</h3>
          <p>{page.subtitle}</p>
          <div className={styles.featureChips}>{page.features.map((feature)=><span key={feature}>{feature}</span>)}</div>
          <Link className={styles.primaryButton} href={baseHref(page.slug)}>Découvrir {page.nav.toLowerCase()} <SanilaIcon name="arrow" size={16}/></Link>
        </div>
        <ProductPreview page={page} compact />
      </div>
    </section>
  )
}

function AccessLobby() {
  return (
    <section className={`${styles.section} ${styles.accessSection}`}>
      <div className={styles.sectionIntro}>
        <span>ACCÈS CLIENT & UTILISATEURS</span>
        <h2>Choisissez votre espace SANILA.</h2>
        <p>Chaque accès conduit directement vers l’environnement authentifié correspondant au rôle de l’utilisateur.</p>
      </div>
      <div className={styles.accessGrid}>
        {CUSTOMER_ACCESS.map((entry, i)=>(
          <Link className={styles.accessCard} href={entry.href} key={entry.href}>
            <span className={styles.accessIcon}><SanilaIcon name={i===0?'building':i===1?'layers':i===2?'book':i===3?'users':i===4?'heart':'book'} size={23}/></span>
            <strong>{entry.title}</strong>
            <p>{entry.description}</p>
            <em>Accéder <SanilaIcon name="arrow" size={15}/></em>
          </Link>
        ))}
      </div>
    </section>
  )
}

function DomainEditorial({ page }: { page: SanilaPublicPage }) {
  return (
    <>
      <section className={`${styles.section} ${styles.editorialSection}`}>
        <div className={styles.editorialCopy}>
          <span className={styles.kicker}>{page.eyebrow}</span>
          <h2>{page.statement}</h2>
          <p>{page.subtitle}</p>
          <div className={styles.featureColumns}>{page.features.map((f, i)=><div key={f}><span>{String(i+1).padStart(2,'0')}</span><strong>{f}</strong></div>)}</div>
        </div>
        <ProductPreview page={page} />
      </section>
      <section className={`${styles.section} ${styles.processSection}`}>
        <div className={styles.sectionIntro}>
          <span>DU BESOIN À L’ACTION</span>
          <h2>Une expérience qui garde le contexte du début à la fin.</h2>
        </div>
        <div className={styles.processSteps}>
          {page.features.slice(0,5).map((f,i)=><div key={f}><span>{i+1}</span><strong>{f}</strong><p>{i===0?'Le contexte est identifié.':i===4?'L’historique reste disponible.':'L’équipe avance sans perdre les informations déjà saisies.'}</p></div>)}
        </div>
      </section>
    </>
  )
}

function PricingPage() {
  return (
    <section className={`${styles.section} ${styles.pricingSection}`}>
      <div className={styles.sectionIntro}><span>OFFRE ADAPTÉE</span><h2>Le bon périmètre pour votre établissement.</h2><p>Nous n’affichons pas de prix ou de package fictif. La proposition commerciale doit correspondre aux capacités réellement activées et au niveau d’accompagnement convenu.</p></div>
      <div className={styles.pricingGrid}>
        {[
          ['Votre organisation','Type d’établissement, sites, effectifs et rôles.'],
          ['Votre périmètre','Modules et capacités nécessaires à votre fonctionnement.'],
          ['Votre mise en service','Préparation, configuration, accès et accompagnement.'],
        ].map((x,i)=><div key={x[0]}><span>0{i+1}</span><SanilaIcon name={i===0?'building':i===1?'layers':'users'} size={24}/><strong>{x[0]}</strong><p>{x[1]}</p></div>)}
      </div>
      <div className={styles.centerAction}><Link className={styles.primaryButton} href={baseHref('demonstration')}>Recevoir une proposition <SanilaIcon name="arrow" size={16}/></Link></div>
    </section>
  )
}

function SecurityPage() {
  return (
    <section className={`${styles.section} ${styles.securitySection}`}>
      <div className={styles.securityCopy}>
        <span className={styles.kicker}>SÉCURITÉ & CONFIANCE</span>
        <h2>La sécurité doit être visible dans le comportement du produit.</h2>
        <p>SANILA sépare les contextes établissements, gouverne les accès par rôle et conserve une logique de traçabilité pour les opérations sensibles.</p>
        <div className={styles.securityPoints}>
          {['Accès authentifiés','Permissions par rôle','Séparation des espaces établissements','Traçabilité des opérations sensibles'].map((f)=><span key={f}><SanilaIcon name="check" size={16}/>{f}</span>)}
        </div>
      </div>
      <div className={styles.tenantDiagram}>
        <div><span>Établissement A</span><strong>Espace protégé</strong><small>Utilisateurs autorisés</small></div>
        <div className={styles.diagramCore}><SanilaIcon name="shield" size={32}/><strong>SANILA</strong><small>Gouvernance des accès</small></div>
        <div><span>Établissement B</span><strong>Espace protégé</strong><small>Utilisateurs autorisés</small></div>
      </div>
    </section>
  )
}

function ServicePage() {
  const steps = ['Découverte','Configuration','Préparation','Accès','Accompagnement des équipes','Mise en service','Support continu']
  return (
    <section className={`${styles.section} ${styles.serviceSection}`}>
      <div className={styles.sectionIntro}><span>ACCOMPAGNEMENT ANGELCARE</span><h2>De la décision à l’usage réel.</h2><p>La mise en service est traitée comme un parcours d’adoption, pas comme une simple installation technique.</p></div>
      <div className={styles.serviceFlow}>{steps.map((s,i)=><div key={s}><span>{String(i+1).padStart(2,'0')}</span><strong>{s}</strong><small>{i===0?'Comprendre votre fonctionnement':i===6?'Rester accompagné':'Préparer l’étape suivante'}</small></div>)}</div>
    </section>
  )
}

function ResourcesPage() {
  const cards = [
    ['Découvrir SANILA','Comprendre le système et ses domaines.','spark'],
    ['Sécurité','Comprendre les principes d’accès et de protection.','shield'],
    ['Mise en service','Préparer l’adoption par vos équipes.','layers'],
    ['FAQ','Réponses aux questions essentielles avant la démonstration.','message'],
  ]
  return <section className={`${styles.section} ${styles.resourcesSection}`}><div className={styles.resourceGrid}>{cards.map(([t,b,i])=><Link href={t==='Sécurité'?baseHref('securite'):t==='Mise en service'?baseHref('mise-en-service'):t==='FAQ'?baseHref('faq'):baseHref('produit')} key={t}><SanilaIcon name={i as any} size={24}/><strong>{t}</strong><p>{b}</p><em>Ouvrir <SanilaIcon name="arrow" size={15}/></em></Link>)}</div></section>
}

function FaqPage() {
  return <section className={`${styles.section} ${styles.faqSection}`}><div className={styles.faqList}>{faqs.map(([q,a])=><details key={q}><summary>{q}<span>+</span></summary><p>{a}</p></details>)}</div></section>
}

function FinalCta() {
  return (
    <section className={styles.finalCta}>
      <span>SANILA • by AngelCare</span>
      <h2>Votre établissement mérite mieux qu’une accumulation d’outils.</h2>
      <p>Découvrez comment SANILA peut réunir vos équipes, vos opérations et votre relation avec les familles dans un même environnement scolaire.</p>
      <div><Link className={styles.ctaLight} href={baseHref('demonstration')}>Demander une démonstration</Link><Link className={styles.ctaGhost} href={baseHref('connexion')}>Se connecter à SANILA</Link></div>
    </section>
  )
}

export function SanilaPublicUniverse({ slug }: { slug: string; locale: 'fr' }) {
  const page = useMemo(()=>getSanilaPublicPage(slug),[slug])
  if (!page) return null

  const isHome = page.kind === 'home'

  return (
    <div className={styles.site} data-accent={page.accent}>
      <Header />
      <main>
        <section className={`${styles.hero} ${isHome ? styles.homeHero : ''}`}>
          <div className={styles.heroGlow} />
          <div className={styles.heroInner}>
            <div className={styles.heroCopy}>
              <span className={styles.eyebrow}>{page.eyebrow}</span>
              <h1>{page.title}</h1>
              <p>{page.subtitle}</p>
              <div className={styles.heroActions}>
                <Link className={styles.primaryButton} href={baseHref('demonstration')}>Demander une démonstration <SanilaIcon name="arrow" size={16}/></Link>
                <Link className={styles.secondaryButton} href={isHome ? baseHref('produit') : baseHref('fonctionnalites')}>{isHome ? 'Découvrir SANILA' : 'Explorer les fonctionnalités'}</Link>
              </div>
              <Link className={styles.existingLink} href={baseHref('connexion')}>Déjà client ? Se connecter</Link>
            </div>
            <div className={styles.heroVisual}>
              <div className={styles.previewStackBack}><ProductPreview page={getSanilaPublicPage(isHome ? 'finance' : page.slug) || page} compact /></div>
              <div className={styles.previewStackFront}><ProductPreview page={page} /></div>
            </div>
          </div>
        </section>

        <TrustStrip />

        {isHome ? (
          <>
            <section className={`${styles.section} ${styles.fragmentSection}`}>
              <div className={styles.sectionIntro}><span>POURQUOI SANILA</span><h2>{page.statement}</h2><p>Quand les informations vivent dans des fichiers, messages et outils séparés, l’école perd du temps à reconstruire son propre contexte.</p></div>
              <div className={styles.fragmentGrid}>
                <div className={styles.fragmentCloud}>{['Admissions','Fichiers','Présences','Messages','Paiements','Documents','Transport','Rapports'].map((x,i)=><span key={x} data-offset={i}>{x}</span>)}</div>
                <div className={styles.fragmentArrow}><SanilaIcon name="arrow" size={28}/></div>
                <div className={styles.fragmentTarget}><span>S</span><strong>SANILA</strong><small>Un établissement • une réalité partagée</small></div>
              </div>
            </section>
            <SystemMap />
            <PersonaSection />
            <DaySection />
            <FeatureExplorer />
            <BeforeAfter />
            <SecurityPage />
            <ServicePage />
            <AccessLobby />
          </>
        ) : null}

        {page.kind === 'domain' ? <DomainEditorial page={page} /> : null}
        {page.kind === 'product' || page.kind === 'features' ? <><SystemMap/><PersonaSection/><FeatureExplorer/><BeforeAfter/></> : null}
        {page.kind === 'solutions' ? <><section className={`${styles.section} ${styles.solutionCards}`}>{['solutions/creches-maternelles','solutions/ecoles-privees','solutions/groupes-scolaires'].map((s)=><Link href={baseHref(s)} key={s}><span>{getSanilaPublicPage(s)?.eyebrow}</span><strong>{getSanilaPublicPage(s)?.title}</strong><p>{getSanilaPublicPage(s)?.subtitle}</p><em>Découvrir <SanilaIcon name="arrow" size={15}/></em></Link>)}</section><PersonaSection/></> : null}
        {page.kind === 'solution' ? <><DomainEditorial page={page}/><BeforeAfter/><ServicePage/></> : null}
        {page.kind === 'trust' ? <SecurityPage/> : null}
        {page.kind === 'service' ? <ServicePage/> : null}
        {page.kind === 'pricing' ? <PricingPage/> : null}
        {page.kind === 'resources' ? <ResourcesPage/> : null}
        {page.kind === 'faq' ? <FaqPage/> : null}
        {page.kind === 'demo' ? <section className={`${styles.section} ${styles.demoSection}`}><div className={styles.demoIntro}><span className={styles.kicker}>PARLONS DE VOTRE ÉTABLISSEMENT</span><h2>Une démonstration centrée sur vos priorités réelles.</h2><p>Le formulaire utilise l’autorité publique existante du Marketplace AngelCare. Aucun environnement client n’est créé automatiquement.</p></div><SanilaDemoForm/></section> : null}
        {page.kind === 'access' ? <AccessLobby/> : null}

        {!isHome && page.kind !== 'access' ? <FinalCta/> : null}
      </main>
      <Footer />
    </div>
  )
}
