import Link from 'next/link'
import {
  ArrowUpRight,
  BadgeDollarSign,
  CalendarCheck,
  ChartNoAxesCombined,
  FileText,
  Gauge,
  LayoutTemplate,
  Megaphone,
  PackagePlus,
  ReceiptText,
  School,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  UsersRound,
  WalletCards,
  Waypoints,
} from 'lucide-react'
import type { EnterpriseControlSnapshot } from '../../enterprise-closure/types'
import styles from './operator-excellence-pro-max.module.css'

type FrontendSnapshot = {
  metrics: {
    surfaces: number
    published: number
    products: number
    categories: number
    pages: number
    openInquiries: number
  }
}

type IconType = typeof Gauge

const quickActions: Array<{ href: string; title: string; copy: string; icon: IconType; tone: string }> = [
  { href: '/angelcare-marketplace/admin/orders/new', title: 'Nouvelle commande', copy: 'Créer et lancer une commande assistée.', icon: ShoppingBag, tone: 'blue' },
  { href: '/angelcare-marketplace/admin/customers/new', title: 'Nouveau client', copy: 'Créer le dossier client et sa famille.', icon: UsersRound, tone: 'teal' },
  { href: '/angelcare-marketplace/admin/catalog/items/new', title: 'Créer une offre', copy: 'Produit, service, formation, kit ou SaaS.', icon: PackagePlus, tone: 'violet' },
  { href: '/angelcare-marketplace/admin/bookings', title: 'Planifier un service', copy: 'Qualifier, programmer et exécuter.', icon: CalendarCheck, tone: 'amber' },
  { href: '/angelcare-marketplace/admin/sanila', title: 'SANILA Command', copy: 'Démos, prospects et Public World.', icon: School, tone: 'rose' },
  { href: '/angelcare-marketplace/admin/public-experience-authority', title: 'Public Experience', copy: 'Worlds, assignations et publication.', icon: Sparkles, tone: 'navy' },
]

function Metric({ label, value, hint, icon: Icon, tone = 'navy' }: { label: string; value: string | number; hint: string; icon: IconType; tone?: string }) {
  return (
    <article className={styles.metric} data-tone={tone}>
      <span className={styles.metricIcon}><Icon size={17} /></span>
      <div><small>{label}</small><strong>{value}</strong><p>{hint}</p></div>
    </article>
  )
}

function Lane({ href, title, copy, meta, icon: Icon, tone }: { href: string; title: string; copy: string; meta: string; icon: IconType; tone: string }) {
  return (
    <Link href={href} className={styles.lane} data-tone={tone}>
      <span className={styles.laneIcon}><Icon size={19} /></span>
      <span className={styles.laneCopy}><small>{meta}</small><strong>{title}</strong><p>{copy}</p></span>
      <ArrowUpRight size={15} />
    </Link>
  )
}

