import Link from 'next/link'
import type { CSSProperties, ReactNode } from 'react'

export const formGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))',
  gap: 12,
}

type CommonProps = {
  children?: ReactNode
}

export function HRHero({
  title,
  subtitle,
  actions,
}: {
  title: string
  subtitle?: string
  actions?: ReactNode
}) {
  return (
    <section
      style={{
        background: 'linear-gradient(135deg,#0f172a,#1e3a8a,#0f766e)',
        borderRadius: 28,
        padding: 28,
        color: 'white',
        marginBottom: 22,
        boxShadow: '0 24px 70px rgba(15,23,42,.18)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 18, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 950, letterSpacing: 1.2, textTransform: 'uppercase', opacity: 0.86 }}>
            AngelCare HR MAX
          </div>
          <h1 style={{ margin: '8px 0 8px', fontSize: 34, lineHeight: 1.08 }}>{title}</h1>
          {subtitle ? <p style={{ margin: 0, maxWidth: 900, color: '#dbeafe', fontWeight: 750, lineHeight: 1.55 }}>{subtitle}</p> : null}
        </div>
        {actions ? <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>{actions}</div> : null}
      </div>
    </section>
  )
}

export function HRPanel({
  title,
  subtitle,
  children,
  right,
}: CommonProps & {
  title: string
  subtitle?: string
  right?: ReactNode
}) {
  return (
    <section
      style={{
        background: 'white',
        border: '1px solid #e2e8f0',
        borderRadius: 24,
        padding: 18,
        boxShadow: '0 18px 52px rgba(15,23,42,.07)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'flex-start', marginBottom: 14 }}>
        <div>
          <h2 style={{ margin: 0, color: '#0f172a', fontSize: 20, fontWeight: 950 }}>{title}</h2>
          {subtitle ? <p style={{ margin: '5px 0 0', color: '#64748b', fontWeight: 750, lineHeight: 1.45 }}>{subtitle}</p> : null}
        </div>
        {right ? <div>{right}</div> : null}
      </div>
      {children}
    </section>
  )
}

export function HRGrid({
  children,
  min = 220,
}: CommonProps & {
  min?: number
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit,minmax(${min}px,1fr))`, gap: 14 }}>
      {children}
    </div>
  )
}

export function HRMetric({
  label,
  value,
  detail,
  tone = '#2563eb',
}: {
  label: string
  value: ReactNode
  detail?: string
  tone?: string
}) {
  return (
    <div
      style={{
        background: 'white',
        border: '1px solid #e2e8f0',
        borderRadius: 22,
        padding: 18,
        boxShadow: '0 14px 45px rgba(15,23,42,.07)',
      }}
    >
      <div style={{ color: '#64748b', fontSize: 12, fontWeight: 950, textTransform: 'uppercase', letterSpacing: 0.8 }}>{label}</div>
      <div style={{ color: tone, fontSize: 31, fontWeight: 950, marginTop: 8 }}>{value}</div>
      {detail ? <div style={{ color: '#475569', fontWeight: 750, marginTop: 6 }}>{detail}</div> : null}
    </div>
  )
}

export function HRRow({
  title,
  meta,
  status,
  href,
}: {
  title: ReactNode
  meta?: ReactNode
  status?: ReactNode
  href?: string
}) {
  const content = (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: 12,
        alignItems: 'center',
        borderBottom: '1px solid #f1f5f9',
        padding: '12px 0',
      }}
    >
      <div>
        <div style={{ color: '#0f172a', fontWeight: 950 }}>{title}</div>
        {meta ? <div style={{ color: '#64748b', fontWeight: 720, fontSize: 13, marginTop: 4 }}>{meta}</div> : null}
      </div>
      {status ? (
        <span
          style={{
            background: '#f8fafc',
            border: '1px solid #cbd5e1',
            borderRadius: 999,
            padding: '5px 9px',
            fontSize: 12,
            color: '#334155',
            fontWeight: 950,
            whiteSpace: 'nowrap',
          }}
        >
          {status}
        </span>
      ) : null}
    </div>
  )

  if (href) {
    return (
      <Link href={href} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
        {content}
      </Link>
    )
  }

  return content
}

export function HRButton({
  href,
  children,
  variant = 'blue',
}: {
  href: string
  children: ReactNode
  variant?: 'blue' | 'light'
}) {
  const isLight = variant === 'light'
  return (
    <Link
      href={href}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 38,
        padding: '9px 13px',
        borderRadius: 999,
        border: isLight ? '1px solid #cbd5e1' : '1px solid #1d4ed8',
        background: isLight ? 'white' : '#2563eb',
        color: isLight ? '#0f172a' : 'white',
        textDecoration: 'none',
        fontWeight: 950,
        boxShadow: isLight ? '0 10px 24px rgba(15,23,42,.06)' : '0 10px 24px rgba(37,99,235,.18)',
      }}
    >
      {children}
    </Link>
  )
}

const inputStyle: CSSProperties = {
  minHeight: 40,
  borderRadius: 12,
  border: '1px solid #cbd5e1',
  padding: '0 11px',
  fontWeight: 750,
  color: '#0f172a',
  background: 'white',
}

const labelStyle: CSSProperties = {
  display: 'grid',
  gap: 6,
  color: '#334155',
  fontWeight: 900,
  fontSize: 13,
}

export function HRInput({
  name,
  label,
  type = 'text',
  defaultValue,
  required,
}: {
  name: string
  label: string
  type?: string
  defaultValue?: string | number
  required?: boolean
}) {
  return (
    <label style={labelStyle}>
      {label}
      <input name={name} type={type} defaultValue={defaultValue} required={required} style={inputStyle} />
    </label>
  )
}

export function HRSelect({
  name,
  label,
  options,
  defaultValue,
}: {
  name: string
  label: string
  options: string[]
  defaultValue?: string
}) {
  return (
    <label style={labelStyle}>
      {label}
      <select name={name} defaultValue={defaultValue} style={inputStyle}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  )
}

export function HRTextarea({
  name,
  label,
  defaultValue,
}: {
  name: string
  label: string
  defaultValue?: string
}) {
  return (
    <label style={labelStyle}>
      {label}
      <textarea
        name={name}
        defaultValue={defaultValue}
        rows={4}
        style={{
          borderRadius: 14,
          border: '1px solid #cbd5e1',
          padding: 11,
          fontWeight: 750,
          color: '#0f172a',
          background: 'white',
          resize: 'vertical',
        }}
      />
    </label>
  )
}

export function HRSubmit({ children }: { children: ReactNode }) {
  return (
    <button
      type="submit"
      style={{
        minHeight: 38,
        borderRadius: 999,
        border: '1px solid #1d4ed8',
        background: '#2563eb',
        color: 'white',
        padding: '9px 14px',
        fontWeight: 950,
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  )
}
