'use client'

import type { ReactNode } from 'react'
import type { RevenueSignalSectionKey } from '@/lib/revenue-command-os/types'
import SignalDrawer from './SignalDrawer'
import {
  ClassificationExperience,
  ContextSnapshotsExperience,
  DataAccessExperience,
  DeduplicationExperience,
  LiveStreamExperience,
  ScheduledScansExperience,
  SignalOverviewExperience,
  SignalValidationExperience,
  SourceControlExperience,
  SourceHealthExperience,
  StaleDataExperience,
  SubscriptionsExperience,
} from './sovereign-signal-experience/routes'

export default function SignalFabricWorkspace({ sectionKey }: { sectionKey: RevenueSignalSectionKey }) {
  let content: ReactNode
  if (sectionKey === 'overview') content = <SignalOverviewExperience />
  else if (sectionKey === 'live-stream') content = <LiveStreamExperience />
  else if (sectionKey === 'source-control') content = <SourceControlExperience />
  else if (sectionKey === 'source-health') content = <SourceHealthExperience />
  else if (sectionKey === 'classification') content = <ClassificationExperience />
  else if (sectionKey === 'deduplication') content = <DeduplicationExperience />
  else if (sectionKey === 'scheduled-scans') content = <ScheduledScansExperience />
  else if (sectionKey === 'context-snapshots') content = <ContextSnapshotsExperience />
  else if (sectionKey === 'stale-data') content = <StaleDataExperience />
  else if (sectionKey === 'subscriptions') content = <SubscriptionsExperience />
  else if (sectionKey === 'data-access') content = <DataAccessExperience />
  else content = <SignalValidationExperience />

  return <>{content}<SignalDrawer /></>
}
