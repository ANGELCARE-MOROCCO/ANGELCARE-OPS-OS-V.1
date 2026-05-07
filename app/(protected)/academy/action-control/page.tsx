import Link from 'next/link'
import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { getAcademyData } from '../_data'
import { PageHeader, page } from '../_components/AcademyUI'

type AcademyData = Record<string, any>

const actionLinks = [
  { label: 'Command Center', href: '/academy/command-center', desc: 'Executive cockpit' },
  { label: 'Trainees', href: '/academy/trainees', desc: 'Learner records' },
  { label: 'Groups', href: '/academy/groups', desc: 'Class operations' },
  { label: 'Trainers', href: '/academy/trainers', desc: 'Instructor control' },
  { label: 'Attendance', href: '/academy/attendance', desc: 'Presence tracking' },
  { label: 'Payments', href: '/academy/payments', desc: 'Billing actions' },
  { label: 'Certificates', href: '/academy/certificates', desc: 'Certificate workflow' },
  { label: 'Partners', href: '/academy/partners', desc: 'Client/partner follow-up' },
]

function getCollectionCount(data: AcademyData, keys: string[]) {
  for (const key of keys) {
    const value = data?.[key]
    if (Array.isArray(value)) return value.length
    if (value && typeof value === 'object') return Object.keys(value).length
  }
  return 0
}

function AcademyActionNavigation() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
      {actionLinks.slice(0, 4).map((item) => (
        <Link
          key={item.href}
          href={item.href}
          style={{
            color: '#0f172a',
            background: '#ffffff',
            border: '1px solid #dbeafe',
            borderRadius: 999,
            padding: '10px 14px',
            fontWeight: 900,
            textDecoration: 'none',
            boxShadow: '0 10px 24px rgba(15,23,42,.08)',
          }}
        >
          {item.label}
        </Link>
      ))}
    </div>
  )
}

function AcademyActionMatrix({ data, path }: { data: AcademyData; path: string }) {
  const metrics = [
    {
      label: 'Trainees',
      value: getCollectionCount(data, ['trainees', 'students', 'learners']),
      href: '/academy/trainees',
      action: 'Review trainee pipeline',
    },
    {
      label: 'Groups',
      value: getCollectionCount(data, ['groups', 'cohorts', 'classes']),
      href: '/academy/groups',
      action: 'Open group operations',
    },
    {
      label: 'Trainers',
      value: getCollectionCount(data, ['trainers', 'instructors']),
      href: '/academy/trainers',
      action: 'Manage trainer capacity',
    },
    {
      label: 'Payments',
      value: getCollectionCount(data, ['payments', 'invoices', 'billing']),
      href: '/academy/payments',
      action: 'Control payment workflow',
    },
    {
      label: 'Attendance',
      value: getCollectionCount(data, ['attendance', 'sessions']),
      href: '/academy/attendance',
      action: 'Check attendance risk',
    },
    {
      label: 'Certificates',
      value: getCollectionCount(data, ['certificates']),
      href: '/academy/certificates',
      action: 'Issue and validate certificates',
    },
  ]

  const workflowCards = [
    {
      title: 'Today’s academy command queue',
      desc: 'Central execution board for trainees, trainers, groups, payments, certificates and alerts.',
      href: path,
      cta: 'Stay on action control',
    },
    {
      title: 'Training production flow',
      desc: 'Move from enrollment to attendance, assessment, certification and partner reporting.',
      href: '/academy/groups',
      cta: 'Open groups',
    },
    {
      title: 'Revenue and payment control',
      desc: 'Track paid, pending and blocked training payments before certificates are released.',
      href: '/academy/payments',
      cta: 'Open payments',
    },
    {
      title: 'Partner/client delivery',
      desc: 'Follow corporate training partners, delivery commitments and reporting outcomes.',
      href: '/academy/partners',
      cta: 'Open partners',
    },
  ]

  return (
    <div style={{ display: 'grid', gap: 22 }}>
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
        }}
      >
        {metrics.map((metric) => (
          <Link
            key={metric.label}
            href={metric.href}
            style={{
              display: 'block',
              padding: 20,
              borderRadius: 24,
              border: '1px solid #dbeafe',
              background: 'linear-gradient(135deg,#ffffff,#f8fbff)',
              color: '#0f172a',
              textDecoration: 'none',
              boxShadow: '0 18px 45px rgba(15,23,42,.08)',
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 900, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '.12em' }}>
              {metric.label}
            </div>
            <div style={{ marginTop: 10, fontSize: 34, fontWeight: 950, color: '#0f172a' }}>
              {metric.value}
            </div>
            <div style={{ marginTop: 8, fontSize: 14, lineHeight: 1.6, color: '#475569' }}>
              {metric.action}
            </div>
          </Link>
        ))}
      </section>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 16,
        }}
      >
        {workflowCards.map((card) => (
          <div
            key={card.title}
            style={{
              padding: 22,
              borderRadius: 28,
              border: '1px solid #e2e8f0',
              background: '#ffffff',
              boxShadow: '0 18px 50px rgba(15,23,42,.07)',
            }}
          >
            <h3 style={{ margin: 0, fontSize: 20, fontWeight: 950, color: '#0f172a' }}>{card.title}</h3>
            <p style={{ marginTop: 10, fontSize: 14, lineHeight: 1.7, color: '#475569' }}>{card.desc}</p>
            <Link
              href={card.href}
              style={{
                display: 'inline-flex',
                marginTop: 16,
                color: '#2563eb',
                fontWeight: 900,
                textDecoration: 'none',
              }}
            >
              {card.cta} →
            </Link>
          </div>
        ))}
      </section>
    </div>
  )
}

export default async function Page() {
  const data = await getAcademyData()

  return (
    <AppShell
      title="Academy Action Control"
      subtitle="Central production cockpit for real manager actions across trainees, payments, groups, trainers, partners, alerts and certificates."
      breadcrumbs={[{ label: 'Academy', href: '/academy' }, { label: 'Academy Action Control' }]}
      actions={
        <>
          <PageAction href="/academy">Academy Home</PageAction>
          <PageAction href="/academy/command-center" variant="light">Command Center</PageAction>
        </>
      }
    >
      <div style={page}>
        <PageHeader
          title="Academy Action Control"
          subtitle="Central production cockpit for real manager actions across trainees, payments, groups, trainers, partners, alerts and certificates."
          actions={<AcademyActionNavigation />}
        />
        <AcademyActionMatrix data={data} path="/academy/action-control" />
      </div>
    </AppShell>
  )
}