import type { ReactNode } from 'react'
import { ANGELCARE360_OPERATOR_COLORS } from '../Angelcare360OperatorVisualSystem'

type Tone = 'blue' | 'green' | 'amber' | 'red' | 'neutral'

type Chip = {
  label: string
  tone?: Tone
}

type Contact = {
  label: string
  value: string
  tone?: Tone
}

type Highlight = {
  label: string
  value: string
  detail?: string
  tone?: Tone
}

type Props = {
  eyebrow: string
  title: string
  subtitle: string
  metaLine?: string
  chips: Chip[]
  contacts: Contact[]
  highlights: Highlight[]
  actions?: ReactNode
}

export default function Angelcare360OperatorDossierHero({
  eyebrow,
  title,
  subtitle,
  metaLine,
  chips,
  contacts,
  highlights,
  actions,
}: Props) {
  return (
    <section style={heroStyle}>
      <div style={mainStyle}>
        <div style={eyebrowStyle}>{eyebrow}</div>
        <div style={chipRowStyle}>
          {chips.map((chip) => (
            <span key={chip.label} style={chipStyle(chip.tone)}>
              {chip.label}
            </span>
          ))}
        </div>
        <h1 style={titleStyle}>{title}</h1>
        <p style={subtitleStyle}>{subtitle}</p>
        {metaLine ? <p style={metaStyle}>{metaLine}</p> : null}
        <div style={contactRowStyle}>
          {contacts.map((contact) => (
            <div key={`${contact.label}-${contact.value}`} style={contactStyle(contact.tone)}>
              <div style={contactLabelStyle}>{contact.label}</div>
              <div style={contactValueStyle}>{contact.value}</div>
            </div>
          ))}
        </div>
        {actions ? <div style={actionsStyle}>{actions}</div> : null}
      </div>

      <aside style={sideStyle}>
        {highlights.map((highlight) => (
          <article key={highlight.label} style={highlightCardStyle(highlight.tone)}>
            <div style={highlightLabelStyle}>{highlight.label}</div>
            <div style={highlightValueStyle}>{highlight.value}</div>
            {highlight.detail ? <div style={highlightDetailStyle}>{highlight.detail}</div> : null}
          </article>
        ))}
      </aside>
    </section>
  )
}

function chipStyle(tone: Tone = 'neutral'): React.CSSProperties {
  const palette = {
    blue: { background: ANGELCARE360_OPERATOR_COLORS.blueSoft, color: ANGELCARE360_OPERATOR_COLORS.blueDeep, border: ANGELCARE360_OPERATOR_COLORS.blueBorder },
    green: { background: ANGELCARE360_OPERATOR_COLORS.greenSoft, color: ANGELCARE360_OPERATOR_COLORS.green, border: ANGELCARE360_OPERATOR_COLORS.greenBorder },
    amber: { background: ANGELCARE360_OPERATOR_COLORS.amberSoft, color: ANGELCARE360_OPERATOR_COLORS.amber, border: ANGELCARE360_OPERATOR_COLORS.amberBorder },
    red: { background: ANGELCARE360_OPERATOR_COLORS.redSoft, color: ANGELCARE360_OPERATOR_COLORS.red, border: ANGELCARE360_OPERATOR_COLORS.redBorder },
    neutral: { background: ANGELCARE360_OPERATOR_COLORS.background, color: ANGELCARE360_OPERATOR_COLORS.navy, border: ANGELCARE360_OPERATOR_COLORS.borderSoft },
  }[tone]
  return {
    display: 'inline-flex',
    alignItems: 'center',
    borderRadius: 999,
    padding: '7px 11px',
    background: palette.background,
    color: palette.color,
    border: `1px solid ${palette.border}`,
    fontSize: 12,
    fontWeight: 900,
    whiteSpace: 'nowrap',
  }
}

function contactStyle(tone: Tone = 'neutral'): React.CSSProperties {
  const palette = {
    blue: ANGELCARE360_OPERATOR_COLORS.blueSoft,
    green: ANGELCARE360_OPERATOR_COLORS.greenSoft,
    amber: ANGELCARE360_OPERATOR_COLORS.amberSoft,
    red: ANGELCARE360_OPERATOR_COLORS.redSoft,
    neutral: ANGELCARE360_OPERATOR_COLORS.white,
  }[tone]
  return {
    borderRadius: 18,
    border: `1px solid ${ANGELCARE360_OPERATOR_COLORS.borderSoft}`,
    background: palette,
    padding: '11px 12px',
    display: 'grid',
    gap: 4,
  }
}

