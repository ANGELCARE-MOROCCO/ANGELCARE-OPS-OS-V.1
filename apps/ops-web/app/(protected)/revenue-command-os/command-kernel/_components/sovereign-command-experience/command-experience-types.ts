import type { Dispatch, SetStateAction } from 'react'
import type {
  RevenueCommandDefinition,
  RevenueCommandGraph,
  RevenueCommandKernelBootstrap,
  RevenueCommandRun,
  RevenueCommandSchedule,
  RevenueCommandTrigger,
  RevenueCommandVersion,
} from '@/lib/revenue-command-os/command-kernel/types'

export type CommandSelect = Dispatch<SetStateAction<RevenueCommandDefinition | null>>

export type CommandRouteContext = {
  data: RevenueCommandKernelBootstrap | null
  commands: RevenueCommandDefinition[]
  loading: boolean
  error: string | null
  warnings: string[]
  refresh: () => Promise<void>
  selectCommand: CommandSelect
}

export type CommandSimulationContext = CommandRouteContext & {
  result: unknown
  busy: boolean
  runSimulation: () => Promise<void>
}

export type CommandCollectionProps = {
  commands: RevenueCommandDefinition[]
  selectCommand: CommandSelect
}

export type TriggerProps = { triggers: RevenueCommandTrigger[]; commands: RevenueCommandDefinition[]; selectCommand: CommandSelect }
export type ScheduleProps = { schedules: RevenueCommandSchedule[]; commands: RevenueCommandDefinition[]; selectCommand: CommandSelect }
export type GraphProps = { graphs: RevenueCommandGraph[]; commands: RevenueCommandDefinition[]; selectCommand: CommandSelect }
export type RunProps = { runs: RevenueCommandRun[]; commands: RevenueCommandDefinition[]; selectCommand: CommandSelect }
export type VersionProps = { versions: RevenueCommandVersion[]; commands: RevenueCommandDefinition[]; selectCommand: CommandSelect }
