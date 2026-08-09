import {
  ArrowRight,
  Boxes,
  Languages,
  LockKeyhole,
  Network,
  PanelsTopLeft,
  ShieldCheck,
} from 'lucide-react'
import styles from '../../design-system/marketplace.module.css'
import { ButtonLink, StatusChip } from '../../design-system/ui'

const foundations = [
  ['Architecture isolée', 'Le produit vit dans son propre domaine sans déplacer les systèmes OPS existants.'],
  ['Accès gouverné', 'Chaque lecture et mutation protégée dépend d’un rôle, d’une permission et d’un périmètre.'],
  ['Preuve durable', 'Modules, configurations, contrôles et actions sensibles sont persistants et auditables.'],
  ['Expansion préparée', 'Territoire, tenant, langue et futurs Mega ZIPs disposent de contrats de montage stables.'],
]

const principles = [
  {
    icon: PanelsTopLeft,
    title: 'Expériences adaptées',
    text: 'Une même constitution visuelle, mais des traitements distincts pour familles, partenaires, fournisseurs, prestataires et administration.',
  },
  {
    icon: ShieldCheck,
    title: 'Contrôle avant activation',
    text: 'Aucun module, feature flag ou changement sensible ne devient actif sans autorité, validation et preuve d’audit.',
  },
  {
    icon: Network,
    title: 'Un socle qui ne sera pas reconstruit',
    text: 'Les Mega ZIPs 02 à 20 se montent dans le registre sans casser la navigation, les permissions ou les conventions API.',
  },
  {
    icon: Languages,
    title: 'FR, EN et AR dès la fondation',
    text: 'Le produit prévoit le texte long, les formats localisés et le sens RTL sans traiter l’arabe comme un simple remplacement de chaîne.',
  },
  {
    icon: Boxes,
    title: 'Modules réels, pas de faux catalogue',
    text: 'Seul le socle livré est actif. Les domaines futurs restent identifiés comme non installés jusqu’à leur Mega ZIP contractuel.',
  },
  {
    icon: LockKeyhole,
    title: 'Séparation des responsabilités',
    text: 'Le visiteur, le parent, le tenant, le prestataire, le fournisseur, le manager et l’exécutif ne voient ni ne contrôlent les mêmes choses.',
  },
]

export function PublicHome() {
  return (
    <>
      <section className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>
            <span className={styles.eyebrowDot} />
            ANGELCARE Build 360 · Mega ZIP 01
          </span>
          <h1 className={styles.heroTitle}>
            Le socle gouverné du <em>Kids 360 Marketplace.</em>
          </h1>
          <p className={styles.heroLead}>
            Une architecture premium, permissionnée, auditable et prête à accueillir chaque univers
            ANGELCARE sans reconstruire la plateforme ni fragiliser les opérations existantes.
          </p>
          <div className={styles.heroActions}>
            <ButtonLink href="/angelcare-marketplace/workspace">
              Ouvrir l’espace sécurisé <ArrowRight size={15} />
            </ButtonLink>
            <ButtonLink href="/angelcare-marketplace/admin/readiness" variant="secondary">
              Examiner la préparation
            </ButtonLink>
          </div>
        </div>
        <aside className={styles.heroPanel} aria-label="Constitution Mega ZIP 01">
          <header className={styles.heroPanelHeader}>
            <span>Constitution active</span>
            <h2>Fondation technique et opérationnelle</h2>
          </header>
          <ol className={styles.foundationList}>
            {foundations.map(([title, text], index) => (
              <li key={title} className={styles.foundationItem}>
                <span className={styles.foundationIndex}>{String(index + 1).padStart(2, '0')}</span>
                <span>
                  <strong>{title}</strong>
                  <small>{text}</small>
                </span>
                <StatusChip status={index === 0 ? 'enabled' : 'registered'} />
              </li>
            ))}
          </ol>
        </aside>
      </section>

      <section className={styles.section} id="constitution">
        <header className={styles.sectionHeader}>
          <span className={styles.eyebrow}>Loi produit</span>
          <h2>Une fondation commune, sans appauvrir les parcours.</h2>
          <p>
            Le design system unifie la qualité et les états. Il ne transforme pas les futurs
            parcours en pages génériques. Chaque Mega ZIP conservera sa logique, son ton, ses
            décisions et ses preuves.
          </p>
        </header>
        <div className={styles.principleGrid}>
          {principles.map(({ icon: Icon, title, text }) => (
            <article key={title} className={styles.principleCard}>
              <span className={styles.principleIcon}><Icon size={20} /></span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.section} id="readiness">
        <div className={styles.notice}>
          <ShieldCheck size={19} />
          <div>
            <strong>Pas de promesse artificielle.</strong><br />
            Le catalogue, les transactions, le SaaS tenant, l’Academy, les opérations et la
            confiance avancée restent désactivés jusqu’à leurs contrats Mega ZIP respectifs.
          </div>
        </div>
      </section>
    </>
  )
}
