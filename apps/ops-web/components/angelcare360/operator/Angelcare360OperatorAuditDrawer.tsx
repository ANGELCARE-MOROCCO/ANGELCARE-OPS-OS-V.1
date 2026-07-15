'use client'

import type { ReactNode } from 'react'
import type { Angelcare360OperatorAuditLogRecord } from '@/types/angelcare360/operator'
import Angelcare360OperatorDrawer from './Angelcare360OperatorDrawer'
import Angelcare360OperatorStatusBadge from './Angelcare360OperatorStatusBadge'

type Props = {
  open: boolean
  event: Angelcare360OperatorAuditLogRecord | null
  onClose: () => void
}

export default function Angelcare360OperatorAuditDrawer({ open, event, onClose }: Props) {
  return (
    <Angelcare360OperatorDrawer
      open={open}
      title={event ? `${event.module} · ${event.action}` : 'Événement d’audit'}
      subtitle={event ? `${event.entity_type} · ${event.created_at}` : 'Sélectionnez un événement pour voir son détail.'}
      onClose={onClose}
    >
      {event ? (
        <div style={gridStyle}>
          <Item label="Sévérité" value={<Angelcare360OperatorStatusBadge status={event.severity} />} />
          <Item label="Acteur" value={event.actor_role || '—'} />
          <Item label="Client" value={event.client_id || '—'} />
          <Item label="Tenant" value={event.tenant_id || '—'} />
          <Item label="Entité" value={`${event.entity_type}${event.entity_id ? ` · ${event.entity_id}` : ''}`} />
          <Item label="Métadonnées" value={<pre style={preStyle}>{JSON.stringify(event.metadata || {}, null, 2)}</pre>} />
        </div>
      ) : null}
    </Angelcare360OperatorDrawer>
  )
}

function Item({ label, value }: { label: string; value: ReactNode }) {
  return (
    <section style={itemStyle}>
      <div style={labelStyle}>{label}</div>
      <div style={valueStyle}>{value}</div>
    </section>
  )
}

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gap: 12,
}

const itemStyle: React.CSSProperties = {
  display: 'grid',
  gap: 6,
  padding: 14,
  borderRadius: 18,
  border: '1px solid #e2e8f0',
  background: '#f8fafc',
}

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  textTransform: 'uppercase',
  letterSpacing: 0.8,
  color: '#64748b',
  fontWeight: 900,
}

const valueStyle: React.CSSProperties = {
  color: '#0f172a',
  fontWeight: 650,
  lineHeight: 1.65,
}

const preStyle: React.CSSProperties = {
  margin: 0,
  whiteSpace: 'pre-wrap',
  fontFamily: 'inherit',
}

