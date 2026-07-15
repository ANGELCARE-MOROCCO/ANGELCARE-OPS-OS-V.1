'use client'

import Link from 'next/link'
import { useMemo, useState, useTransition } from 'react'
import type { Angelcare360AttendanceJustificationListRecord } from '@/types/angelcare360/attendance'

type Angelcare360JustificationsWorkspaceProps = {
  schoolId: string
  items: Angelcare360AttendanceJustificationListRecord[]
  canCreate: boolean
  canApprove: boolean
  selectedId?: string | null
}

export default function Angelcare360JustificationsWorkspace({
  schoolId,
  items,
  canCreate,
  canApprove,
  selectedId,
}: Angelcare360JustificationsWorkspaceProps) {
  const [feedback, setFeedback] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState({
    attendanceRecordId: '',
    justificationCode: '',
    reasonCategory: 'medical',
    description: '',
    evidenceDocumentId: '',
  })

  const selectedItem = useMemo(() => items.find((item) => item.id === selectedId) || null, [items, selectedId])

  const mutate = (operation: string, payload: Record<string, unknown>) => {
    startTransition(async () => {
      setFeedback(null)
      try {
        const response = await fetch('/api/angelcare360/attendance', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({
            entity: 'justification',
            operation,
            payload: {
              schoolId,
              ...payload,
            },
          }),
        })
        const result = await response.json().catch(() => null)
        if (!response.ok || !result?.ok) {
          throw new Error(result?.error || 'L’action de justification a échoué.')
        }
        setFeedback(result.warning || 'Justification enregistrée.')
        globalThis.setTimeout(() => globalThis.location?.reload(), 220)
      } catch (error) {
        setFeedback(error instanceof Error ? error.message : 'Une erreur est survenue.')
      }
    })
  }

  return (
    <div style={shellStyle}>
      <section style={panelStyle}>
        <div style={panelHeaderStyle}>
          <div>
            <div style={eyebrowStyle}>Justifications</div>
            <h2 style={titleStyle}>Flux de justificatifs</h2>
            <p style={subtitleStyle}>Création, approbation et rejet des justificatifs liés aux absences et retards.</p>
          </div>
          <div style={panelMetaStyle}>{items.length} justificatif(s)</div>
        </div>

        {feedback ? <div style={feedbackStyle}>{feedback}</div> : null}
        {isPending ? <div style={pendingStyle}>Traitement de la demande en cours…</div> : null}

        <div style={gridStyle}>
          <form
            style={formStyle}
            onSubmit={(event) => {
              event.preventDefault()
              if (!canCreate) {
                setFeedback('La création de justificatif est verrouillée pour votre rôle.')
                return
              }
              mutate('create', {
                attendanceRecordId: form.attendanceRecordId,
                justificationCode: form.justificationCode,
                reasonCategory: form.reasonCategory,
                description: form.description,
                evidenceDocumentId: form.evidenceDocumentId || null,
                status: 'pending',
              })
            }}
          >
            <div style={formTitleStyle}>Créer un justificatif</div>
            <input required placeholder="ID relevé de présence" value={form.attendanceRecordId} onChange={(event) => setForm((current) => ({ ...current, attendanceRecordId: event.target.value }))} disabled={!canCreate} style={inputStyle} />
            <input required placeholder="Code justificatif" value={form.justificationCode} onChange={(event) => setForm((current) => ({ ...current, justificationCode: event.target.value }))} disabled={!canCreate} style={inputStyle} />
            <input required placeholder="Catégorie de motif" value={form.reasonCategory} onChange={(event) => setForm((current) => ({ ...current, reasonCategory: event.target.value }))} disabled={!canCreate} style={inputStyle} />
            <textarea required placeholder="Description" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} disabled={!canCreate} style={textareaStyle} />
            <input placeholder="Document de preuve (optionnel)" value={form.evidenceDocumentId} onChange={(event) => setForm((current) => ({ ...current, evidenceDocumentId: event.target.value }))} disabled={!canCreate} style={inputStyle} />
            <button type="submit" disabled={!canCreate} style={!canCreate ? disabledButtonStyle : primaryButtonStyle}>
              Enregistrer le justificatif
            </button>
          </form>

          <div style={listStyle}>
            {selectedItem ? (
              <article style={detailCardStyle}>
                <div style={detailEyebrowStyle}>Détail sélectionné</div>
                <div style={detailTitleStyle}>{selectedItem.justification_code}</div>
                <div style={detailTextStyle}>{selectedItem.description}</div>
                <div style={detailMetaStyle}>
                  {selectedItem.student_full_name || 'Élève non renseigné'} · {selectedItem.status}
                </div>
                <div style={detailActionsStyle}>
                  <button
                    type="button"
                    onClick={() => mutate('decision', { id: selectedItem.id, decision: 'accepted', decisionReason: 'Justificatif validé.' })}
                    disabled={!canApprove}
                    style={!canApprove ? disabledButtonStyle : secondaryButtonStyle}
                  >
                    Approuver
                  </button>
                  <button
                    type="button"
                    onClick={() => mutate('decision', { id: selectedItem.id, decision: 'rejected', decisionReason: 'Justificatif refusé.' })}
                    disabled={!canApprove}
                    style={!canApprove ? disabledButtonStyle : secondaryButtonStyle}
                  >
                    Rejeter
                  </button>
                </div>
              </article>
            ) : null}

            {items.length === 0 ? (
              <div style={emptyStyle}>Aucun justificatif n’est encore enregistré.</div>
            ) : (
              <div style={tableShellStyle}>
                <div style={tableHeaderStyle}>
                  <div>Code</div>
                  <div>Élève</div>
                  <div>Décision</div>
                  <div>Statut</div>
                  <div />
                </div>
                {items.map((item) => (
                  <div key={item.id} style={{ ...tableRowStyle, ...(item.id === selectedId ? selectedRowStyle : null) }}>
                    <div style={cellStrongStyle}>{item.justification_code}</div>
                    <div>
                      <div style={cellStrongStyle}>{item.student_full_name || '—'}</div>
                      <div style={cellMutedStyle}>{item.session_date || '—'}</div>
                    </div>
                    <div style={cellStrongStyle}>{item.decision}</div>
                    <div style={cellStrongStyle}>{item.status}</div>
                    <div style={rowActionsStyle}>
                      <Link href={`/angelcare-360-command-center/presences/justifications/${item.id}`} style={rowLinkStyle}>
                        Ouvrir
                      </Link>
                      <button
                        type="button"
                        onClick={() => mutate('decision', { id: item.id, decision: 'accepted', decisionReason: 'Justificatif validé.' })}
                        disabled={!canApprove}
                        style={!canApprove ? disabledButtonStyle : secondaryButtonStyle}
                      >
                        Approuver
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

const shellStyle: React.CSSProperties = {
  display: 'grid',
  gap: 16,
}

const panelStyle: React.CSSProperties = {
  borderRadius: 24,
  border: '1px solid #dbe4ef',
  background: '#fff',
  boxShadow: '0 16px 44px rgba(15,23,42,.05)',
  padding: 18,
}

const panelHeaderStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'space-between',
  gap: 12,
  alignItems: 'start',
  marginBottom: 16,
}

const eyebrowStyle: React.CSSProperties = {
  color: '#2563eb',
  textTransform: 'uppercase',
  letterSpacing: 1,
  fontSize: 12,
  fontWeight: 900,
}

const titleStyle: React.CSSProperties = {
  margin: '8px 0 0',
  color: '#0f172a',
  fontSize: 24,
  fontWeight: 950,
}

const subtitleStyle: React.CSSProperties = {
  margin: '8px 0 0',
  color: '#475569',
  lineHeight: 1.65,
  fontWeight: 600,
}

const panelMetaStyle: React.CSSProperties = {
  color: '#475569',
  fontSize: 13,
  fontWeight: 700,
}

const feedbackStyle: React.CSSProperties = {
  borderRadius: 18,
  border: '1px solid #bae6fd',
  background: '#f0f9ff',
  color: '#075985',
  padding: '12px 14px',
  fontWeight: 700,
}

const pendingStyle: React.CSSProperties = {
  borderRadius: 18,
  border: '1px solid #dbe4ef',
  background: '#f8fafc',
  color: '#475569',
  padding: '12px 14px',
  fontWeight: 700,
}

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '340px 1fr',
  gap: 16,
  alignItems: 'start',
}

const formStyle: React.CSSProperties = {
  display: 'grid',
  gap: 10,
  borderRadius: 20,
  border: '1px solid #dbe4ef',
  padding: 16,
  background: '#f8fafc',
}

const formTitleStyle: React.CSSProperties = {
  color: '#0f172a',
  fontWeight: 900,
  marginBottom: 4,
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  borderRadius: 12,
  border: '1px solid #cbd5e1',
  padding: '10px 12px',
  background: '#fff',
  color: '#0f172a',
  fontWeight: 700,
}

const textareaStyle: React.CSSProperties = {
  width: '100%',
  minHeight: 110,
  borderRadius: 12,
  border: '1px solid #cbd5e1',
  padding: '10px 12px',
  background: '#fff',
  color: '#0f172a',
  fontWeight: 700,
  resize: 'vertical',
}

const primaryButtonStyle: React.CSSProperties = {
  border: '1px solid #0f172a',
  borderRadius: 14,
  padding: '10px 14px',
  background: '#0f172a',
  color: '#fff',
  fontWeight: 850,
  cursor: 'pointer',
}

const secondaryButtonStyle: React.CSSProperties = {
  border: '1px solid #cbd5e1',
  borderRadius: 14,
  padding: '10px 14px',
  background: '#fff',
  color: '#0f172a',
  textDecoration: 'none',
  fontWeight: 850,
  cursor: 'pointer',
}

const disabledButtonStyle: React.CSSProperties = {
  border: '1px dashed #cbd5e1',
  borderRadius: 14,
  padding: '10px 14px',
  background: '#f8fafc',
  color: '#94a3b8',
  fontWeight: 850,
  cursor: 'not-allowed',
}

const listStyle: React.CSSProperties = {
  display: 'grid',
  gap: 12,
}

const detailCardStyle: React.CSSProperties = {
  borderRadius: 20,
  border: '1px solid #dbe4ef',
  background: '#fff',
  padding: 16,
  display: 'grid',
  gap: 8,
}

const detailEyebrowStyle: React.CSSProperties = {
  color: '#2563eb',
  textTransform: 'uppercase',
  letterSpacing: 1,
  fontSize: 12,
  fontWeight: 900,
}

const detailTitleStyle: React.CSSProperties = {
  color: '#0f172a',
  fontSize: 20,
  fontWeight: 950,
}

const detailTextStyle: React.CSSProperties = {
  color: '#475569',
  lineHeight: 1.6,
  fontWeight: 600,
}

const detailMetaStyle: React.CSSProperties = {
  color: '#64748b',
  fontSize: 13,
  fontWeight: 700,
}

const detailActionsStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 10,
}

const tableShellStyle: React.CSSProperties = {
  display: 'grid',
  gap: 8,
}

const tableHeaderStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1.1fr 1.6fr 1fr 1fr 1fr',
  gap: 10,
  padding: '0 8px',
  color: '#64748b',
  fontSize: 12,
  fontWeight: 900,
  textTransform: 'uppercase',
  letterSpacing: 0.8,
}

const tableRowStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1.1fr 1.6fr 1fr 1fr 1fr',
  gap: 10,
  padding: 12,
  borderRadius: 18,
  border: '1px solid #dbe4ef',
  background: '#fff',
  alignItems: 'start',
}

const selectedRowStyle: React.CSSProperties = {
  border: '1px solid #93c5fd',
  background: '#eff6ff',
}

const cellStrongStyle: React.CSSProperties = {
  color: '#0f172a',
  fontWeight: 800,
}

const cellMutedStyle: React.CSSProperties = {
  color: '#64748b',
  fontSize: 12,
  fontWeight: 600,
}

const rowActionsStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
}

const rowLinkStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: 14,
  border: '1px solid #cbd5e1',
  padding: '10px 14px',
  background: '#fff',
  color: '#0f172a',
  textDecoration: 'none',
  fontWeight: 850,
}

const emptyStyle: React.CSSProperties = {
  borderRadius: 18,
  border: '1px dashed #cbd5e1',
  background: '#f8fafc',
  padding: 18,
  color: '#475569',
  fontWeight: 700,
}
