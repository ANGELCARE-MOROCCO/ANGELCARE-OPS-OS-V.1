'use client'

import { useState } from 'react'
import type { RevenueCommandDefinition } from '@/lib/revenue-command-os/command-kernel/types'
import { useCommandKernel } from './CommandKernelContext'
import CommandDossier from './sovereign-command-experience/CommandDossier'
import {
  CommandCatalogueExperience,
  CommandGraphsExperience,
  CommandGuardrailsExperience,
  CommandOverviewExperience,
  CommandRoutingExperience,
  CommandRunsExperience,
  CommandSchedulesExperience,
  CommandSimulationExperience,
  CommandTaxonomyExperience,
  CommandTriggersExperience,
  CommandValidationExperience,
  CommandVersionsExperience,
} from './sovereign-command-experience/routes'

export default function CommandKernelWorkspace({ section = 'overview' }: { section?: string }) {
  const { data, loading, error, warnings, refresh, simulate } = useCommandKernel()
  const [selected, setSelected] = useState<RevenueCommandDefinition | null>(null)
  const [result, setResult] = useState<unknown>(null)
  const [busy, setBusy] = useState(false)
  const commands = data?.commands || []

  async function runSimulation() {
    setBusy(true)
    try {
      setResult(await simulate())
    } finally {
      setBusy(false)
    }
  }

  const context = { data, commands, loading, error, warnings, refresh, selectCommand: setSelected }

  const view = section === 'catalogue' ? <CommandCatalogueExperience {...context} />
    : section === 'taxonomy' ? <CommandTaxonomyExperience {...context} />
      : section === 'routing' ? <CommandRoutingExperience {...context} />
        : section === 'triggers' ? <CommandTriggersExperience {...context} />
          : section === 'schedules' ? <CommandSchedulesExperience {...context} />
            : section === 'graphs' ? <CommandGraphsExperience {...context} />
              : section === 'simulation' ? <CommandSimulationExperience {...context} result={result} busy={busy} runSimulation={runSimulation} />
                : section === 'runs' ? <CommandRunsExperience {...context} />
                  : section === 'versions' ? <CommandVersionsExperience {...context} />
                    : section === 'guardrails' ? <CommandGuardrailsExperience {...context} />
                      : section === 'validation' ? <CommandValidationExperience {...context} />
                        : <CommandOverviewExperience {...context} />

  return <>{view}{selected ? <CommandDossier command={selected} close={() => setSelected(null)} /> : null}</>
}
