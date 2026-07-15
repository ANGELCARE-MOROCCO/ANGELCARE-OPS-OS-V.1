'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { Angelcare360DocumentTemplateListRecord } from '@/types/angelcare360/reports'

type Props = {
  schoolId: string
  templates: Angelcare360DocumentTemplateListRecord[]
}

export default function Angelcare360DocumentTemplatesWorkspace({ schoolId, templates }: Props) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function submitTemplate(formData: FormData, operation: 'create' | 'update') {
    setError(null)
    setSuccess(null)
    const payload = {
      entity: 'template',
      operation,
      payload: {
        schoolId,
        id: formData.get('id') || undefined,
        templateCode: String(formData.get('templateCode') || ''),
        label: String(formData.get('label') || ''),
        documentType: String(formData.get('documentType') || 'general'),
        outputFormat: String(formData.get('outputFormat') || 'pdf_a4'),
        description: String(formData.get('description') || ''),
        retentionDays: String(formData.get('retentionDays') || ''),
        status: String(formData.get('status') || 'draft'),
      },
    }
    const response = await fetch('/api/angelcare360/documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await response.json().catch(() => null)
    if (!response.ok || !data?.ok) {
      setError(data?.error || 'Impossible d’enregistrer le template documentaire.')
      return
    }
    setSuccess(operation === 'create' ? 'Template documentaire créé.' : 'Template documentaire mis à jour.')
    router.refresh()
  }

  return (
    <div style={stackStyle}>
      {error ? <div style={errorStyle}>{error}</div> : null}
      {success ? <div style={successStyle}>{success}</div> : null}

      <section style={cardStyle}>
        <h2 style={titleStyle}>Créer un template documentaire</h2>
        <form onSubmit={(event) => { event.preventDefault(); submitTemplate(new FormData(event.currentTarget), 'create') }} style={formGridStyle}>
          <Field label="Code template"><input name="templateCode" placeholder="DOC-TPL-001" style={inputStyle} /></Field>
          <Field label="Libellé"><input name="label" placeholder="Attestation d’inscription" style={inputStyle} /></Field>
          <Field label="Type document"><input name="documentType" defaultValue="general" style={inputStyle} /></Field>
          <Field label="Format">
            <select name="outputFormat" defaultValue="pdf_a4" style={inputStyle}>
              <option value="pdf_a4">PDF A4</option>
              <option value="csv">CSV</option>
              <option value="xlsx">XLSX</option>
              <option value="json">JSON</option>
              <option value="print_view">Vue imprimable</option>
            </select>
          </Field>
          <Field label="Rétention (jours)"><input name="retentionDays" type="number" min={0} defaultValue={0} style={inputStyle} /></Field>
          <Field label="Statut">
            <select name="status" defaultValue="draft" style={inputStyle}>
              <option value="draft">Brouillon</option>
              <option value="ready">Prêt</option>
              <option value="blocked_not_configured">Verrouillé</option>
              <option value="archived">Archivé</option>
            </select>
          </Field>
          <Field label="Description" full>
            <textarea name="description" placeholder="Décrivez l’usage du template" style={{ ...inputStyle, minHeight: 92 }} />
          </Field>
          <div style={fullRowStyle}>
            <button type="submit" style={primaryButtonStyle}>Créer le template</button>
          </div>
        </form>
      </section>

      {templates.length ? templates.map((template) => (
        <section key={template.id} style={cardStyle}>
          <details>
            <summary style={summaryStyle}>{template.label} · {template.status}</summary>
            <form onSubmit={(event) => { event.preventDefault(); submitTemplate(new FormData(event.currentTarget), 'update') }} style={{ ...formGridStyle, marginTop: 14 }}>
              <input type="hidden" name="id" value={template.id} />
              <Field label="Code template"><input name="templateCode" defaultValue={template.template_code} style={inputStyle} /></Field>
              <Field label="Libellé"><input name="label" defaultValue={template.label} style={inputStyle} /></Field>
              <Field label="Type document"><input name="documentType" defaultValue={template.document_type} style={inputStyle} /></Field>
              <Field label="Format">
                <select name="outputFormat" defaultValue={template.output_format} style={inputStyle}>
                  <option value="pdf_a4">PDF A4</option>
                  <option value="csv">CSV</option>
                  <option value="xlsx">XLSX</option>
                  <option value="json">JSON</option>
                  <option value="print_view">Vue imprimable</option>
                </select>
              </Field>
              <Field label="Rétention (jours)"><input name="retentionDays" type="number" min={0} defaultValue={template.retention_days ?? 0} style={inputStyle} /></Field>
              <Field label="Statut">
                <select name="status" defaultValue={template.status} style={inputStyle}>
                  <option value="draft">Brouillon</option>
                  <option value="ready">Prêt</option>
                  <option value="blocked_not_configured">Verrouillé</option>
                  <option value="archived">Archivé</option>
                </select>
              </Field>
              <Field label="Description" full>
                <textarea name="description" defaultValue={template.description || ''} style={{ ...inputStyle, minHeight: 92 }} />
              </Field>
              <div style={fullRowStyle}>
                <button type="submit" style={secondaryButtonStyle}>Mettre à jour</button>
              </div>
            </form>
          </details>
        </section>
      )) : <div style={emptyStyle}>Aucun template documentaire enregistré.</div>}
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
const summaryStyle: React.CSSProperties = { cursor: 'pointer', color: '#0f172a', fontWeight: 900 }
const errorStyle: React.CSSProperties = { padding: 14, borderRadius: 16, background: '#fef2f2', color: '#991b1b', fontWeight: 700 }
const successStyle: React.CSSProperties = { padding: 14, borderRadius: 16, background: '#f0fdf4', color: '#166534', fontWeight: 700 }
const emptyStyle: React.CSSProperties = { padding: 16, borderRadius: 18, border: '1px dashed #cbd5e1', color: '#475569', fontWeight: 700 }
