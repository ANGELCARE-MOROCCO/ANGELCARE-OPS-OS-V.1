'use client'

import Link from 'next/link'
import type { Angelcare360AdmissionsOverviewRecord } from '@/types/angelcare360/admissions'
import Angelcare360AdmissionsRiskPanel from './Angelcare360AdmissionsRiskPanel'
import Angelcare360SuccessState from '@/components/angelcare360/states/Angelcare360SuccessState'

type Angelcare360AdmissionsHubProps = {
  overview: Angelcare360AdmissionsOverviewRecord
}

export default function Angelcare360AdmissionsHub({ overview }: Angelcare360AdmissionsHubProps) {
  const kpis = [
    { label: 'Demandes', value: overview.leadCount, note: 'Demandes d’inscription recensées.' },
    { label: 'Nouvelles', value: overview.newLeadCount, note: 'Demandes à traiter en priorité.' },
    { label: 'Dossiers ouverts', value: overview.openApplicationCount, note: 'Applications actives.' },
    { label: 'Pièces manquantes', value: overview.missingDocumentApplicationCount, note: 'Dossiers incomplets.' },
    { label: 'Entretiens prêts', value: overview.interviewReadyCount, note: 'Suivis à planifier.' },
    { label: 'Convertibles', value: overview.conversionReadyCount, note: 'Acceptés et prêts à convertir.' },
    { label: 'Convertis', value: overview.convertedCount, note: 'Dossiers transférés au socle personnes.' },
    { label: 'Refus/archives', value: overview.archivedOrRefusedCount, note: 'Dossiers fermés.' },
  ]

  return (
    <section style={shellStyle}>
      <section style={heroStyle}>
        <div>
          <div style={eyebrowStyle}>Admissions & Inscriptions</div>
          <h1 style={titleStyle}>Cockpit admissions</h1>
          <p style={subtitleStyle}>
            Le flux reçoit les demandes, suit les pièces, prépare les décisions et convertit les dossiers acceptés vers les dossiers personnes sans doublons.
          </p>
        </div>
        <div style={actionRowStyle}>
          <Link href="/angelcare-360-command-center/admissions/demandes" style={primaryLinkStyle}>
            Créer une demande
          </Link>
          <Link href="/angelcare-360-command-center/admissions/dossiers" style={secondaryLinkStyle}>
            Créer un dossier
          </Link>
        </div>
      </section>

      <Angelcare360SuccessState
        title={overview.setupReadiness.academicYearReady ? 'Admissions prêtes à être opérées' : 'Configuration admissions incomplète'}
        description={overview.setupReadiness.academicYearReady
          ? 'L’année scolaire active et la structure de base sont résolues.'
          : 'Une année scolaire active doit être configurée pour opérer le flux admissions.'}
      />

      <section style={kpiGridStyle}>
        {kpis.map((item) => (
          <article key={item.label} style={kpiCardStyle}>
            <div style={kpiLabelStyle}>{item.label}</div>
            <div style={kpiValueStyle}>{item.value}</div>
            <div style={kpiNoteStyle}>{item.note}</div>
          </article>
        ))}
      </section>

      <section style={quickAccessStyle}>
        <div style={panelTitleStyle}>Accès rapides</div>
        <div style={quickGridStyle}>
          {[
            { href: '/angelcare-360-command-center/admissions/pipeline', label: 'Pipeline', note: 'Vue Kanban des étapes.' },
            { href: '/angelcare-360-command-center/admissions/demandes', label: 'Demandes', note: 'Leads et qualification.' },
            { href: '/angelcare-360-command-center/admissions/dossiers', label: 'Dossiers', note: 'Applications et décisions.' },
            { href: '/angelcare-360-command-center/admissions/documents', label: 'Documents', note: 'Référentiel des pièces.' },
            { href: '/angelcare-360-command-center/admissions/entretiens', label: 'Suivis', note: 'Prochaines actions.' },
            { href: '/angelcare-360-command-center/admissions/conversions', label: 'Conversions', note: 'Checklist et transfert.' },
            { href: '/angelcare-360-command-center/admissions/audit', label: 'Audit', note: 'Traçabilité de sécurité.' },
          ].map((item) => (
            <Link key={item.href} href={item.href} style={quickLinkStyle}>
              <span style={quickLinkLabelStyle}>{item.label}</span>
              <span style={quickLinkNoteStyle}>{item.note}</span>
            </Link>
          ))}
        </div>
      </section>

      <Angelcare360AdmissionsRiskPanel risks={overview.risks} setupReadiness={overview.setupReadiness} />
    </section>
  )
}

