import Link from 'next/link'
import { DOCUMENT_CATALOG, EXPORT_REASONS, getCategoryLabel, type AcademyDocumentTemplate } from '../_lib/documentCatalog'

export function DocumentExportCenter({ counts }: { counts: { templates: number; exports: number; audit: number } }) {
  const categories = Array.from(new Set(DOCUMENT_CATALOG.map((doc) => doc.category)))

  return (
    <div style={page}>
      <section style={hero}>
        <div>
          <div style={eyebrow}>ACADEMY DOCUMENT GOVERNANCE</div>
          <h1 style={title}>Controlled Reports & PDF-Ready Documentation Center</h1>
          <p style={lead}>Generate ISO-style controlled documents with reference numbers, export purposes, filters, author traceability and audit governance.</p>
        </div>
        <div style={heroGrid}>
          <Metric label="Templates" value={counts.templates} />
          <Metric label="Exports" value={counts.exports} />
          <Metric label="Audit logs" value={counts.audit} />
        </div>
      </section>

      <section style={policyGrid}>
        <Policy title="Reference governance" text="Every PDF-ready export receives a controlled ACAD reference using category code, year and sequence." />
        <Policy title="Export reason required" text="Managers must select a predefined purpose before export. Other requires a note." />
        <Policy title="Audit-ready traceability" text="Document exports are logged with actor, filters, reason, time and entity reference." />
      </section>

      {categories.map((category) => (
        <section key={category} style={panel}>
          <div style={sectionHead}>
            <div>
              <h2 style={sectionTitle}>{getCategoryLabel(category)}</h2>
              <p style={sectionText}>Controlled templates available for this Academy governance area.</p>
            </div>
            <span style={countBadge}>{DOCUMENT_CATALOG.filter((d) => d.category === category).length} templates</span>
          </div>
          <div style={catalogGrid}>
            {DOCUMENT_CATALOG.filter((doc) => doc.category === category).map((doc) => <DocumentCard key={doc.type} doc={doc} />)}
          </div>
        </section>
      ))}
    </div>
  )
}

export function DocumentCard({ doc }: { doc: AcademyDocumentTemplate }) {
  return (
    <Link href={`/academy/documents/export?type=${doc.type}`} style={card}>
      <div style={cardTop}>
        <span style={codeBadge}>{doc.code}</span>
        <span style={confBadge}>{doc.confidentiality}</span>
      </div>
      <h3 style={cardTitle}>{doc.title}</h3>
      <p style={cardText}>{doc.description}</p>
      <div style={miniList}>{doc.sections.slice(0, 4).map((s) => <span key={s}>✓ {s}</span>)}</div>
      <strong style={action}>Configure export →</strong>
    </Link>
  )
}

export function ExportReasonForm({ type, defaultReason }: { type: string; defaultReason?: string }) {
  return (
    <div style={formPanel}>
      <h2 style={sectionTitle}>Export governance configuration</h2>
      <p style={sectionText}>Before generating the document, select the operational purpose and filters. This will be saved in the export log.</p>
      <input type="hidden" name="type" value={type} />
      <div style={formGrid}>
        <label style={field}>Export reason<select name="reason" defaultValue={defaultReason || ''} required style={input}><option value="">Select reason</option>{EXPORT_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}</select></label>
        <label style={field}>Start<input name="start" type="datetime-local" style={input} /></label>
        <label style={field}>End<input name="end" type="datetime-local" style={input} /></label>
        <label style={field}>City / cities<input name="city" placeholder="Rabat, Casa, Kénitra..." style={input} /></label>
        <label style={field}>Service(s)<input name="service" placeholder="Postpartum, childcare, academy..." style={input} /></label>
        <label style={field}>Trainee ID<input name="trainee_id" placeholder="Optional" style={input} /></label>
        <label style={field}>Trainer ID<input name="trainer_id" placeholder="Optional" style={input} /></label>
        <label style={field}>Group ID<input name="group_id" placeholder="Optional" style={input} /></label>
        <label style={field}>Course ID<input name="course_id" placeholder="Optional" style={input} /></label>
        <label style={field}>Partner ID<input name="partner_id" placeholder="Optional" style={input} /></label>
      </div>
      <label style={field}>Purpose note / governance comment<textarea name="reason_note" placeholder="Required if reason is Other. Recommended for audit-sensitive exports." style={{ ...input, minHeight: 86 }} /></label>
      <button style={primaryButton}>Generate controlled PDF-ready document</button>
    </div>
  )
}

