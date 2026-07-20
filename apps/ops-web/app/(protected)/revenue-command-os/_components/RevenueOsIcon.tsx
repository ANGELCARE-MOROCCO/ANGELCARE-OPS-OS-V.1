'use client'

import {
  Activity,
  BadgeCheck,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  Circle,
  Command,
  Database,
  FileWarning,
  Layers3,
  ListChecks,
  LockKeyhole,
  RadioTower,
  ScrollText,
  Search,
  Settings2,
  ShieldAlert,
  Sparkles,
  Target,
  Workflow,
  XCircle,
  type LucideProps,
} from 'lucide-react'

const ICONS = {
  Activity,
  BadgeCheck,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  Circle,
  Command,
  Database,
  FileWarning,
  Layers3,
  ListChecks,
  LockKeyhole,
  RadioTower,
  ScrollText,
  Search,
  Settings2,
  ShieldAlert,
  Sparkles,
  Target,
  Workflow,
  XCircle,
} as const

export type RevenueOsIconName = keyof typeof ICONS

export default function RevenueOsIcon({ name, ...props }: { name: string } & LucideProps) {
  const Icon = ICONS[name as RevenueOsIconName] || Circle
  return <Icon aria-hidden="true" {...props} />
}
