'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import type { Angelcare360AdmissionLeadRecord, Angelcare360AdmissionApplicationListRecord } from '@/types/angelcare360/admissions'

type Angelcare360AdmissionLeadDetailProps = {
  lead: Angelcare360AdmissionLeadRecord & {
    assigned_staff_name?: string | null
    applications?: Angelcare360AdmissionApplicationListRecord[]
    latest_audit_events?: Array<Record<string, unknown>>
  }
  schoolId: string
  canConvert: boolean
}

function splitName(value: string) {
  const normalized = value.trim().replace(/\s+/g, ' ')
  if (!normalized) return { firstName: '', lastName: '' }
  const parts = normalized.split(' ')
  if (parts.length === 1) return { firstName: parts[0], lastName: '' }
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') }
}

export default function Angelcare360AdmissionLeadDetail({ lead, schoolId, canConvert }: Angelcare360AdmissionLeadDetailProps) {
  const router = useRouter()
  const [feedback, setFeedback] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const hasApplication = (lead.applications || []).length > 0 || Boolean(lead.converted_at)

  const convertLead = () => {
    if (!canConvert || hasApplication) return
    startTransition(async () => {
      setFeedback(null)
      try {
        const child = splitName(lead.child_first_name || lead.child_last_name ? [lead.child_first_name, lead.child_last_name].filter(Boolean).join(' ') : lead.student_full_name)
        const parent = splitName(lead.parent_name)
        const response = await fetch('/api/angelcare360/admissions', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({
            entity: 'lead',
            operation: 'convert',
            payload: {
              schoolId,
              leadId: String(lead.id),
              applicationCode: `APP-${Date.now()}`,
              applicationStage: 'open',
              status: 'open',
              childFirstName: child.firstName,
              childLastName: child.lastName,
              parentFirstName: parent.firstName || lead.parent_name,
              parentLastName: parent.lastName,
              phone: lead.parent_phone || null,
              email: lead.parent_email || null,
              relationshipType: lead.relationship_type || 'tuteur',
              desiredLevel: lead.desired_level || null,
              source: lead.source_channel || null,
              nextAction: lead.next_action || null,
              nextActionAt: lead.next_action_at || null,
              responsibleStaffId: lead.responsible_staff_id || null,
              priority: lead.priority || 'normal',
              notes: lead.notes || null,
            },
          }),
        })
        const result = await response.json().catch(() => null)
        if (!response.ok || !result?.ok) {
          throw new Error(result?.error || 'La conversion a échoué.')
        }
        setFeedback(result.warning || 'La demande a été convertie en dossier.')
        router.refresh()
      } catch (error) {
        setFeedback(error instanceof Error ? error.message : 'Une erreur est survenue.')
      }
    })
  }

  return (
    <section style={shellStyle}>
      <article style={summaryStyle}>
        <div style={badgeStyle}>Demande d’inscription</div>
        <h2 style={titleStyle}>{lead.student_full_name}</h2>
        <p style={subtitleStyle}>{lead.parent_name} · {lead.parent_phone || lead.parent_email || 'Coordonnées incomplètes'}</p>
        <div style={metaGridStyle}>
          <div style={metaCardStyle}><div style={metaLabelStyle}>Statut</div><div style={metaValueStyle}>{lead.status}</div></div>
          <div style={metaCardStyle}><div style={metaLabelStyle}>Niveau demandé</div><div style={metaValueStyle}>{lead.desired_level || '—'}</div></div>
          <div style={metaCardStyle}><div style={metaLabelStyle}>Prochaine action</div><div style={metaValueStyle}>{lead.next_action || '—'}</div></div>
          <div style={metaCardStyle}><div style={metaLabelStyle}>Responsable</div><div style={metaValueStyle}>{lead.assigned_staff_name || '—'}</div></div>
        </div>
        <div style={actionRowStyle}>
          <button
            type="button"
            onClick={convertLead}
            disabled={!canConvert || hasApplication || isPending}
            title={!canConvert ? 'Vous n’avez pas la permission de convertir une demande.' : hasApplication ? 'Un dossier existe déjà pour cette demande.' : 'Conversion auditable vers le socle dossiers.'}
            style={!canConvert || hasApplication || isPending ? disabledButtonStyle : primaryButtonStyle}
          >
            {isPending ? 'Conversion…' : hasApplication ? 'Déjà convertie' : 'Convertir en dossier'}
          </button>
          {feedback ? <span style={feedbackStyle}>{feedback}</span> : null}
        </div>
      </article>

      <article style={sectionStyle}>
        <div style={sectionTitleStyle}>Bloc contact</div>
        <div style={infoGridStyle}>
          <div><span style={infoLabelStyle}>Relation</span><div style={infoValueStyle}>{lead.relationship_type || '—'}</div></div>
          <div><span style={infoLabelStyle}>Source</span><div style={infoValueStyle}>{lead.source_channel || '—'}</div></div>
          <div><span style={infoLabelStyle}>Date de contact</span><div style={infoValueStyle}>{lead.contacted_at ? new Date(lead.contacted_at).toLocaleString('fr-FR') : '—'}</div></div>
          <div><span style={infoLabelStyle}>Mise à jour</span><div style={infoValueStyle}>{new Date(lead.updated_at).toLocaleString('fr-FR')}</div></div>
        </div>
      </article>

      <article style={sectionStyle}>
        <div style={sectionTitleStyle}>Dossiers ouverts</div>
        <div style={listStyle}>
          {(lead.applications || []).length > 0 ? (lead.applications || []).map((application) => (
            <Link key={application.id} href={application.detail_href || `/angelcare-360-command-center/admissions/dossiers/${application.id}`} style={listItemStyle}>
              <div>
                <div style={listTitleStyle}>{application.application_code}</div>
                <div style={listSubtitleStyle}>{application.application_stage} · {application.status}</div>
              </div>
              <span style={chipStyle}>{application.ready_for_conversion ? 'Convertible' : 'En attente'}</span>
            </Link>
          )) : (
            <div style={emptyStyle}>Aucun dossier associé pour le moment.</div>
          )}
        </div>
      </article>

      <article style={sectionStyle}>
        <div style={sectionTitleStyle}>Audit récent</div>
        <div style={listStyle}>
          {(lead.latest_audit_events || []).length > 0 ? (lead.latest_audit_events || []).map((event) => (
            <div key={String(event.id)} style={auditItemStyle}>
              <div style={listTitleStyle}>{String(event.action || 'Événement')}</div>
              <div style={listSubtitleStyle}>{String(event.severity || 'info')} · {new Date(String(event.created_at || Date.now())).toLocaleString('fr-FR')}</div>
            </div>
          )) : (
            <div style={emptyStyle}>Aucun événement d’audit disponible.</div>
          )}
        </div>
      </article>
    </section>
  )
}