export function PrintReadyCorporateDocument({ children, title, subtitle, reference, meta }: { children: React.ReactNode; title: string; subtitle: string; reference: string; meta: Array<[string, string]> }) {
  return (
    <main style={docPage}>
      <style>{`@media print { .no-print { display: none !important; } body { background: #fff !important; } }`}</style>
      <div className="no-print" style={printToolbar}>
        <Link href="/academy/documents" style={backButton}>← Documents center</Link>
        <button onClick={undefined as any} style={printButton}>Use browser Print / Save PDF</button>
      </div>
      <section style={docHeader}>
        <div>
          <div style={docBrand}>ANGELCARE ACADEMY · CONTROLLED DOCUMENT</div>
          <h1 style={docTitle}>{title}</h1>
          <p style={docSubtitle}>{subtitle}</p>
        </div>
        <div style={refBox}><span>Reference</span><strong>{reference}</strong></div>
      </section>
      <section style={metaGrid}>{meta.map(([k, v]) => <div key={k} style={metaCard}><span>{k}</span><strong>{v || '—'}</strong></div>)}</section>
      {children}
      <footer style={footer}>AngelCare Academy · Confidential controlled record · Generated through OpsOS Document Governance Layer</footer>
    </main>
  )
}

function Metric({ label, value }: { label: string; value: number | string }) { return <div style={metric}><span>{label}</span><strong>{value}</strong></div> }
function Policy({ title, text }: { title: string; text: string }) { return <div style={policy}><strong>{title}</strong><span>{text}</span></div> }

