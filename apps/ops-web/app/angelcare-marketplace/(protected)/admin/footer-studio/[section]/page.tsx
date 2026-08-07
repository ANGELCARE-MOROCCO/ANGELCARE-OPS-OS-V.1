import { notFound } from 'next/navigation'
import { FooterStudioPage } from '@/angelcare-marketplace/footer-studio/admin-pages'
import type { FooterStudioMode } from '@/angelcare-marketplace/footer-studio/types'

type FooterSection = Exclude<FooterStudioMode, 'command'>

const SECTION_CONFIG: Record<FooterSection, { mode: FooterSection }> = {
  analytics: { mode: 'analytics' },
  components: { mode: 'components' },
  composer: { mode: 'composer' },
  contacts: { mode: 'contacts' },
  history: { mode: 'history' },
  localization: { mode: 'localization' },
  navigation: { mode: 'navigation' },
  profiles: { mode: 'profiles' },
  schedules: { mode: 'schedules' },
  settings: { mode: 'settings' },
  targeting: { mode: 'targeting' },
  themes: { mode: 'themes' },
}

function isFooterSection(section: string): section is FooterSection {
  return Object.prototype.hasOwnProperty.call(SECTION_CONFIG, section)
}

export const dynamic = 'force-dynamic'

export default async function FooterStudioSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params
  if (!isFooterSection(section)) notFound()
  return <FooterStudioPage mode={SECTION_CONFIG[section].mode} />
}
