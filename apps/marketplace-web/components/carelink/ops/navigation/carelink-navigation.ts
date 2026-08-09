import {
  Activity,
  BellRing,
  BookOpenCheck,
  Boxes,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Command,
  CreditCard,
  FileBarChart,
  Gauge,
  HeartHandshake,
  LayoutDashboard,
  LifeBuoy,
  MessageSquareText,
  RadioTower,
  RefreshCcw,
  Route,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
  UserRoundCheck,
  Workflow,
  Wrench,
  type LucideIcon,
} from 'lucide-react'

export type CareLinkNavItem = {
  label: string
  shortLabel?: string
  href: string
  description: string
  icon: LucideIcon
  exact?: boolean
  accent?: 'blue' | 'emerald' | 'amber' | 'violet' | 'rose' | 'cyan'
  children?: CareLinkNavItem[]
}

export type CareLinkNavGroup = {
  key: string
  label: string
  icon: LucideIcon
  items: CareLinkNavItem[]
}

export const SERVICE_DESIGN_NAV: CareLinkNavItem = {
  label: 'Service Design OS',
  shortLabel: 'Design',
  href: '/carelink-ops/service-design',
  description: 'Concevoir une mission, un programme ou une offre depuis le catalogue local.',
  icon: Sparkles,
  accent: 'violet',
  children: [
    { label: 'Créer', href: '/carelink-ops/service-design', description: 'Choisir une catégorie puis composer.', icon: Sparkles, exact: true, accent: 'violet' },
    { label: 'Mission unique', href: '/carelink-ops/service-design/planning/new', description: 'Créer une mission datée.', icon: ClipboardList, accent: 'blue' },
    { label: 'Programme multi-missions', href: '/carelink-ops/service-design/factory?mode=multi_mission', description: 'Composer plusieurs journées.', icon: CalendarDays, accent: 'cyan' },
    { label: 'Package commercial', href: '/carelink-ops/service-design/offers/new', description: 'Composer un produit B2C ou B2B.', icon: Boxes, accent: 'emerald' },
    { label: 'Catégories', href: '/carelink-ops/service-design/catalogue/categories', description: 'Catalogue et dossiers catégories.', icon: BookOpenCheck },
    { label: 'Doctrine & imports', href: '/carelink-ops/service-design/standards/doctrine', description: 'Règles et imports ciblés.', icon: ShieldCheck },
    { label: 'Activités', href: '/carelink-ops/service-design/standards/activities', description: 'Bibliothèque opérationnelle locale.', icon: Activity },
    { label: 'Capacité', href: '/carelink-ops/service-design/standards/capacity', description: 'Fenêtres et capacités de service.', icon: Gauge },
    { label: 'Plans & packages', href: '/carelink-ops/service-design/planning', description: 'Résultats et décisions.', icon: Workflow },
    { label: 'Vitrine B2C', href: '/carelink-ops/service-design/vitrine', description: 'Références familles.', icon: HeartHandshake },
    { label: 'Vitrine B2B', href: '/carelink-ops/service-design/vitrine/b2b', description: 'Références institutions.', icon: Boxes },
    { label: 'CARELINK handoff', href: '/carelink-ops/service-design/handoffs', description: 'Préparer le dossier d’exécution.', icon: Route },
    { label: 'Opérations avancées', href: '/carelink-ops/service-design/advanced', description: 'Qualité, performance et gouvernance.', icon: Wrench },
  ],
}