export function OperatorExcellenceCockpit({ commerce, frontend, workspaceCount }: { commerce: EnterpriseControlSnapshot; frontend: FrontendSnapshot; workspaceCount: number }) {
  const openOrders = commerce.orders.filter((order) => !['completed', 'cancelled'].includes(order.status)).length
  const openInvoices = commerce.invoices.filter((invoice) => !['paid', 'cancelled', 'credited'].includes(invoice.status)).length
  const activeBookings = commerce.bookings.filter((booking) => !['completed', 'cancelled'].includes(booking.status)).length
  const scheduledBookings = commerce.bookings.filter((booking) => booking.status === 'scheduled').length
  const activeSubscriptions = commerce.subscriptions.filter((subscription) => subscription.status === 'active').length
  const activePromotions = commerce.promotions.filter((promotion) => promotion.status === 'active').length
  const frontendHealthy = frontend.metrics.surfaces > 0 && frontend.metrics.published === frontend.metrics.surfaces

  return (
    <div className={styles.root}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.eyebrow}><span /> ANGELCARE MARKETPLACE · OPERATOR COMMAND</span>
          <h1>Le centre de commande du business.</h1>
          <p>Décider, opérer et ouvrir le bon workspace sans perdre le contexte commercial.</p>
          <div className={styles.heroActions}>
            <Link href="/angelcare-marketplace/admin/orders" className={styles.primaryAction}><ShoppingBag size={15} />Opérer les commandes</Link>
            <Link href="/angelcare-marketplace/admin/workspaces" className={styles.secondaryAction}>Tous les workspaces <ArrowUpRight size={14} /></Link>
          </div>
        </div>
        <div className={styles.heroPulse}>
          <div className={styles.pulseHeader}><span>État opératoire</span><strong>{frontendHealthy ? 'Système public aligné' : 'Contrôle requis'}</strong></div>
          <div className={styles.pulseGrid}>
            <div><small>Commandes</small><strong>{openOrders}</strong><span>ouvertes</span></div>
            <div><small>Bookings</small><strong>{activeBookings}</strong><span>actifs</span></div>
            <div><small>Inquiries</small><strong>{frontend.metrics.openInquiries}</strong><span>ouvertes</span></div>
            <div><small>Surfaces</small><strong>{frontend.metrics.published}/{frontend.metrics.surfaces}</strong><span>publiées</span></div>
          </div>
        </div>
      </section>

      <section className={styles.metricGrid} aria-label="Indicateurs commerciaux">
        <Metric label="Clients" value={commerce.customers.length} hint="dossiers opérables" icon={UsersRound} tone="blue" />
        <Metric label="Commandes ouvertes" value={openOrders} hint={`${commerce.orders.length} total`} icon={ShoppingBag} tone="navy" />
        <Metric label="Bookings actifs" value={activeBookings} hint={`${scheduledBookings} programmés`} icon={CalendarCheck} tone="teal" />
        <Metric label="Factures ouvertes" value={openInvoices} hint={`${commerce.invoices.length} total`} icon={FileText} tone="amber" />
      </section>

      <section className={styles.section}>
        <header className={styles.sectionHeader}><div><span>Exécution immédiate</span><h2>Actions opérateur</h2></div><p>Les chemins de travail les plus fréquents, sans détour.</p></header>
        <div className={styles.quickGrid}>
          {quickActions.map(({ href, title, copy, icon: Icon, tone }) => (
            <Link key={href} href={href} className={styles.quickCard} data-tone={tone}>
              <span className={styles.quickIcon}><Icon size={18} /></span>
              <span><strong>{title}</strong><small>{copy}</small></span>
              <ArrowUpRight size={14} />
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <header className={styles.sectionHeader}><div><span>Command lanes</span><h2>Univers opérationnels</h2></div><p>Chaque univers ouvre une autorité réelle du Marketplace.</p></header>
        <div className={styles.laneGrid}>
          <Lane href="/angelcare-marketplace/admin/customers" title="Clients & familles" copy="Dossiers clients, familles, support, activity et valeur." meta={`${commerce.customers.length} clients`} icon={UsersRound} tone="blue" />
          <Lane href="/angelcare-marketplace/admin/orders" title="Commerce & fulfillment" copy="Commandes, bookings, paiements, factures et exécution." meta={`${openOrders} commandes à suivre`} icon={ShoppingBag} tone="navy" />
          <Lane href="/angelcare-marketplace/admin/frontend-experiences" title="Expérience publique" copy="Surfaces, catalogue, recherche, publication et conversion." meta={`${frontend.metrics.products} offres · ${frontend.metrics.pages} pages`} icon={LayoutTemplate} tone="violet" />
          <Lane href="/angelcare-marketplace/admin/sanila" title="SANILA" copy="Demandes de démo, grants, prospects, Studio et Public World." meta="Workspace souverain" icon={School} tone="rose" />
        </div>
      </section>

      <section className={styles.controlGrid}>
        <article className={styles.controlPanel}>
          <header><span><BadgeDollarSign size={16} /> Commerce vivant</span><Link href="/angelcare-marketplace/admin/finance">Finance <ArrowUpRight size={13} /></Link></header>
          <div className={styles.controlRows}>
            <div><span><ReceiptText size={14} /> Abonnements actifs</span><strong>{activeSubscriptions}</strong></div>
            <div><span><Megaphone size={14} /> Promotions actives</span><strong>{activePromotions}</strong></div>
            <div><span><WalletCards size={14} /> Reçus émis</span><strong>{commerce.receipts.length}</strong></div>
            <div><span><FileText size={14} /> Factures ouvertes</span><strong>{openInvoices}</strong></div>
          </div>
        </article>

        <article className={styles.controlPanel}>
          <header><span><ShieldCheck size={16} /> Produit & contrôle</span><Link href="/angelcare-marketplace/admin/analytics">Analytics <ArrowUpRight size={13} /></Link></header>
          <div className={styles.controlRows}>
            <div><span><PackagePlus size={14} /> Offres</span><strong>{frontend.metrics.products}</strong></div>
            <div><span><LayoutTemplate size={14} /> Surfaces publiées</span><strong>{frontend.metrics.published}/{frontend.metrics.surfaces}</strong></div>
            <div><span><Search size={14} /> Demandes publiques</span><strong>{frontend.metrics.openInquiries}</strong></div>
            <div><span><ChartNoAxesCombined size={14} /> Workspaces enregistrés</span><strong>{workspaceCount}</strong></div>
          </div>
        </article>
      </section>
    </div>
  )
}
