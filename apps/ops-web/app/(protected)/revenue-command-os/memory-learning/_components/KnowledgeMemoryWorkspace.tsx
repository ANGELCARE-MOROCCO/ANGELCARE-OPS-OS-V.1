'use client'

import { useState, type ReactNode } from 'react'
import type { RevenueDoctrine, RevenueKnowledgeSectionKey } from '@/lib/revenue-command-os/types'
import DoctrineDrawer from './DoctrineDrawer'
import {
  ApprovalDeskExperience,
  CasesPatternsExperience,
  ConflictResolverExperience,
  DoctrineLibraryExperience,
  IndexingReadinessExperience,
  KnowledgeAssetsExperience,
  MemoryOverviewExperience,
  MemoryValidationExperience,
  PlaybooksSopsExperience,
  RulesRestrictionsExperience,
  ScriptsObjectionsExperience,
  VersionsProvenanceExperience,
} from './sovereign-memory-experience/routes'

export default function KnowledgeMemoryWorkspace({ sectionKey }: { sectionKey: RevenueKnowledgeSectionKey }) {
  const [selected, setSelected] = useState<RevenueDoctrine | null>(null)
  let content: ReactNode
  if (sectionKey === 'overview') content = <MemoryOverviewExperience onOpenDoctrine={setSelected} />
  else if (sectionKey === 'doctrine-library') content = <DoctrineLibraryExperience onOpenDoctrine={setSelected} />
  else if (sectionKey === 'knowledge-assets') content = <KnowledgeAssetsExperience />
  else if (sectionKey === 'rules-restrictions') content = <RulesRestrictionsExperience />
  else if (sectionKey === 'scripts-objections') content = <ScriptsObjectionsExperience />
  else if (sectionKey === 'cases-patterns') content = <CasesPatternsExperience />
  else if (sectionKey === 'playbooks-sops') content = <PlaybooksSopsExperience />
  else if (sectionKey === 'approval-desk') content = <ApprovalDeskExperience />
  else if (sectionKey === 'conflict-resolver') content = <ConflictResolverExperience />
  else if (sectionKey === 'versions-provenance') content = <VersionsProvenanceExperience />
  else if (sectionKey === 'indexing-readiness') content = <IndexingReadinessExperience />
  else content = <MemoryValidationExperience />
  return <>{content}<DoctrineDrawer doctrine={selected} onClose={() => setSelected(null)} /></>
}
