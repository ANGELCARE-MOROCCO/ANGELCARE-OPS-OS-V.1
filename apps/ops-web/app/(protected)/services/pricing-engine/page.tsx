import AppShell from '@/app/components/erp/AppShell'
import { calculateServicePrice, getServiceBlueprints, getServiceModules, getServiceRules } from '@/lib/service-os'
import { CommandRail, DarkRailCard, Kpi, KpiGrid, LightRailCard, MiniStat, Panel, ReviewRow, SecondaryAction, Services360Hero, Services360Nav, SourceBadge, StatPill, styles } from '@/components/service-os/Services360UI'

function array<T = any>(value: unknown): T[] { return Array.isArray(value) ? value as T[] : [] }
function number(value: unknown, fallback = 0) { return typeof value === 'number' && Number.isFinite(value) ? value : fallback }
function money(value: unknown) { return `${Math.round(number(value)).toLocaleString('fr-FR')} Dh` }

export default function Page() {
  const blueprints = array<any>(getServiceBlueprints())
  const modules = array<any>(getServiceModules())
  const rules = array<any>(getServiceRules())
  const calculated: any = calculateServicePrice({ blueprintId: 'S.H', city: 'Casablanca', urgent: true, night: false, transport: true, specialNeeds: true, complexity: 'high' })
  const base = number(calculated.basePrice, number(calculated.base, 450))
  const modifiers = array<any>(calculated.modifiers).map((item, index) => ({ label: String(item?.label || `Modifier ${index + 1}`), amount: number(item?.amount) }))
  const total = number(calculated.totalMad, number(calculated.total, base + modifiers.reduce((sum, item) => sum + item.amount, 0)))
  const margin = number(calculated.marginMad, Math.round(total * .35))
  const nav = [{ label: 'Scenario', href: '#scenario' }, { label: 'Modifiers', href: '#modifiers' }, { label: 'Architecture', href: '#architecture' }, { label: 'Evidence', href: '#evidence' }]

  return <AppShell title="Pricing Simulation & Governance" subtitle="ServiceOS pricing decision-support environment" breadcrumbs={[{ label: 'Services', href: '/services' }, { label: 'Pricing Engine' }]}>
    <main className={styles.shell}>
      <Services360Hero eyebrow="Pricing simulation engine" title="Explain the price before asking the business to trust it." subtitle="A transparent ServiceOS scenario showing base price, applied modifiers, total and margin context. This page remains a simulation workspace and does not persist, approve or invoice a price." actions={<><SecondaryAction href="/services">Service portfolio</SecondaryAction><SecondaryAction href="/services/commercial">Commercial engine</SecondaryAction></>} briefTitle="Scenario: Casablanca special-needs service" briefRows={[{ label: 'Base', value: money(base) }, { label: 'Modifiers', value: modifiers.length }, { label: 'Scenario total', value: money(total) }, { label: 'Margin context', value: money(margin) }, { label: 'Execution', value: 'Simulation only' }]} provenance={[{ label: 'Shared ServiceOS pricing engine', tone: 'simulation' }, { label: 'No persisted price created', tone: 'configured' }]} />
      <Services360Nav items={nav} />
      <KpiGrid><Kpi label="Blueprints" value={blueprints.length} helper="Service architectures available to the engine" /><Kpi label="Modules" value={modules.length} helper="Attachable offer and delivery layers" /><Kpi label="Rules" value={rules.length} helper="Pricing and operational controls" /><Kpi label="Base" value={money(base)} helper="Scenario starting point" /><Kpi label="Total" value={money(total)} helper="Calculated simulation" /><Kpi label="Margin" value={money(margin)} helper="Planning context, not accounting approval" /></KpiGrid>
      <div className={styles.grid2}>
        <div style={{ display: 'grid', gap: 18 }}>
          <Panel id="scenario" eyebrow="Scenario passport" title="Casablanca · urgent · special needs · transport" text="The current shared engine receives the supported pricing inputs shown below. The 5-hour duration remains scenario context only because the existing engine does not accept a duration input.">
            <div className={styles.grid4}><MiniStat label="City" value="Casablanca" /><MiniStat label="Urgency" value="Urgent" /><MiniStat label="Complexity" value="High" /><MiniStat label="Duration context" value="5 hours · not priced" /></div>
            <div className={styles.sourceStrip}><StatPill tone="warn">Special needs</StatPill><StatPill tone="warn">Transport included</StatPill><StatPill tone="good">Human review required</StatPill></div>
          </Panel>
          <Panel id="modifiers" eyebrow="Price composition" title="Applied modifiers" text="Every component remains visible instead of presenting an opaque final number.">
            <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Component</th><th>Amount</th><th>Interpretation</th></tr></thead><tbody><tr><td><strong>Base service estimate</strong></td><td>{money(base)}</td><td>Blueprint / engine base</td></tr>{modifiers.map((item) => <tr key={item.label}><td><strong>{item.label}</strong></td><td>{item.amount >= 0 ? '+' : ''}{money(item.amount)}</td><td>Configured pricing modifier</td></tr>)}<tr><td><strong>Final scenario</strong></td><td><strong>{money(total)}</strong></td><td>Simulation result</td></tr></tbody></table></div>
          </Panel>
          <Panel id="architecture" eyebrow="Commercial governance" title="What this engine does—and does not do" text="The premium interface makes authority boundaries explicit.">
            <div className={styles.grid3}>
              <article className={styles.card}><div className={styles.cardCode}>CALCULATES</div><h4 className={styles.cardTitle}>Scenario price</h4><div className={styles.cardText}>Combines base, complexity, urgency, transport and other configured modifiers.</div></article>
              <article className={styles.card}><div className={styles.cardCode}>EXPLAINS</div><h4 className={styles.cardTitle}>Price composition</h4><div className={styles.cardText}>Shows the inputs and modifiers used by the shared engine.</div></article>
              <article className={styles.card}><div className={styles.cardCode}>DOES NOT EXECUTE</div><h4 className={styles.cardTitle}>No financial commitment</h4><div className={styles.cardText}>It does not create a quote, contract, invoice, payment or external promise.</div></article>
            </div>
          </Panel>
          <Panel id="evidence" eyebrow="Technical evidence" title="Engine output evidence" text="Collapsed technical evidence remains secondary to the business experience.">
            <details className={styles.details}><summary>View pricing result keys</summary><div className={styles.detailsBody}>Currency: {String(calculated.currency || 'MAD')} · Risk: {String(calculated.riskLevel || 'medium')} · Modifier count: {modifiers.length} · Total: {total}. Existing engine output and API contracts remain unchanged.</div></details>
          </Panel>
        </div>
        <CommandRail><DarkRailCard title="Pricing decision brief" alerts={[{ title: 'Simulation, not approval', text: 'This scenario requires commercial and operational validation before any commitment.' }, { title: 'Margin is contextual', text: 'The visible margin is not an accounting or realized-profit ledger.' }, { title: 'No persistence', text: 'The route does not write the scenario into catalogue, quotation, contract or billing records.' }]} /><LightRailCard title="Scenario summary"><ReviewRow label="Base" value={money(base)} /><ReviewRow label="Modifiers" value={modifiers.length} /><ReviewRow label="Total" value={money(total)} /><ReviewRow label="Risk" value={String(calculated.riskLevel || 'medium')} /></LightRailCard><LightRailCard title="Source trust"><ReviewRow label="Engine" value="Shared ServiceOS" /><ReviewRow label="Mode" value="Simulation" /><ReviewRow label="Persistence" value="None" /><ReviewRow label="Human authority" value="Required" /></LightRailCard></CommandRail>
      </div>
    </main>
  </AppShell>
}
