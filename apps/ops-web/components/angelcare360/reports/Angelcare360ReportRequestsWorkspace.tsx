'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { Angelcare360ReportCatalogueRecord, Angelcare360ReportRequestListRecord, Angelcare360ReportTemplateListRecord } from '@/types/angelcare360/reports'

type Props = {
  schoolId: string
  reports: Angelcare360ReportCatalogueRecord[]
  templates: Angelcare360ReportTemplateListRecord[]
  requests: Angelcare360ReportRequestListRecord[]
}

export default function Angelcare360ReportRequestsWorkspace({ schoolId, reports, templates, requests }: Props) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function submitRequest(formData: FormData, operation: 'create' | 'cancel') {
    setError(null)
    setSuccess(null)
    const payload = {
      entity: 'request',
      operation,
      payload: {
        schoolId,
        id: formData.get('id') || undefined,
        reportId: String(formData.get('reportId') || ''),
        reportTemplateId: String(formData.get('reportTemplateId') || ''),
        requestCode: String(formData.get('requestCode') || ''),
        moduleKey: String(formData.get('moduleKey') || 'rapports'),
        dateFrom: String(formData.get('dateFrom') || ''),
        dateTo: String(formData.get('dateTo') || ''),
        reason: String(formData.get('reason') || ''),
        status: String(formData.get('status') || 'requested'),
      },
    }
    const response = await fetch('/api/angelcare360/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await response.json().catch(() => null)
    if (!response.ok || !data?.ok) {
      setError(data?.error || 'Impossible d’enregistrer la demande.')
      return
    }
    setSuccess(operation === 'create' ? 'Demande créée.' : 'Demande annulée.')
    router.refresh()
  }

  return (
    <div style={stackStyle}>
      {error ? <div style={errorStyle}>{error}</div> : null}
      {success ? <div style={successStyle}>{success}</div> : null}

      <section style={cardStyle}>
        <h2 style={titleStyle}>Créer une demande de rapport</h2>
        <form onSubmit={(event) => { event.preventDefault(); submitRequest(new FormData(event.currentTarget), 'create') }} style={formGridStyle}>
          <Field label="Rapport catalogue">
            <select name="reportId" defaultValue={reports[0]?.id || ''} style={inputStyle}>
              {reports.map((report) => <option key={report.id} value={report.id}>{report.label}</option>)}
            </select>
          </Field>
          <Field label="Modèle">
            <select name="reportTemplateId" defaultValue={templates[0]?.id || ''} style={inputStyle}>
              <option value="">Aucun modèle</option>
              {templates.map((template) => <option key={template.id} value={template.id}>{template.label}</option>)}
            </select>
          </Field>
          <Field label="Code demande"><input name="requestCode" placeholder="REQ-RPT-001" style={inputStyle} /></Field>
          <Field label="Module"><input name="moduleKey" defaultValue="rapports" style={inputStyle} /></Field>
          <Field label="Début"><input name="dateFrom" type="date" style={inputStyle} /></Field>
          <Field label="Fin"><input name="dateTo" type="date" style={inputStyle} /></Field>
          <Field label="Statut">
            <select name="status" defaultValue="requested" style={inputStyle}>
              <option value="draft">Brouillon</option>
              <option value="requested">Demandé</option>
              <option value="processing_locked">Génération verrouillée</option>
              <option value="ready">Prêt</option>
              <option value="failed">Échec</option>
              <option value="cancelled">Annulé</option>
            </select>
          </Field>
          <Field label="Motif ou filtre" full>
            <textarea name="reason" placeholder="Indiquez un motif si nécessaire ou laissez vide" style={{ ...inputStyle, minHeight: 88 }} />
          </Field>
          <div style={fullRowStyle}>
            <button type="submit" style={primaryButtonStyle}>Créer la demande</button>
          </div>
        </form>
      </section>

      {requests.length ? requests.map((request) => (
        <section key={request.id} style={cardStyle}>
          <div style={rowStyle}>
            <div>
              <div style={eyebrowStyle}>{request.report_family || 'Rapport'}</div>
              <h3 style={requestTitleStyle}>{request.report_label || request.report_code}</h3>
              <p style={metaStyle}>{request.request_code}</p>
            </div>
            <span style={statusStyle}>{request.status}</span>
          </div>
          <div style={metaGridStyle}>
            <Info label="Modèle" value={request.template_label || 'Aucun'} />
            <Info label="Période" value={`${request.date_from || '—'} → ${request.date_to || '—'}`} />
            <Info label="Résultat" value={request.result_export_id ? 'Export lié' : 'Aucun résultat'} />
            <Info label="État" value={request.error_message || 'Aucune erreur'} />
          </div>
          {request.status !== 'cancelled' ? (
            <form onSubmit={(event) => { event.preventDefault(); submitRequest(new FormData(event.currentTarget), 'cancel') }} style={cancelRowStyle}>
              <input type="hidden" name="id" value={request.id} />
              <input type="hidden" name="reason" value="Annulé depuis le cockpit rapports." />
              <button type="submit" style={secondaryButtonStyle}>Annuler la demande</button>
            </form>
          ) : null}
        </section>
      )) : <div style={emptyStyle}>Aucune demande de rapport enregistrée.</div>}
    </div>
  )
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label style={full ? fullFieldStyle : fieldStyle}>
      <span style={labelStyle}>{label}</span>
      {children}
    </label>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div style={infoStyle}>
      <div style={infoLabelStyle}>{label}</div>
      <div style={infoValueStyle}>{value}</div>
    </div>
  )
}

