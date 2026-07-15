import Link from 'next/link'
import {
  HRHero,
  HRMetric,
  HRPanel,
  HRRow,
  HRButton,
  HRGrid,
  HRInput,
  HRSelect,
  HRTextarea,
  HRSubmit,
  formGrid,
} from './HRMaxUI'

export function V3Hero(props: any) {
  return <HRHero {...props} />
}

export function V3MetricCard(props: any) {
  return <HRMetric {...props} />
}

export function V3Panel(props: any) {
  return <HRPanel {...props} />
}

export function V3Row(props: any) {
  return <HRRow {...props} />
}

export {
  HRButton,
  HRGrid,
  HRInput,
  HRSelect,
  HRTextarea,
  HRSubmit,
  formGrid,
}

export function V3Link({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      style={{
        display: 'block',
        padding: '14px 16px',
        borderRadius: 16,
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        color: '#0f172a',
        fontWeight: 900,
        textDecoration: 'none',
      }}
    >
      {children}
    </Link>
  )
}