export const CARELINK_NAV_GROUPS: CareLinkNavGroup[] = [
  {
    key: 'command',
    label: 'Commandement',
    icon: Command,
    items: [
      { label: 'Vue réseau', shortLabel: 'Vue', href: '/carelink-ops', description: 'Posture opérationnelle CARELINK.', icon: LayoutDashboard, exact: true, accent: 'blue' },
      { label: 'Dispatch', href: '/carelink-ops/dispatch', description: 'Affectation et orchestration live.', icon: RadioTower, accent: 'cyan' },
      { label: 'Missions', href: '/carelink-ops/missions', description: 'Dossiers et sous-missions.', icon: ClipboardList, accent: 'blue' },
      SERVICE_DESIGN_NAV,
    ],
  },
  {
    key: 'operations',
    label: 'Opérations',
    icon: Workflow,
    items: [
      { label: 'Agents', href: '/carelink-ops/agents', description: 'Caregivers et disponibilité.', icon: UserRoundCheck },
      { label: 'Planning', href: '/carelink-ops/schedule', description: 'Agenda et charge terrain.', icon: CalendarDays },
      { label: 'Calendrier', href: '/carelink-ops/calendar', description: 'Vue calendrier consolidée.', icon: CalendarDays },
      { label: 'Incidents', href: '/carelink-ops/incidents', description: 'Escalade et résolution.', icon: LifeBuoy, accent: 'rose' },
      { label: 'Remplacements', href: '/carelink-ops/replacements', description: 'Continuité et candidats.', icon: RefreshCcw, accent: 'amber' },
    ],
  },
  {
    key: 'assurance',
    label: 'Assurance',
    icon: ShieldCheck,
    items: [
      { label: 'Rapports', href: '/carelink-ops/reports', description: 'Rapports mission et validation.', icon: FileBarChart },
      { label: 'Conformité', href: '/carelink-ops/compliance', description: 'Documents et contrôle.', icon: ShieldCheck },
      { label: 'Qualité', href: '/carelink-ops/quality', description: 'Qualité terrain et signaux.', icon: CheckCircle2, accent: 'emerald' },
      { label: 'Readiness', href: '/carelink-ops/readiness', description: 'Préparation opérationnelle.', icon: Gauge },
      { label: 'Performance', href: '/carelink-ops/performance', description: 'Indicateurs et capacité.', icon: FileBarChart },
    ],
  },
  {
    key: 'people-finance',
    label: 'People & Finance',
    icon: Users,
    items: [
      { label: 'Workforce', href: '/carelink-ops/workforce', description: 'Capacité et compétences.', icon: Users },
      { label: 'Paiements', href: '/carelink-ops/payments', description: 'Honoraires et litiges.', icon: CreditCard },
    ],
  },
  {
    key: 'communications',
    label: 'Communications',
    icon: MessageSquareText,
    items: [
      { label: 'Notifications', href: '/carelink-ops/notifications', description: 'Alertes persistantes.', icon: BellRing },
      { label: 'Messages', href: '/carelink-ops/messages', description: 'Threads dispatch.', icon: MessageSquareText },
    ],
  },
  {
    key: 'control',
    label: 'Contrôle',
    icon: Settings,
    items: [
      { label: 'Audit', href: '/carelink-ops/audit', description: 'Traçabilité des actions.', icon: ClipboardList },
      { label: 'Configuration services', href: '/carelink-ops/service-config', description: 'Référentiels CARELINK.', icon: Wrench },
      { label: 'Paramètres', href: '/carelink-ops/settings', description: 'Préférences et système.', icon: Settings },
    ],
  },
]

export const CARELINK_ALL_NAV_ITEMS = CARELINK_NAV_GROUPS.flatMap((group) =>
  group.items.flatMap((item) => [item, ...(item.children || [])]),
)

export function careLinkItemIsActive(pathname: string, item: CareLinkNavItem) {
  const cleanHref = item.href.split('?')[0]
  if (item.exact) return pathname === cleanHref
  if (cleanHref === '/carelink-ops') return pathname === cleanHref
  return pathname === cleanHref || pathname.startsWith(`${cleanHref}/`)
}

export function activeCareLinkItem(pathname: string) {
  const exact = CARELINK_ALL_NAV_ITEMS.find((item) => item.href.split('?')[0] === pathname)
  if (exact) return exact
  return [...CARELINK_ALL_NAV_ITEMS]
    .sort((a, b) => b.href.length - a.href.length)
    .find((item) => careLinkItemIsActive(pathname, item)) || CARELINK_NAV_GROUPS[0].items[0]
}
