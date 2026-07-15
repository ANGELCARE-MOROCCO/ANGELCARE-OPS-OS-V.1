import Link from 'next/link'
import type { ReactNode } from 'react'

type Angelcare360PeopleDossierProps = {
  title: string
  subtitle?: string
  summaryItems: Array<{ label: string; value: ReactNode }>
  relatedPanels?: Array<{ title: string; items: Array<{ label: string; value: ReactNode }> }>
  lockedTabs?: Array<{ label: string; reason: string }>
  timeline?: Array<{ label: string; detail: ReactNode; date?: string | null }>
  actions?: ReactNode
}

export default function Angelcare360PeopleDossier({
  title,
  subtitle,
  summaryItems,
  relatedPanels = [],
  lockedTabs = [],
  timeline = [],
  actions,
}: Angelcare360PeopleDossierProps) {
  return (
    <section style={shellStyle}>
      <header style={headerStyle}>
        <div>
          <div style={eyebrowStyle}>Dossier opérationnel</div>
          <h1 style={titleStyle}>{title}</h1>
          {subtitle ? <p style={subtitleStyle}>{subtitle}</p> : null}
        </div>
        {actions ? <div style={actionsStyle}>{actions}</div> : null}
      </header>

      <div style={summaryGridStyle}>
        {summaryItems.map((item) => (
          <article key={item.label} style={summaryCardStyle}>
            <div style={summaryLabelStyle}>{item.label}</div>
            <div style={summaryValueStyle}>{item.value}</div>
          </article>
        ))}
      </div>

      {relatedPanels.length > 0 ? (
        <div style={panelGridStyle}>
          {relatedPanels.map((panel) => (
            <article key={panel.title} style={panelCardStyle}>
              <div style={panelTitleStyle}>{panel.title}</div>
              <div style={panelItemsStyle}>
                {panel.items.map((item) => (
                  <div key={item.label} style={panelItemStyle}>
                    <div style={panelItemLabelStyle}>{item.label}</div>
                    <div style={panelItemValueStyle}>{item.value}</div>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      ) : null}

      <article style={tabsCardStyle}>
        <div style={panelTitleStyle}>Modules liés verrouillés</div>
        <div style={lockedTabRowStyle}>
          {lockedTabs.map((tab) => (
            <div key={tab.label} style={lockedTabStyle}>
              <div style={lockedTabLabelStyle}>{tab.label}</div>
              <div style={lockedTabReasonStyle}>{tab.reason}</div>
            </div>
          ))}
        </div>
      </article>

      {timeline.length > 0 ? (
        <article style={timelineCardStyle}>
          <div style={panelTitleStyle}>Historique récent</div>
          <div style={timelineListStyle}>
            {timeline.map((entry) => (
              <div key={`${entry.label}-${entry.date || ''}`} style={timelineItemStyle}>
                <div style={timelineDotStyle} />
                <div style={timelineContentStyle}>
                  <div style={timelineHeaderStyle}>
                    <span style={timelineLabelStyle}>{entry.label}</span>
                    {entry.date ? <span style={timelineDateStyle}>{entry.date}</span> : null}
                  </div>
                  <div style={timelineDetailStyle}>{entry.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </article>
      ) : null}
    </section>
  )
}

const shellStyle: React.CSSProperties = {
  display: 'grid',
  gap: 16,
}

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  alignItems: 'start',
  flexWrap: 'wrap',
}

const eyebrowStyle: React.CSSProperties = {
  color: '#2563eb',
  textTransform: 'uppercase',
  letterSpacing: 1.1,
  fontSize: 12,
  fontWeight: 900,
}

const titleStyle: React.CSSProperties = {
  margin: '8px 0 0',
  color: '#0f172a',
  fontSize: 26,
  fontWeight: 950,
}

const subtitleStyle: React.CSSProperties = {
  margin: '8px 0 0',
  color: '#475569',
  lineHeight: 1.6,
  fontWeight: 600,
}

const actionsStyle: React.CSSProperties = {
  display: 'flex',
  gap: 10,
  flexWrap: 'wrap',
}

const summaryGridStyle: React.CSSProperties = {
  display: 'grid',
  gap: 12,
  gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
}

const summaryCardStyle: React.CSSProperties = {
  borderRadius: 20,
  border: '1px solid #dbe4ef',
  background: '#fff',
  padding: 16,
  boxShadow: '0 18px 54px rgba(15,23,42,.05)',
}

const summaryLabelStyle: React.CSSProperties = {
  color: '#64748b',
  fontSize: 12,
  textTransform: 'uppercase',
  letterSpacing: 1,
  fontWeight: 900,
}

const summaryValueStyle: React.CSSProperties = {
  marginTop: 10,
  color: '#0f172a',
  fontSize: 15,
  lineHeight: 1.55,
  fontWeight: 700,
}

const panelGridStyle: React.CSSProperties = {
  display: 'grid',
  gap: 12,
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
}

const panelCardStyle: React.CSSProperties = {
  borderRadius: 22,
  border: '1px solid #dbe4ef',
  background: '#fff',
  padding: 16,
  boxShadow: '0 18px 54px rgba(15,23,42,.05)',
}

const panelTitleStyle: React.CSSProperties = {
  color: '#0f172a',
  fontSize: 14,
  fontWeight: 900,
  textTransform: 'uppercase',
  letterSpacing: 1,
}

const panelItemsStyle: React.CSSProperties = {
  marginTop: 12,
  display: 'grid',
  gap: 10,
}

const panelItemStyle: React.CSSProperties = {
  display: 'grid',
  gap: 4,
  padding: '10px 0',
  borderBottom: '1px solid #eef2f7',
}

const panelItemLabelStyle: React.CSSProperties = {
  color: '#64748b',
  fontSize: 12,
  textTransform: 'uppercase',
  letterSpacing: 1,
  fontWeight: 900,
}

const panelItemValueStyle: React.CSSProperties = {
  color: '#0f172a',
  lineHeight: 1.55,
  fontWeight: 700,
}

const tabsCardStyle: React.CSSProperties = {
  borderRadius: 22,
  border: '1px solid #dbe4ef',
  background: '#fff',
  padding: 16,
  boxShadow: '0 18px 54px rgba(15,23,42,.05)',
}

const lockedTabRowStyle: React.CSSProperties = {
  marginTop: 12,
  display: 'grid',
  gap: 10,
  gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
}

const lockedTabStyle: React.CSSProperties = {
  borderRadius: 18,
  border: '1px dashed #cbd5e1',
  background: '#f8fafc',
  padding: 14,
}

const lockedTabLabelStyle: React.CSSProperties = {
  color: '#0f172a',
  fontSize: 13,
  fontWeight: 900,
}

const lockedTabReasonStyle: React.CSSProperties = {
  marginTop: 8,
  color: '#64748b',
  fontSize: 12,
  lineHeight: 1.55,
  fontWeight: 600,
}

const timelineCardStyle: React.CSSProperties = {
  borderRadius: 22,
  border: '1px solid #dbe4ef',
  background: '#fff',
  padding: 16,
  boxShadow: '0 18px 54px rgba(15,23,42,.05)',
}

const timelineListStyle: React.CSSProperties = {
  marginTop: 12,
  display: 'grid',
  gap: 12,
}

const timelineItemStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '16px minmax(0,1fr)',
  gap: 12,
}

const timelineDotStyle: React.CSSProperties = {
  marginTop: 6,
  width: 10,
  height: 10,
  borderRadius: 999,
  background: '#1d4ed8',
}

const timelineContentStyle: React.CSSProperties = {
  display: 'grid',
  gap: 4,
}

const timelineHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  flexWrap: 'wrap',
}

const timelineLabelStyle: React.CSSProperties = {
  color: '#0f172a',
  fontWeight: 900,
}

const timelineDateStyle: React.CSSProperties = {
  color: '#64748b',
  fontSize: 12,
  fontWeight: 700,
}

const timelineDetailStyle: React.CSSProperties = {
  color: '#475569',
  fontSize: 13,
  lineHeight: 1.55,
  fontWeight: 600,
}