function highlightCardStyle(tone: Tone = 'neutral'): React.CSSProperties {
  const palette = {
    blue: { background: 'linear-gradient(180deg, rgba(239,246,255,.98) 0%, rgba(255,255,255,.98) 100%)', border: ANGELCARE360_OPERATOR_COLORS.blueBorder },
    green: { background: 'linear-gradient(180deg, rgba(240,253,244,.98) 0%, rgba(255,255,255,.98) 100%)', border: ANGELCARE360_OPERATOR_COLORS.greenBorder },
    amber: { background: 'linear-gradient(180deg, rgba(255,247,237,.98) 0%, rgba(255,255,255,.98) 100%)', border: ANGELCARE360_OPERATOR_COLORS.amberBorder },
    red: { background: 'linear-gradient(180deg, rgba(254,242,242,.98) 0%, rgba(255,255,255,.98) 100%)', border: ANGELCARE360_OPERATOR_COLORS.redBorder },
    neutral: { background: 'linear-gradient(180deg, rgba(255,255,255,.99) 0%, rgba(248,250,252,.98) 100%)', border: ANGELCARE360_OPERATOR_COLORS.border },
  }[tone]
  return {
    borderRadius: 22,
    border: `1px solid ${palette.border}`,
    background: palette.background,
    padding: 16,
    display: 'grid',
    gap: 6,
    boxShadow: '0 14px 32px rgba(15,23,42,.04)',
  }
}

const heroStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1.45fr) minmax(310px, .9fr)',
  gap: 16,
  padding: 24,
  borderRadius: 30,
  border: `1px solid ${ANGELCARE360_OPERATOR_COLORS.border}`,
  background:
    'radial-gradient(circle at top right, rgba(219,234,254,.80) 0%, rgba(255,255,255,.96) 36%), linear-gradient(180deg, rgba(255,255,255,.98) 0%, rgba(241,245,249,.95) 100%)',
  boxShadow: '0 24px 72px rgba(15,23,42,.07)',
}

const mainStyle: React.CSSProperties = {
  display: 'grid',
  gap: 14,
}

const eyebrowStyle: React.CSSProperties = {
  color: ANGELCARE360_OPERATOR_COLORS.blue,
  textTransform: 'uppercase',
  letterSpacing: 1.2,
  fontSize: 11,
  fontWeight: 900,
}

const chipRowStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
}

const titleStyle: React.CSSProperties = {
  margin: 0,
  color: ANGELCARE360_OPERATOR_COLORS.navy,
  fontSize: 'clamp(28px, 4vw, 44px)',
  lineHeight: 1.02,
  fontWeight: 950,
}

const subtitleStyle: React.CSSProperties = {
  margin: 0,
  color: ANGELCARE360_OPERATOR_COLORS.slate,
  lineHeight: 1.72,
  fontWeight: 600,
  maxWidth: 960,
}

const metaStyle: React.CSSProperties = {
  margin: 0,
  color: ANGELCARE360_OPERATOR_COLORS.slateMuted,
  lineHeight: 1.6,
  fontWeight: 700,
}

const contactRowStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
  gap: 10,
}

const contactLabelStyle: React.CSSProperties = {
  color: ANGELCARE360_OPERATOR_COLORS.slateMuted,
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: 0.8,
  fontWeight: 900,
}

const contactValueStyle: React.CSSProperties = {
  color: ANGELCARE360_OPERATOR_COLORS.navy,
  fontWeight: 800,
  lineHeight: 1.5,
}

const actionsStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 10,
}

const sideStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
  gap: 10,
  alignContent: 'start',
}

const highlightLabelStyle: React.CSSProperties = {
  color: ANGELCARE360_OPERATOR_COLORS.slateMuted,
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: 0.8,
  fontWeight: 900,
}

const highlightValueStyle: React.CSSProperties = {
  color: ANGELCARE360_OPERATOR_COLORS.navy,
  fontSize: 25,
  lineHeight: 1.05,
  fontWeight: 950,
}

const highlightDetailStyle: React.CSSProperties = {
  color: ANGELCARE360_OPERATOR_COLORS.slate,
  lineHeight: 1.55,
  fontWeight: 600,
}
