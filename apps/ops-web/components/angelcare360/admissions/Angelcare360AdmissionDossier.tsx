'use client'

import Link from 'next/link'
import type { Angelcare360AdmissionApplicationListRecord, Angelcare360AdmissionConversionChecklistItem } from '@/types/angelcare360/admissions'

type Angelcare360AdmissionDossierProps = {
  application: Angelcare360AdmissionApplicationListRecord & {
    status_history?: Array<Record<string, unknown>>
    document_submissions?: Array<Record<string, unknown>>
    latest_audit_events?: Array<Record<string, unknown>>
  }
  checklist?: Angelcare360AdmissionConversionChecklistItem[] | null
}

export default function Angelcare360AdmissionDossier({ application, checklist }: Angelcare360AdmissionDossierProps) {
  return (
    <section style={shellStyle}>
      <article style={summaryStyle}>
        <div style={badgeStyle}>Dossier d’admission</div>
        <h2 style={titleStyle}>{application.child_first_name || application.lead_student_full_name || 'Dossier sans identité'}</h2>
        <p style={subtitleStyle}>{application.parent_first_name || application.lead_parent_name || application.phone || application.email || 'Parent non identifié'}</p>
        <div style={metaGridStyle}>
          <div style={metaCardStyle}><div style={metaLabelStyle}>Statut</div><div style={metaValueStyle}>{application.status}</div></div>
          <div style={metaCardStyle}><div style={metaLabelStyle}>Étape</div><div style={metaValueStyle}>{application.application_stage}</div></div>
          <div style={metaCardStyle}><div style={metaLabelStyle}>Classe</div><div style={metaValueStyle}>{application.class_name || '—'}</div></div>
          <div style={metaCardStyle}><div style={metaLabelStyle}>Section</div><div style={metaValueStyle}>{application.section_name || '—'}</div></div>
        </div>
      </article>

      <article style={sectionStyle}>
        <div style={sectionTitleStyle}>Identité pré-dossier</div>
        <div style={infoGridStyle}>
          <div><span style={infoLabelStyle}>Enfant</span><div style={infoValueStyle}>{[application.child_first_name, application.child_last_name].filter(Boolean).join(' ') || application.lead_student_full_name || '—'}</div></div>
          <div><span style={infoLabelStyle}>Naissance</span><div style={infoValueStyle}>{application.child_date_of_birth ? new Date(application.child_date_of_birth).toLocaleDateString('fr-FR') : '—'}</div></div>
          <div><span style={infoLabelStyle}>Parent</span><div style={infoValueStyle}>{[application.parent_first_name, application.parent_last_name].filter(Boolean).join(' ') || application.lead_parent_name || '—'}</div></div>
          <div><span style={infoLabelStyle}>Coordonnées</span><div style={infoValueStyle}>{application.phone || application.email || '—'}</div></div>
        </div>
      </article>

      <article style={sectionStyle}>
        <div style={sectionTitleStyle}>Vérification des pièces</div>
        <div style={docGridStyle}>
          {(application.document_count || 0) > 0 ? (
            <div style={positiveStyle}>{application.document_count} document(s) lié(s) au dossier.</div>
          ) : (
            <div style={warningStyle}>Aucun document associé pour le moment.</div>
          )}
          {(application.missing_document_count || 0) > 0 ? (
            <div style={warningStyle}>{application.missing_document_count} pièce(s) manquante(s).</div>
          ) : (
            <div style={positiveStyle}>Aucune pièce manquante détectée.</div>
          )}
        </div>
        {checklist ? (
          <div style={checklistGridStyle}>
            {checklist.map((item) => (
              <div key={item.key} style={checkItemStyle}>
                <div style={checkTitleStyle}>{item.label}</div>
                <div style={checkTextStyle}>{item.explanation}</div>
              </div>
            ))}
          </div>
        ) : null}
      </article>

      <article style={sectionStyle}>
        <div style={sectionTitleStyle}>Suivi et conversion</div>
        <div style={listStyle}>
          {application.next_action ? <div style={listItemStyle}><span style={infoLabelStyle}>Prochaine action</span><div style={infoValueStyle}>{application.next_action}</div></div> : <div style={emptyStyle}>Aucune prochaine action configurée.</div>}
          {application.next_action_at ? <div style={listItemStyle}><span style={infoLabelStyle}>Échéance</span><div style={infoValueStyle}>{new Date(application.next_action_at).toLocaleString('fr-FR')}</div></div> : null}
          {application.decision_status ? <div style={listItemStyle}><span style={infoLabelStyle}>Décision</span><div style={infoValueStyle}>{application.decision_status}</div></div> : null}
          {application.converted_at ? <div style={positiveStyle}>Dossier converti le {new Date(application.converted_at).toLocaleString('fr-FR')}.</div> : null}
        </div>
        <div style={lockedTabsStyle}>
          <Link href="#" style={lockedTabStyle} aria-disabled="true" onClick={(event) => event.preventDefault()}>
            Finance verrouillée
          </Link>
          <Link href="#" style={lockedTabStyle} aria-disabled="true" onClick={(event) => event.preventDefault()}>
            Transport verrouillé
          </Link>
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

const docGridStyle: React.CSSProperties = {
  display: 'grid',
  gap: 10,
}

const positiveStyle: React.CSSProperties = {
  borderRadius: 16,
  background: '#dcfce7',
  border: '1px solid #bbf7d0',
  color: '#166534',
  padding: '10px 12px',
  fontWeight: 700,
  lineHeight: 1.55,
}

const warningStyle: React.CSSProperties = {
  borderRadius: 16,
  background: '#fff7ed',
  border: '1px solid #fed7aa',
  color: '#9a3412',
  padding: '10px 12px',
  fontWeight: 700,
  lineHeight: 1.55,
}

const checklistGridStyle: React.CSSProperties = {
  display: 'grid',
  gap: 10,
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
}

const checkItemStyle: React.CSSProperties = {
  borderRadius: 16,
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  padding: 12,
  display: 'grid',
  gap: 6,
}

const checkTitleStyle: React.CSSProperties = {
  color: '#0f172a',
  fontWeight: 850,
}

const checkTextStyle: React.CSSProperties = {
  color: '#475569',
  fontSize: 13,
  lineHeight: 1.5,
  fontWeight: 600,
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
}

const emptyStyle: React.CSSProperties = {
  borderRadius: 16,
  border: '1px dashed #cbd5e1',
  background: '#f8fafc',
  padding: 14,
  color: '#64748b',
  fontWeight: 600,
}

const lockedTabsStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 10,
}

const lockedTabStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: 14,
  padding: '10px 14px',
  background: '#f8fafc',
  border: '1px dashed #cbd5e1',
  color: '#94a3b8',
  textDecoration: 'none',
  fontWeight: 800,
}

