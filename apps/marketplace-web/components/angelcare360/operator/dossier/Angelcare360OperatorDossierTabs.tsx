import Link from 'next/link'
import { ANGELCARE360_OPERATOR_COLORS } from '../Angelcare360OperatorVisualSystem'

type Tab = {
  label: string
  href: string
  active?: boolean
}

type Props = {
  tabs: Tab[]
}

export default function Angelcare360OperatorDossierTabs({ tabs }: Props) {
  return (
    <nav aria-label="Sections du dossier" style={navStyle}>
      {tabs.map((tab) => (
        <Link key={tab.href} href={tab.href} style={tabStyle(tab.active)}>
          {tab.label}
        </Link>
      ))}
    </nav>
  )
}

function tabStyle(active?: boolean): React.CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    padding: '10px 14px',
    border: `1px solid ${active ? ANGELCARE360_OPERATOR_COLORS.blueBorder : ANGELCARE360_OPERATOR_COLORS.borderSoft}`,
    background: active ? ANGELCARE360_OPERATOR_COLORS.blueSoft : ANGELCARE360_OPERATOR_COLORS.white,
    color: active ? ANGELCARE360_OPERATOR_COLORS.blueDeep : ANGELCARE360_OPERATOR_COLORS.slate,
    fontWeight: 850,
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    boxShadow: active ? '0 12px 24px rgba(29,78,216,.10)' : '0 10px 22px rgba(15,23,42,.04)',
  }
}

const navStyle: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  overflowX: 'auto',
  paddingBottom: 4,
}