const shellStyle: React.CSSProperties = {
  display: 'grid',
  gap: 12,
}

const summaryStyle: React.CSSProperties = {
  borderRadius: 22,
  border: '1px solid #dbe4ef',
  background: '#fff',
  padding: 18,
  boxShadow: '0 18px 54px rgba(15,23,42,.05)',
  display: 'grid',
  gap: 12,
}

const badgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: 999,
  padding: '6px 10px',
  background: '#dbeafe',
  color: '#1d4ed8',
  fontSize: 12,
  fontWeight: 900,
}

const titleStyle: React.CSSProperties = {
  margin: 0,
  color: '#0f172a',
  fontSize: 24,
  fontWeight: 950,
}

const subtitleStyle: React.CSSProperties = {
  margin: 0,
  color: '#475569',
  fontWeight: 650,
}

const metaGridStyle: React.CSSProperties = {
  display: 'grid',
  gap: 10,
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
}

const metaCardStyle: React.CSSProperties = {
  borderRadius: 16,
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  padding: 12,
}

const metaLabelStyle: React.CSSProperties = {
  color: '#64748b',
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: 1,
  fontWeight: 900,
}

const metaValueStyle: React.CSSProperties = {
  marginTop: 8,
  color: '#0f172a',
  fontWeight: 800,
}

const sectionStyle: React.CSSProperties = {
  borderRadius: 22,
  border: '1px solid #dbe4ef',
  background: '#fff',
  padding: 18,
  boxShadow: '0 18px 54px rgba(15,23,42,.05)',
  display: 'grid',
  gap: 12,
}

const sectionTitleStyle: React.CSSProperties = {
  color: '#0f172a',
  fontSize: 14,
  fontWeight: 900,
  textTransform: 'uppercase',
  letterSpacing: 1,
}

const infoGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: 12,
}

const infoLabelStyle: React.CSSProperties = {
  display: 'block',
  color: '#64748b',
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: 1,
  fontWeight: 900,
}

const infoValueStyle: React.CSSProperties = {
  marginTop: 6,
  color: '#0f172a',
  fontWeight: 750,
}

const listStyle: React.CSSProperties = {
  display: 'grid',
  gap: 10,
}

const listItemStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 10,
  alignItems: 'center',
  padding: 14,
  borderRadius: 16,
  border: '1px solid #e2e8f0',
  textDecoration: 'none',
  color: '#0f172a',
}

const listTitleStyle: React.CSSProperties = {
  color: '#0f172a',
  fontWeight: 850,
}

const listSubtitleStyle: React.CSSProperties = {
  marginTop: 4,
  color: '#64748b',
  fontSize: 12,
  fontWeight: 600,
}

const chipStyle: React.CSSProperties = {
  borderRadius: 999,
  padding: '6px 10px',
  background: '#eff6ff',
  color: '#1d4ed8',
  fontSize: 11,
  fontWeight: 900,
}

const auditItemStyle: React.CSSProperties = {
  padding: 14,
  borderRadius: 16,
  border: '1px solid #e2e8f0',
  background: '#f8fafc',
}

const emptyStyle: React.CSSProperties = {
  borderRadius: 16,
  border: '1px dashed #cbd5e1',
  background: '#f8fafc',
  padding: 14,
  color: '#64748b',
  fontWeight: 600,
}

const actionRowStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 10,
  alignItems: 'center',
}

const primaryButtonStyle: React.CSSProperties = {
  border: '1px solid #0f172a',
  borderRadius: 14,
  padding: '11px 14px',
  background: '#0f172a',
  color: '#fff',
  fontWeight: 800,
  cursor: 'pointer',
}

const disabledButtonStyle: React.CSSProperties = {
  border: '1px dashed #cbd5e1',
  borderRadius: 14,
  padding: '11px 14px',
  background: '#f8fafc',
  color: '#94a3b8',
  fontWeight: 800,
  cursor: 'not-allowed',
}

const feedbackStyle: React.CSSProperties = {
  color: '#475569',
  fontWeight: 700,
}
