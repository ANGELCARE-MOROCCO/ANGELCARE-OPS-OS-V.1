import Link from 'next/link'
import type React from 'react'

type KpiProps = {
  label: string
  value: string | number
  sub?: string
  tone?: string
}

export function Kpi({ label, value, sub, tone = '#2563eb' }: KpiProps) {
  return (
    <div
      style={{
        padding: 18,
        borderRadius: 22,
        background: '#fff',
        border: `1px solid ${tone}33`,
        borderLeft: `5px solid ${tone}`,
        boxShadow: '0 16px 32px rgba(15,23,42,.05)',
        minHeight: 102,
      }}
    >
      <span style={{ color: '#64748b', fontWeight: 850, fontSize: 12 }}>{label}</span>
      <strong style={{ display: 'block', marginTop: 6, fontSize: 31, color: '#0f172a' }}>
        {value}
      </strong>
      {sub && (
        <small style={{ color: '#64748b', fontWeight: 800, lineHeight: 1.35 }}>
          {sub}
        </small>
      )}
    </div>
  )
}

export function MetricCard({
  label,
  title,
  value,
  tone,
  sub,
}: {
  label?: string
  title?: string
  value: string | number
  tone?: string
  sub?: string
}) {
  return <Kpi label={label || title || 'Metric'} value={value} tone={tone} sub={sub} />
}

export function Panel({
  title,
  subtitle,
  children,
  tone = '#2563eb',
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
  tone?: string
}) {
  return (
    <section
      style={{
        padding: 20,
        borderRadius: 26,
        background: '#fff',
        border: '1px solid #dbe3ee',
        boxShadow: '0 18px 38px rgba(15,23,42,.06)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 12,
          alignItems: 'start',
          marginBottom: 16,
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 950, color: '#0f172a' }}>
            {title}
          </h2>
          {subtitle && (
            <p style={{ margin: '6px 0 0', color: '#64748b', fontWeight: 750, lineHeight: 1.55 }}>
              {subtitle}
            </p>
          )}
        </div>
        <span
          style={{
            width: 12,
            height: 12,
            borderRadius: 999,
            background: tone,
            boxShadow: `0 0 16px ${tone}`,
          }}
        />
      </div>
      {children}
    </section>
  )
}

export function WorkCard({
  title,
  children,
}: {
  title?: string
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        padding: 16,
        borderRadius: 18,
        background: '#fff',
        border: '1px solid #dbe3ee',
        boxShadow: '0 12px 24px rgba(15,23,42,.04)',
      }}
    >
      {title && <h3 style={{ margin: '0 0 8px', color: '#0f172a' }}>{title}</h3>}
      {children}
    </div>
  )
}

export function ActionButton({
  children,
  tone = '#0f172a',
  type = 'submit',
}: {
  children: React.ReactNode
  tone?: string
  type?: 'button' | 'submit' | 'reset'
}) {
  return (
    <button
      type={type}
      style={{
        border: 0,
        borderRadius: 14,
        padding: '12px 15px',
        background: tone,
        color: '#fff',
        fontWeight: 950,
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  )
}

export function LinkButton({
  href,
  children,
  dark = false,
}: {
  href: string
  children: React.ReactNode
  dark?: boolean
}) {
  return (
    <Link
      href={href}
      style={{
        display: 'inline-flex',
        padding: '10px 12px',
        borderRadius: 13,
        background: dark ? '#0f172a' : '#eef2ff',
        color: dark ? '#fff' : '#3730a3',
        textDecoration: 'none',
        fontWeight: 950,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
      }}
    >
      {children}
    </Link>
  )
}

export function Badge({
  children,
  tone = '#2563eb',
}: {
  children: React.ReactNode
  tone?: string
}) {
  return (
    <span
      style={{
        display: 'inline-flex',
        padding: '6px 9px',
        borderRadius: 999,
        background: `${tone}16`,
        color: '#0f172a',
        border: `1px solid ${tone}44`,
        fontWeight: 900,
        fontSize: 12,
        width: 'fit-content',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  )
}

export function RiskBadge({
  children,
  tone = '#ef4444',
}: {
  children: React.ReactNode
  tone?: string
}) {
  return <Badge tone={tone}>{children}</Badge>
}

export function DataTable({
  headers,
  rows,
}: {
  headers: React.ReactNode[]
  rows: React.ReactNode[][]
}) {
  return (
    <div style={{ overflowX: 'auto', borderRadius: 18, border: '1px solid #e2e8f0' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th
                key={i}
                style={{
                  textAlign: 'left',
                  padding: 13,
                  background: '#f8fafc',
                  color: '#475569',
                  fontSize: 12,
                  fontWeight: 950,
                  textTransform: 'uppercase',
                  borderBottom: '1px solid #e2e8f0',
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td
                  key={j}
                  style={{
                    padding: 13,
                    borderTop: i === 0 ? 'none' : '1px solid #e2e8f0',
                    color: '#0f172a',
                    verticalAlign: 'top',
                  }}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export const inputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '12px 13px',
  borderRadius: 13,
  border: '1px solid #cbd5e1',
  background: '#fff',
  color: '#0f172a',
  fontWeight: 750,
}
