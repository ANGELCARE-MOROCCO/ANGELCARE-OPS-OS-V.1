'use client'

import Link from 'next/link'
import type { Angelcare360CommunicationOverviewRecord } from '@/types/angelcare360/communications'
import Angelcare360CommunicationRiskPanel from './Angelcare360CommunicationRiskPanel'
import {
  ANGELCARE360_COLORS,
  angelcare360HeroBackdropStyle,
  angelcare360MetricCardStyle,
  angelcare360PageShellStyle,
  angelcare360SectionBackdropStyle,
} from '@/components/angelcare360/ui/Angelcare360VisualSystem'

type Props = {
  overview: Angelcare360CommunicationOverviewRecord
}

export default function Angelcare360CommunicationHub({ overview }: Props) {
  return (
    <section style={stackStyle}>
      <div style={gridStyle}>
        <Metric label="Conversations" value={overview.conversationsCount} />
        <Metric label="Messages" value={overview.messagesCount} />
        <Metric label="Non lus" value={overview.unreadCount} />
        <Metric label="Annonces" value={overview.announcementsPublishedCount} />
        <Metric label="Modèles" value={overview.templatesCount} />
        <Metric label="Audiences prêtes" value={overview.audienceReadiness.readyGroups.length} />
      </div>

      <div style={actionsRowStyle}>
        <Link href="/angelcare-360-command-center/messagerie/conversations" style={primaryActionStyle}>Créer une conversation</Link>
        <Link href="/angelcare-360-command-center/messagerie/annonces" style={secondaryActionStyle}>Créer une annonce</Link>
        <Link href="/angelcare-360-command-center/messagerie/modeles" style={secondaryActionStyle}>Créer un modèle</Link>
        <Link href="/angelcare-360-command-center/messagerie/audiences" style={secondaryActionStyle}>Ouvrir les audiences</Link>
      </div>

      <Angelcare360CommunicationRiskPanel risks={overview.risks} />
    </section>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <article style={metricStyle}>
      <div style={metricLabelStyle}>{label}</div>
      <div style={metricValueStyle}>{value}</div>
    </article>
  )
}

const stackStyle: React.CSSProperties = { ...angelcare360PageShellStyle }
const gridStyle: React.CSSProperties = { display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))' }
const metricStyle: React.CSSProperties = { ...angelcare360MetricCardStyle, display: 'grid', gap: 6, padding: 16, borderRadius: 22 }
const metricLabelStyle: React.CSSProperties = { color: ANGELCARE360_COLORS.slateMuted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.7, fontWeight: 900 }
const metricValueStyle: React.CSSProperties = { color: ANGELCARE360_COLORS.navy, fontSize: 24, fontWeight: 950 }
const actionsRowStyle: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 10 }
const primaryActionStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', borderRadius: 14, borderWidth: 1, borderStyle: 'solid', borderColor: ANGELCARE360_COLORS.navy, background: `linear-gradient(180deg, ${ANGELCARE360_COLORS.navy} 0%, ${ANGELCARE360_COLORS.navyDeep} 100%)`, color: ANGELCARE360_COLORS.white, padding: '10px 14px', textDecoration: 'none', fontWeight: 800 }
const secondaryActionStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', borderRadius: 14, borderWidth: 1, borderStyle: 'solid', borderColor: ANGELCARE360_COLORS.borderStrong, background: `linear-gradient(180deg, ${ANGELCARE360_COLORS.white} 0%, ${ANGELCARE360_COLORS.background} 100%)`, color: ANGELCARE360_COLORS.navy, padding: '10px 14px', textDecoration: 'none', fontWeight: 800 }