const stackStyle: React.CSSProperties = { display: 'grid', gap: 14 }
const cardStyle: React.CSSProperties = { borderRadius: 24, border: '1px solid #dbe4ef', background: '#fff', padding: 18, boxShadow: '0 18px 54px rgba(15,23,42,.05)' }
const titleStyle: React.CSSProperties = { margin: 0, color: '#0f172a', fontSize: 18, fontWeight: 950 }
const formGridStyle: React.CSSProperties = { display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginTop: 14 }
const fieldStyle: React.CSSProperties = { display: 'grid', gap: 7 }
const fullFieldStyle: React.CSSProperties = { display: 'grid', gap: 7, gridColumn: '1 / -1' }
const labelStyle: React.CSSProperties = { color: '#64748b', fontSize: 12, fontWeight: 900, textTransform: 'uppercase', letterSpacing: .8 }
const inputStyle: React.CSSProperties = { borderRadius: 14, border: '1px solid #cbd5e1', padding: '11px 13px', fontSize: 14, color: '#0f172a', background: '#fff' }
const fullRowStyle: React.CSSProperties = { gridColumn: '1 / -1', display: 'flex', justifyContent: 'end' }
const primaryButtonStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', borderRadius: 14, border: '1px solid #0f172a', background: '#0f172a', color: '#fff', padding: '10px 14px', fontWeight: 900 }
const secondaryButtonStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', borderRadius: 14, border: '1px solid #cbd5e1', background: '#fff', color: '#0f172a', padding: '10px 14px', fontWeight: 900 }
const rowStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'start' }
const requestTitleStyle: React.CSSProperties = { margin: '6px 0 0', color: '#0f172a', fontSize: 18, fontWeight: 950 }
const eyebrowStyle: React.CSSProperties = { color: '#2563eb', fontSize: 12, fontWeight: 900, textTransform: 'uppercase', letterSpacing: .8 }
const metaStyle: React.CSSProperties = { margin: '6px 0 0', color: '#64748b', fontSize: 13, fontWeight: 700 }
const statusStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', borderRadius: 999, padding: '6px 10px', background: '#eff6ff', color: '#1d4ed8', fontSize: 12, fontWeight: 900 }
const metaGridStyle: React.CSSProperties = { display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', marginTop: 14 }
const infoStyle: React.CSSProperties = { borderRadius: 16, border: '1px solid #e2e8f0', padding: 12, background: '#f8fafc' }
const infoLabelStyle: React.CSSProperties = { color: '#64748b', fontSize: 12, textTransform: 'uppercase', letterSpacing: .7, fontWeight: 900 }
const infoValueStyle: React.CSSProperties = { marginTop: 6, color: '#0f172a', fontSize: 14, fontWeight: 700, lineHeight: 1.5 }
const cancelRowStyle: React.CSSProperties = { display: 'flex', justifyContent: 'end', marginTop: 12 }
const errorStyle: React.CSSProperties = { padding: 14, borderRadius: 16, background: '#fef2f2', color: '#991b1b', fontWeight: 700 }
const successStyle: React.CSSProperties = { padding: 14, borderRadius: 16, background: '#f0fdf4', color: '#166534', fontWeight: 700 }
const emptyStyle: React.CSSProperties = { padding: 16, borderRadius: 18, border: '1px dashed #cbd5e1', color: '#475569', fontWeight: 700 }