const shellStyle: React.CSSProperties = {
  display: 'grid',
  gap: 16,
}

const heroStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  alignItems: 'start',
  flexWrap: 'wrap',
  borderRadius: 24,
  border: '1px solid #dbe4ef',
  background: '#fff',
  padding: 20,
  boxShadow: '0 18px 54px rgba(15,23,42,.05)',
}

const eyebrowStyle: React.CSSProperties = {
  color: '#2563eb',
  textTransform: 'uppercase',
  letterSpacing: 1.1,
  fontSize: 12,
  fontWeight: 900,
}

const titleStyle: React.CSSProperties = {
  margin: '8px 0 0',
  color: '#0f172a',
  fontSize: 28,
  fontWeight: 950,
}

const subtitleStyle: React.CSSProperties = {
  margin: '10px 0 0',
  color: '#475569',
  lineHeight: 1.65,
  fontWeight: 600,
  maxWidth: 920,
}

const actionRowStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 10,
}

const primaryLinkStyle: React.CSSProperties = {
  border: '1px solid #0f172a',
  borderRadius: 14,
  padding: '11px 14px',
  background: '#0f172a',
  color: '#fff',
  textDecoration: 'none',
  fontWeight: 800,
}

const secondaryLinkStyle: React.CSSProperties = {
  border: '1px solid #cbd5e1',
  borderRadius: 14,
  padding: '11px 14px',
  background: '#fff',
  color: '#0f172a',
  textDecoration: 'none',
  fontWeight: 800,
}

const kpiGridStyle: React.CSSProperties = {
  display: 'grid',
  gap: 12,
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
}

const kpiCardStyle: React.CSSProperties = {
  borderRadius: 20,
  border: '1px solid #dbe4ef',
  background: '#fff',
  padding: 16,
  boxShadow: '0 18px 54px rgba(15,23,42,.05)',
}

const kpiLabelStyle: React.CSSProperties = {
  color: '#64748b',
  fontSize: 12,
  textTransform: 'uppercase',
  letterSpacing: 1,
  fontWeight: 900,
}

const kpiValueStyle: React.CSSProperties = {
  marginTop: 10,
  color: '#0f172a',
  fontSize: 24,
  lineHeight: 1.1,
  fontWeight: 950,
}

const kpiNoteStyle: React.CSSProperties = {
  marginTop: 8,
  color: '#475569',
  lineHeight: 1.55,
  fontWeight: 600,
}

const quickAccessStyle: React.CSSProperties = {
  borderRadius: 22,
  border: '1px solid #dbe4ef',
  background: '#fff',
  padding: 18,
  boxShadow: '0 18px 54px rgba(15,23,42,.05)',
}

const panelTitleStyle: React.CSSProperties = {
  color: '#0f172a',
  fontSize: 14,
  fontWeight: 900,
  textTransform: 'uppercase',
  letterSpacing: 1,
}

const quickGridStyle: React.CSSProperties = {
  marginTop: 12,
  display: 'grid',
  gap: 10,
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
}

const quickLinkStyle: React.CSSProperties = {
  display: 'grid',
  gap: 6,
  borderRadius: 18,
  border: '1px solid #dbe4ef',
  background: '#f8fafc',
  padding: 14,
  textDecoration: 'none',
}

const quickLinkLabelStyle: React.CSSProperties = {
  color: '#0f172a',
  fontSize: 14,
  fontWeight: 900,
}

const quickLinkNoteStyle: React.CSSProperties = {
  color: '#64748b',
  fontSize: 12,
  lineHeight: 1.5,
  fontWeight: 600,
}

