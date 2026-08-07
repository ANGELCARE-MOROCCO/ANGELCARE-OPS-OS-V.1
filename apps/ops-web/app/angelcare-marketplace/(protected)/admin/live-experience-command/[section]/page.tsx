import { notFound } from 'next/navigation'
import { LiveExperiencePage } from '@/angelcare-marketplace/live-experience-command/admin-pages'
import type { LiveMode } from '@/angelcare-marketplace/live-experience-command/types'

type LiveSection = Exclude<LiveMode, 'command'>

const SECTION_CONFIG: Record<LiveSection, { mode: LiveSection }> = {
  analytics: { mode: 'analytics' },
  audiences: { mode: 'audiences' },
  broadcasts: { mode: 'broadcasts' },
  experiments: { mode: 'experiments' },
  history: { mode: 'history' },
  placements: { mode: 'placements' },
  popups: { mode: 'popups' },
  'proof-widgets': { mode: 'proof-widgets' },
  schedules: { mode: 'schedules' },
  settings: { mode: 'settings' },
  templates: { mode: 'templates' },
}

function isLiveSection(section: string): section is LiveSection {
  return Object.prototype.hasOwnProperty.call(SECTION_CONFIG, section)
}

export default async function LiveExperienceSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params
  if (!isLiveSection(section)) notFound()
  return <LiveExperiencePage mode={SECTION_CONFIG[section].mode} />
}
