import type { LucideIcon } from 'lucide-react'
import {
  Activity,
  AlertTriangle,
  Archive,
  BadgeDollarSign,
  Banknote,
  BellRing,
  Blocks,
  BookOpenCheck,
  Boxes,
  BriefcaseBusiness,
  Building2,
  ChartNoAxesCombined,
  CheckCircle2,
  CircleDollarSign,
  ClipboardCheck,
  Clock3,
  Cog,
  Command,
  CreditCard,
  FileCheck2,
  FileClock,
  FileText,
  Fingerprint,
  Flag,
  Gauge,
  HandCoins,
  Headphones,
  HeartPulse,
  History,
  KeyRound,
  LayoutDashboard,
  LifeBuoy,
  ListChecks,
  LockKeyhole,
  MessageSquareText,
  Network,
  NotebookPen,
  PackageCheck,
  PackageOpen,
  PanelsTopLeft,
  ReceiptText,
  RefreshCcw,
  Rocket,
  Route,
  Scale,
  Search,
  ServerCog,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Tags,
  TicketCheck,
  TimerReset,
  TriangleAlert,
  UserCog,
  UsersRound,
  WalletCards,
  Waypoints,
  Workflow,
  Wrench,
  Presentation,
  Landmark,
  Telescope,
  Gavel,
  UserRoundCheck,
} from 'lucide-react'
import type { Angelcare360OperatorDistrict } from './Angelcare360OperatorExperience'

const iconByKey: Record<string, LucideIcon> = {
  direction: Landmark,
  growth: ChartNoAxesCombined,
  revenue: CircleDollarSign,
  platform: ShieldCheck,
  executive: Command,
  board: Presentation,
  'executive-revenue': Landmark,
  'executive-customers': ChartNoAxesCombined,
  'executive-service': Activity,
  'executive-decisions': Gavel,
  'executive-horizon': Telescope,
  'executive-accountability': UserRoundCheck,
  overview: LayoutDashboard,
  health: HeartPulse,
  service: Activity,
  audit: Fingerprint,
  clients: Building2,
  tenants: Network,
  access: KeyRound,
  plans: Tags,
  packages: PackageOpen,
  subscriptions: RefreshCcw,
  modules: Blocks,
  features: SlidersHorizontal,
  usage: Gauge,
  billing: BadgeDollarSign,
  'billing-accounts': WalletCards,
  invoices: ReceiptText,
  payments: HandCoins,
  balances: CircleDollarSign,
  dunning: BellRing,
  onboarding: Rocket,
  implementation: Workflow,
  support: Headphones,
  contracts: FileCheck2,
  renewals: TimerReset,
  'health-panel': HeartPulse,
  'service-ops': Waypoints,
  requests: TicketCheck,
  incidents: TriangleAlert,
  tasks: ListChecks,
  notes: NotebookPen,
  settings: Settings2,
  roles: UserCog,
}

const iconByDistrict: Record<Angelcare360OperatorDistrict, LucideIcon> = {
  command: Command,
  portfolio: UsersRound,
  infrastructure: ServerCog,
  commercial: PackageCheck,
  finance: Banknote,
  activation: Rocket,
  support: LifeBuoy,
  incident: AlertTriangle,
  retention: FileClock,
  health: HeartPulse,
  governance: ShieldCheck,
}

export function OperatorNavigationIcon({ itemKey, size = 17 }: { itemKey: string; size?: number }) {
  const Icon = iconByKey[itemKey] || PanelsTopLeft
  return <Icon size={size} strokeWidth={2} aria-hidden="true" />
}

export function OperatorDistrictIcon({ district, size = 26 }: { district: Angelcare360OperatorDistrict; size?: number }) {
  const Icon = iconByDistrict[district] || Command
  return <Icon size={size} strokeWidth={1.8} aria-hidden="true" />
}

export const OperatorSearchIcon = Search
export const OperatorCommandIcon = Command
export const OperatorEvidenceIcon = BookOpenCheck
export const OperatorDecisionIcon = Scale
export const OperatorMissionIcon = Flag
export const OperatorSuccessIcon = CheckCircle2
export const OperatorLockedIcon = LockKeyhole
export const OperatorArchiveIcon = Archive
export const OperatorQuickIcon = Sparkles
export const OperatorRouteIcon = Route
export const OperatorWorkIcon = BriefcaseBusiness
export const OperatorToolIcon = Wrench
export const OperatorClockIcon = Clock3
export const OperatorFileIcon = FileText
export const OperatorCreditCardIcon = CreditCard
export const OperatorCogIcon = Cog
