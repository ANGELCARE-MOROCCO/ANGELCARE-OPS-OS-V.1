import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/session'
import {
  Badge,
  EmptyState,
  InsightCard,
  KpiCard,
  Panel,
  WorkspaceHero,
  formatCurrency,
  safeDate,
} from '../_components/BDWorkspacePrimitives'

export default async function BusinessDevelopmentWorkspace() {
  await requireRole(['ceo', 'manager'])
  const supabase = await createClient()

  const [{ data: prospects }, { data: campaigns }, { data: appointments }, { data: activities }] = await Promise.all([
    supabase.from('bd_prospects').select('*').order('created_at', { ascending: false }).limit(8),
    supabase.from('bd_campaigns').select('*').order('created_at', { ascending: false }).limit(6),
    supabase.from('bd_appointments').select('*').order('scheduled_at', { ascending: true }).limit(6),
    supabase.from('bd_activity_logs').select('*').order('created_at', { ascending: false }).limit(8),
  ])

  const allProspects = prospects || []
  const b2b = allProspects.filter((p: any) => p.segment === 'b2b').length
  const b2c = allProspects.filter((p: any) => p.segment === 'b2c').length
  const hot = allProspects.filter((p: any) => ['hot', 'qualified', 'proposal'].includes(p.status)).length
  const forecast = allProspects.reduce((sum: number, p: any) => sum + Number(p.estimated_value || 0), 0)

  return (
    <AppShell
      title="Business Development Workspace"
      subtitle="Hub corporate pour prospection B2C, B2B, partenariats, campagnes et exécution commerciale."
      breadcrumbs={[{ label: 'Revenue', href: '/revenue-command-center' }, { label: 'Business Development' }]}
      actions={
        <>
          <PageAction href="/revenue-command-center" variant="light">Retour RCC</PageAction>
          <PageAction href="/revenue-command-center/prospects">Prospects</PageAction>
        </>
      }
    >
      <div style={pageStyle}>
        <WorkspaceHero
          badge="BD Operating System"
          title="Market Domination Workspace"
          subtitle="Un espace de travail multidimensionnel pour cartographier le marché, organiser les bases prospects, piloter les campagnes, suivre les rendez-vous et transformer les opportunités en contrats."
          right={<div style={heroRightStyle}><strong>{formatCurrency(forecast)}</strong><span>Forecast potentiel immédiat</span></div>}
        />

        <section style={kpiGridStyle}>
          <KpiCard label="Prospects actifs" value={allProspects.length} sub="base de travail récente" tone="blue" />
          <KpiCard label="B2B" value={b2b} sub="institutions / entreprises" tone="purple" />
          <KpiCard label="B2C" value={b2c} sub="familles / particuliers" tone="green" />
          <KpiCard label="Hot / qualifiés" value={hot} sub="priorité closing" tone="amber" />
        </section>

        <section style={gridStyle}>
          <Panel title="Command Board" subtitle="Priorités exécutives du jour.">
            <div style={insightsStyle}>
              <InsightCard title="B2B Corporate Push" text="Construire chaque semaine une base ciblée d'écoles, crèches, cliniques, entreprises RH et partenaires prescripteurs." tone="purple" />
              <InsightCard title="B2C Premium Funnel" text="Segmenter les mamans par besoin: postpartum, garde enfant, besoins spécifiques, accompagnement école et programmes éducatifs." tone="green" />
              <InsightCard title="Discipline de suivi" text="Aucun prospect stratégique ne doit rester sans prochaine action, propriétaire, statut et historique CRM." tone="amber" />
            </div>
          </Panel>

          <Panel title="Campagnes actives" subtitle="Prospection structurée, loin du simple sponsoring social media.">
            {campaigns?.length ? (
              <div style={listStyle}>{campaigns.map((c: any) => <CardLine key={c.id} title={c.name} sub={`${c.channel || 'multi-channel'} • ${c.segment || 'global'}`} badge={c.status || 'draft'} />)}</div>
            ) : <EmptyState text="Aucune campagne BD structurée pour le moment." />}
          </Panel>
        </section>

        <section style={gridStyle}>
          <Panel title="Prochains rendez-vous" subtitle="Agenda commercial et partenariat.">
            {appointments?.length ? (
              <div style={listStyle}>{appointments.map((a: any) => <CardLine key={a.id} title={a.title} sub={`${safeDate(a.scheduled_at)} • ${a.location || 'Lieu à définir'}`} badge={a.status || 'scheduled'} />)}</div>
            ) : <EmptyState text="Aucun rendez-vous planifié." />}
          </Panel>

          <Panel title="Activité CRM récente" subtitle="Historique actions, commentaires et signaux.">
            {activities?.length ? (
              <div style={listStyle}>{activities.map((a: any) => <CardLine key={a.id} title={a.action_type || 'Action'} sub={a.note || 'Action enregistrée'} badge={safeDate(a.created_at)} />)}</div>
            ) : <EmptyState text="Aucune activité CRM récente." />}
          </Panel>
        </section>
      </div>
    </AppShell>
  )
}

function CardLine({ title, sub, badge }: { title: string; sub: string; badge: string }) {
  return <div style={cardLineStyle}><div><strong>{title}</strong><p>{sub}</p></div><Badge tone="blue">{badge}</Badge></div>
}

const pageStyle: React.CSSProperties = { display: 'grid', gap: 20 }
const kpiGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 14 }
const gridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, alignItems: 'start' }
const insightsStyle: React.CSSProperties = { display: 'grid', gap: 12 }
const listStyle: React.CSSProperties = { display: 'grid', gap: 10 }
const cardLineStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', padding: 14, borderRadius: 18, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#0f172a' }
const heroRightStyle: React.CSSProperties = { display: 'grid', gap: 5, padding: 20, minWidth: 260, borderRadius: 26, background: 'rgba(255,255,255,.10)', border: '1px solid rgba(255,255,255,.16)' }
