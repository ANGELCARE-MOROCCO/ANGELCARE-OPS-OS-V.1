'use client'

import { useMemo, useState } from 'react'
import Angelcare360OperatorActionButton from './Angelcare360OperatorActionButton'

export type Angelcare360OperatorActionMenuItem = {
  id: string
  label: string
  onClick: () => void
  disabled?: boolean
  disabledReason?: string | null
  tone?: 'primary' | 'secondary' | 'ghost' | 'danger'
}

type Props = {
  label?: string
  items: Angelcare360OperatorActionMenuItem[]
}

export default function Angelcare360OperatorActionMenu({ label = 'Actions', items }: Props) {
  const [open, setOpen] = useState(false)
  const visible = useMemo(() => items.slice(0, 8), [items])

  return (
    <div style={wrapStyle}>
      <Angelcare360OperatorActionButton label={label} tone="secondary" onClick={() => setOpen((value) => !value)} />
      {open ? (
        <div style={menuStyle}>
          {visible.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (item.disabled) return
                setOpen(false)
                item.onClick()
              }}
              disabled={item.disabled}
              title={item.disabled ? item.disabledReason || item.label : item.label}
              style={itemStyle}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

const wrapStyle: React.CSSProperties = {
  position: 'relative',
  display: 'inline-flex',
}

const menuStyle: React.CSSProperties = {
  position: 'absolute',
  top: 'calc(100% + 8px)',
  left: 0,
  zIndex: 40,
  minWidth: 240,
  borderRadius: 18,
  border: '1px solid #dbe4ef',
  background: 'linear-gradient(180deg, rgba(255,255,255,.99) 0%, rgba(248,250,252,.99) 100%)',
  boxShadow: '0 18px 54px rgba(15,23,42,.12)',
  padding: 8,
  display: 'grid',
  gap: 6,
}

const itemStyle: React.CSSProperties = {
  border: 0,
  background: 'transparent',
  color: '#0f172a',
  textAlign: 'left',
  fontWeight: 800,
  padding: '10px 12px',
  borderRadius: 12,
  cursor: 'pointer',
  transition: 'background-color .15s ease, color .15s ease',
}