const page: React.CSSProperties = { display: 'grid', gap: 20 }
const hero: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1.4fr .8fr', gap: 20, padding: 32, borderRadius: 34, color: '#fff', background: 'radial-gradient(circle at top left,#1d4ed8,#020617 62%)', boxShadow: '0 34px 90px rgba(2,6,23,.36)', overflow: 'hidden' }
const eyebrow: React.CSSProperties = { color: '#bfdbfe', fontWeight: 950, fontSize: 12, letterSpacing: 1.2 }
const title: React.CSSProperties = { margin: '12px 0 10px', fontSize: 42, lineHeight: 1.02, fontWeight: 1000, letterSpacing: -1 }
const lead: React.CSSProperties = { color: 'rgba(255,255,255,.86)', fontWeight: 800, lineHeight: 1.6, maxWidth: 760 }
const heroGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr', gap: 12 }
const metric: React.CSSProperties = { padding: 18, borderRadius: 22, background: 'rgba(255,255,255,.11)', border: '1px solid rgba(255,255,255,.18)', display: 'grid', gap: 5 }
const policyGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }
const policy: React.CSSProperties = { padding: 18, borderRadius: 22, background: '#fff', border: '1px solid #dbe3ee', display: 'grid', gap: 6, color: '#0f172a', boxShadow: '0 18px 38px rgba(15,23,42,.05)' }
const panel: React.CSSProperties = { padding: 22, borderRadius: 28, background: '#fff', border: '1px solid #dbe3ee', boxShadow: '0 18px 38px rgba(15,23,42,.06)' }
const sectionHead: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 18, alignItems: 'start', marginBottom: 16 }
const sectionTitle: React.CSSProperties = { margin: 0, color: '#0f172a', fontSize: 23, fontWeight: 1000 }
const sectionText: React.CSSProperties = { margin: '7px 0 0', color: '#64748b', fontWeight: 750, lineHeight: 1.55 }
const countBadge: React.CSSProperties = { padding: '8px 11px', borderRadius: 999, background: '#eef2ff', color: '#3730a3', fontWeight: 950, fontSize: 12 }
const catalogGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 14 }
const card: React.CSSProperties = { display: 'grid', gap: 10, textDecoration: 'none', color: '#0f172a', padding: 18, borderRadius: 22, border: '1px solid #e2e8f0', background: 'linear-gradient(180deg,#fff,#f8fafc)', minHeight: 230 }
const cardTop: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 8 }
const codeBadge: React.CSSProperties = { padding: '6px 9px', borderRadius: 999, background: '#0f172a', color: '#fff', fontSize: 11, fontWeight: 950 }
const confBadge: React.CSSProperties = { padding: '6px 9px', borderRadius: 999, background: '#f1f5f9', color: '#475569', fontSize: 11, fontWeight: 900, textTransform: 'uppercase' }
const cardTitle: React.CSSProperties = { margin: 0, fontSize: 17, fontWeight: 1000 }
const cardText: React.CSSProperties = { margin: 0, color: '#64748b', fontSize: 13, fontWeight: 750, lineHeight: 1.5 }
const miniList: React.CSSProperties = { display: 'grid', gap: 4, color: '#334155', fontSize: 12, fontWeight: 800 }
const action: React.CSSProperties = { color: '#1d4ed8', fontSize: 13 }
const formPanel: React.CSSProperties = { display: 'grid', gap: 16, padding: 22, borderRadius: 28, background: '#fff', border: '1px solid #dbe3ee', boxShadow: '0 18px 38px rgba(15,23,42,.06)' }
const formGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 12 }
const field: React.CSSProperties = { display: 'grid', gap: 7, color: '#334155', fontWeight: 900, fontSize: 13 }
const input: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '12px 13px', borderRadius: 14, border: '1px solid #cbd5e1', background: '#f8fafc', color: '#0f172a' }
const primaryButton: React.CSSProperties = { border: 'none', borderRadius: 16, padding: '14px 18px', background: '#0f172a', color: '#fff', fontWeight: 1000, cursor: 'pointer' }
const docPage: React.CSSProperties = { display: 'grid', gap: 18, padding: 32, background: '#f8fafc', color: '#0f172a', fontFamily: 'Inter, Arial, sans-serif' }
const printToolbar: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }
const backButton: React.CSSProperties = { color: '#1d4ed8', fontWeight: 900, textDecoration: 'none' }
const printButton: React.CSSProperties = { padding: '12px 16px', borderRadius: 14, border: 'none', background: '#1d4ed8', color: '#fff', fontWeight: 950 }
const docHeader: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 22, padding: 28, borderRadius: 26, background: '#fff', border: '1px solid #dbe3ee' }
const docBrand: React.CSSProperties = { color: '#1d4ed8', fontWeight: 1000, letterSpacing: 1.1, fontSize: 12 }
const docTitle: React.CSSProperties = { margin: '10px 0 8px', fontSize: 34, lineHeight: 1.08, fontWeight: 1000 }
const docSubtitle: React.CSSProperties = { margin: 0, color: '#64748b', fontWeight: 750, lineHeight: 1.55 }
const refBox: React.CSSProperties = { minWidth: 260, padding: 18, borderRadius: 20, background: '#0f172a', color: '#fff', display: 'grid', gap: 6, alignSelf: 'start' }
const metaGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 12 }
const metaCard: React.CSSProperties = { padding: 14, borderRadius: 18, border: '1px solid #dbe3ee', background: '#fff', display: 'grid', gap: 5 }
const footer: React.CSSProperties = { padding: 14, color: '#64748b', fontWeight: 800, textAlign: 'center', borderTop: '1px solid #e2e8f0' }
