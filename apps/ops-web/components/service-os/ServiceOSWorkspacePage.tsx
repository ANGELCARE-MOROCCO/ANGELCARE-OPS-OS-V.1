import Link from 'next/link'
import AppShell from '@/app/components/erp/AppShell'
import {
  ActionLink as CoreActionLink,
  CommandHeader,
  CommercialCoreBar,
  Metric,
  MetricStrip,
  TruthNotice,
  WorkspaceNav,
} from '@/components/commercial-core/CommercialCoreShell'
import {
  calculateServicePrice,
  getCityDeployments,
  getServiceBlueprints,
  getServiceMissions,
  getServiceModules,
  getServiceRules,
  recommendServiceForNeed,
} from '@/lib/service-os/engine'
import {
  CommandRail,
  DarkRailCard,
  EmptyState,
  Kpi,
  KpiGrid,
  LifecycleRibbon,
  LightRailCard,
  MiniStat,
  Panel,
  PrimaryAction,
  ReviewRow,
  SecondaryAction,
  ServiceCard,
  Services360Hero,
  Services360Nav,
  SourceBadge,
  StatPill,
  serviceRelationshipNodes,
  serviceWorkspaceNav,
  styles,
} from './Services360UI'

export type ServiceWorkspaceKind =
  | 'enterprise'
  | 'blueprints'
  | 'configuration'
  | 'rules'
  | 'operations'
  | 'workflows'
  | 'incidents'
  | 'commercial'
  | 'subscriptions'
  | 'live-ops'
  | 'capacity'
  | 'expansion'
  | 'client-journey'
  | 'contracts'
  | 'compliance'
  | 'ai-matching'
  | 'ai-strategy'
  | 'market-intelligence'

const routeMeta: Record<ServiceWorkspaceKind, { title: string; short: string; description: string; source: string; tone: 'live' | 'configured' | 'fallback' | 'simulation' | 'legacy'; brief: string }> = {
  enterprise: { title: 'Service OS Executive Command', short: 'Enterprise', description: 'A unified executive view of service architecture, rules, capacity, missions, pricing and strategic readiness—without hiding the source or maturity of the underlying data.', source: 'Shared ServiceOS engine', tone: 'configured', brief: 'Where leadership sees what is ready, what is simulated and what needs investment.' },
  blueprints: { title: 'Service Blueprint Portfolio', short: 'Blueprints', description: 'Govern configurable service architectures, operating modules, rules, cities, workflows and readiness horizons.', source: 'ServiceOS blueprint engine', tone: 'configured', brief: 'The architecture layer behind repeatable, scalable AngelCare service lines.' },
  configuration: { title: 'Configuration Governance', short: 'Configuration', description: 'Control the attachable capability blocks that shape each service line while keeping live, configured and compatibility data clearly separated.', source: 'ServiceOS module catalogue', tone: 'configured', brief: 'The modular operating architecture that makes services adaptable without rewriting the platform.' },
  rules: { title: 'Rules & Policy Command', short: 'Rules', description: 'Review operational triggers, pricing modifiers, certifications, escalations and service-specific governance in one controlled rules inventory.', source: 'ServiceOS rules engine', tone: 'configured', brief: 'Every rule should explain when it applies, what it changes and what risk it protects.' },
  operations: { title: 'Service Operations Command', short: 'Operations', description: 'Monitor service execution, mission posture, operational risk and city distribution at management level.', source: 'ServiceOS mission snapshot', tone: 'simulation', brief: 'Management visibility over execution readiness and mission operating posture.' },
  workflows: { title: 'Service Workflow Architecture', short: 'Workflows', description: 'Visualize how each blueprint moves from intake and qualification to assignment, execution, validation and closure.', source: 'Blueprint workflow configuration', tone: 'configured', brief: 'Configured workflow architecture—not a claim that every step is already automated.' },
  incidents: { title: 'Service Quality & Incident Intelligence', short: 'Incidents', description: 'Connect service risk, quality controls, incident categories and corrective-action expectations without inventing unsupported database relationships.', source: 'ServiceOS quality simulation', tone: 'simulation', brief: 'A governed quality view that distinguishes real incidents from service-risk models.' },
  commercial: { title: 'Commercial Packaging Command', short: 'Commercial', description: 'Translate blueprints into target-client positioning, price architecture, packages, subscriptions and institutional offers.', source: 'ServiceOS commercial engine', tone: 'configured', brief: 'Commercial readiness must stay aligned with catalogue, pricing and operational capacity.' },
  subscriptions: { title: 'Subscription Eligibility Center', short: 'Subscriptions', description: 'Review which service architectures are eligible for recurring or institutional packaging without pretending that subscription billing is implemented here.', source: 'Blueprint eligibility flags', tone: 'configured', brief: 'Eligibility and packaging visibility—not a separate billing engine.' },
  'live-ops': { title: 'Service Live Operations', short: 'Live Ops', description: 'A focused current-execution view for active, assigned, blocked and attention-sensitive service missions.', source: 'ServiceOS mission snapshot', tone: 'simulation', brief: 'Current execution data is explicitly labelled when it comes from the shared simulation layer.' },
  capacity: { title: 'Service Capacity Command', short: 'Capacity', description: 'Compare city demand, capacity, risk, staffing requirements and deployment stage to expose where service growth is operationally safe.', source: 'City deployment configuration', tone: 'configured', brief: 'Capacity signals are planning inputs and must not masquerade as certified live staffing availability.' },
  expansion: { title: 'Geographic Expansion Studio', short: 'Expansion', description: 'Prioritize candidate cities using configured demand, capacity, risk and service-family readiness.', source: 'ServiceOS expansion model', tone: 'simulation', brief: 'A transparent planning model supporting—not replacing—management decisions.' },
  'client-journey': { title: 'Client Journey Architecture', short: 'Client Journey', description: 'Make the complete service handoff visible from discovery and qualification to contract, mission delivery, quality and renewal.', source: 'Cross-module architecture map', tone: 'configured', brief: 'An architectural truth map showing connected, partial and manual handoffs.' },
  contracts: { title: 'Service-to-Contract Continuity', short: 'Contracts', description: 'Expose how catalogue service codes, blueprint services and contract service fields align—and where manual or static mappings remain.', source: 'Cross-module contract map', tone: 'configured', brief: 'A visibility and integrity workspace; no contract records are rewritten.' },
  compliance: { title: 'Service Compliance Command', short: 'Compliance', description: 'Review required documents, certifications, staff roles, service risk and SLA expectations by blueprint.', source: 'Blueprint compliance configuration', tone: 'configured', brief: 'Configured requirements are not presented as verified documents unless another system confirms them.' },
  'ai-matching': { title: 'Transparent Service Matching Studio', short: 'AI Matching', description: 'Match a representative client need to suitable service architectures with visible reasons, constraints and pricing context.', source: 'ServiceOS matching engine', tone: 'simulation', brief: 'Recommendations are explainable simulations and require human validation.' },
  'ai-strategy': { title: 'Service Strategy Intelligence', short: 'AI Strategy', description: 'Structure strategic recommendations around demand, margin, staffing, expansion and defensibility while preserving human decision authority.', source: 'Internal strategy model', tone: 'simulation', brief: 'No recommendation executes an external, contractual or financial action.' },
  'market-intelligence': { title: 'Service Market Intelligence', short: 'Market Intelligence', description: 'Observe internal demand signals, service gaps, city opportunity and commercial readiness without presenting internal models as external market research.', source: 'Internal ServiceOS intelligence', tone: 'simulation', brief: 'Internal intelligence is clearly distinguished from verified external market evidence.' },
}

function text(value: unknown, fallback = 'Non défini') {
  return typeof value === 'string' && value.trim() ? value : fallback
}
function number(value: unknown, fallback = 0) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}
function list(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}
function money(value: unknown) {
  return `${Math.round(number(value)).toLocaleString('fr-FR')} Dh`
}

export default function ServiceOSWorkspacePage({ kind }: { kind: ServiceWorkspaceKind }) {
  const meta = routeMeta[kind]
  const blueprints = getServiceBlueprints()
  const modules = getServiceModules()
  const rules = getServiceRules()
  const deployments = getCityDeployments()
  const missions = getServiceMissions()
  const matches = recommendServiceForNeed('famille premium besoin spécial école domicile')
  const samplePrice = calculateServicePrice({ blueprintCode: 'S.H', city: 'Rabat', urgent: true, specialNeeds: true, transport: true, hours: 5 })
  const activeBlueprints = blueprints.filter((item) => String(item.status || '').toLowerCase() === 'active').length
  const activeMissions = missions.filter((item) => ['assigned', 'live', 'launched'].includes(String(item.status || ''))).length
  const averageReadiness = blueprints.length ? Math.round(blueprints.reduce((sum, item) => sum + number(item.readiness, 68), 0) / blueprints.length) : 0
  const averageCapacity = deployments.length ? Math.round(deployments.reduce((sum: number, item: any) => sum + number(item.capacityScore ?? item.capacity, 0), 0) / deployments.length) : 0
  const highRiskCities = deployments.filter((item: any) => number(item.riskScore, 0) >= 60).length

  const groupedNav = [
    { href: '/services', label: 'Portfolio', description: 'Offre & readiness' },
    { href: '/services/blueprints', label: 'Blueprints', description: 'Architecture de livraison' },
    { href: '/services/pricing-engine', label: 'Tarification', description: 'Prix & règles' },
    { href: '/services/operations', label: 'Delivery readiness', description: 'Opérations & capacité' },
    { href: '/services/configuration', label: 'Gouvernance', description: 'Modules & règles' },
    { href: '/services/enterprise', label: 'Executive', description: 'Vue ServiceOS' },
  ]

  const activeHref = kind === 'blueprints'
    ? '/services/blueprints'
    : ['pricing-engine'].includes(kind as string)
      ? '/services/pricing-engine'
      : ['operations', 'live-ops', 'capacity', 'expansion', 'incidents', 'workflows'].includes(kind)
        ? '/services/operations'
        : ['configuration', 'rules', 'compliance', 'contracts', 'client-journey'].includes(kind)
          ? '/services/configuration'
          : '/services/enterprise'

  return (
    <AppShell title={meta.short} subtitle="ANGELCARE SANILA Services OS" breadcrumbs={[{ label: 'Services', href: '/services' }, { label: meta.short }]}>
      <main className={styles.shell}>
        <CommercialCoreBar active="services" />

        <CommandHeader
          eyebrow="SANILA Services OS · Workspace"
          title={meta.title}
          description={meta.description}
          actions={
            <>
              <CoreActionLink href="/services">Retour au portfolio</CoreActionLink>
              <CoreActionLink href="/services/blueprints">Blueprints</CoreActionLink>
              {kind === 'blueprints' ? <CoreActionLink href="/services/blueprints/new" primary>Créer un blueprint</CoreActionLink> : null}
            </>
          }
          aside={
            <div style={{ display: 'grid', gap: 10 }}>
              <span style={{ color: '#bfdbfe', fontSize: 10, fontWeight: 900, letterSpacing: '.1em', textTransform: 'uppercase' }}>Workspace truth</span>
              <strong style={{ fontSize: 19 }}>{meta.brief}</strong>
              <span style={{ color: '#dbeafe', fontSize: 11, lineHeight: 1.55 }}>Source : {meta.source}. La décision humaine reste requise.</span>
            </div>
          }
          source={`Provenance : ${meta.tone === 'configured' ? 'données configurées' : 'simulation / intelligence interne'} · Backend inchangé.`}
        />

        <WorkspaceNav items={groupedNav} activeHref={activeHref} />

        {['simulation', 'fallback', 'legacy'].includes(meta.tone) ? (
          <TruthNotice title="Source non certifiée comme registre opérationnel complet" tone="attention">
            Cette vue exploite une couche {meta.tone}. Elle soutient l’analyse et la configuration, mais ne remplace pas automatiquement le catalogue, les contrats ou le registre principal des missions.
          </TruthNotice>
        ) : null}

        <MetricStrip>
          <Metric label="Blueprints" value={blueprints.length} context={`${activeBlueprints} actifs`} tone={blueprints.length ? 'good' : 'attention'} />
          <Metric label="Modules" value={modules.length} context="Blocs configurables" tone={modules.length ? 'good' : 'attention'} />
          <Metric label="Règles" value={rules.length} context="Pricing & gouvernance" tone={rules.length ? 'good' : 'attention'} />
          <Metric label="Déploiements" value={deployments.length} context={`Capacité moyenne ${averageCapacity}%`} tone={deployments.length ? 'good' : 'attention'} />
          <Metric label="Missions visibles" value={missions.length} context={`${activeMissions} actives`} tone={missions.length ? 'neutral' : 'attention'} />
          <Metric label="Préparation" value={`${averageReadiness}%`} context="Configurée / estimée" tone={averageReadiness >= 75 ? 'good' : 'attention'} />
        </MetricStrip>

        <div className={styles.grid2}>
          <div style={{ display: 'grid', gap: 18 }}>
            {renderPrimaryWorkspace(kind, { blueprints, modules, rules, deployments, missions, matches, samplePrice })}
            {renderIntegrityWorkspace(kind, { blueprints, modules, rules, deployments, missions, highRiskCities })}
          </div>
          <CommandRail>
            <DarkRailCard
              title="Décisions & vigilance"
              text="Synthèse déterministe construite à partir des sources visibles dans ce workspace."
              alerts={buildAlerts(kind, { blueprints, modules, rules, deployments, missions, highRiskCities })}
            />
            <LightRailCard title="Architecture de confiance">
              <ReviewRow label="Source principale" value={meta.source} />
              <ReviewRow label="Provenance" value={meta.tone === 'configured' ? 'Configurée' : 'Simulation'} />
              <ReviewRow label="Écriture backend" value="Inchangée" />
              <ReviewRow label="Décision humaine" value="Requise" />
            </LightRailCard>
            <LightRailCard title="Navigation structurée">
              <ReviewRow label="Portfolio" value={<Link className={styles.textLink} href="/services">Ouvrir</Link>} />
              <ReviewRow label="Tarification" value={<Link className={styles.textLink} href="/services/pricing-engine">Ouvrir</Link>} />
              <ReviewRow label="Delivery readiness" value={<Link className={styles.textLink} href="/services/operations">Ouvrir</Link>} />
              <ReviewRow label="Gouvernance" value={<Link className={styles.textLink} href="/services/configuration">Ouvrir</Link>} />
            </LightRailCard>
          </CommandRail>
        </div>
      </main>
    </AppShell>
  )
}

function renderPrimaryWorkspace(kind: ServiceWorkspaceKind, data: any) {
  const { blueprints, modules, rules, deployments, missions, matches, samplePrice } = data

  if (kind === 'blueprints') return (
    <Panel eyebrow="Architecture portfolio" title="Blueprints de services" text="Chaque blueprint est présenté comme une architecture configurable distincte du catalogue opérationnel.">
      <div className={styles.gridAuto}>{blueprints.map((bp: any) => <ServiceCard key={bp.id || bp.code} code={text(bp.code || bp.serviceCode)} title={text(bp.name || bp.title)} text={text(bp.description || bp.marketSegment, 'Architecture de service configurable.')} status={<SourceBadge label={text(bp.status, 'draft')} tone={String(bp.status).toLowerCase() === 'active' ? 'live' : 'configured'} />} pills={[{ label: `${list(bp.modules).length} modules`, tone: 'good' }, { label: `${list(bp.rules).length} règles` }, { label: `${list(bp.cities).length} villes`, tone: list(bp.cities).length ? 'good' : 'warn' }]} stats={[{ label: 'Prix base', value: money(bp.basePriceMad) }, { label: 'Marge', value: `${number(bp.marginTarget, 35)}%` }, { label: 'Readiness', value: `${number(bp.readiness, 68)}%` }]} href={`/services/blueprints/${encodeURIComponent(String(bp.id || bp.code))}/edit`} footer="ServiceOS blueprint" />)}</div>
    </Panel>
  )

  if (kind === 'configuration') return (
    <Panel eyebrow="Configuration inventory" title="Modules configurables" text="Blocs de capacité attachables aux architectures de services. Les informations présentées viennent du moteur partagé ServiceOS.">
      <div className={styles.gridAuto}>{modules.map((item: any) => <ServiceCard key={item.key || item.id} code={text(item.key || item.code)} title={text(item.label || item.name)} text={text(item.description)} status={<SourceBadge label={text(item.status, 'configured')} tone="configured" />} pills={[{ label: text(item.category, 'shared') }, { label: item.required ? 'Requis' : 'Optionnel', tone: item.required ? 'warn' : 'good' }]} stats={[{ label: 'Risque', value: text(item.riskLevel, 'standard') }, { label: 'Prix défaut', value: money(item.defaultPriceMad) }, { label: 'Certifications', value: list(item.requiredCertifications).length }]} footer="Module ServiceOS" />)}</div>
    </Panel>
  )

  if (kind === 'rules') return (
    <Panel eyebrow="Rules governance" title="Règles opérationnelles et tarifaires" text="Le WHEN / THEN reste lisible, traçable et séparé des actions réellement exécutées par le backend.">
      <div className={styles.gridAuto}>{rules.map((rule: any, index: number) => <ServiceCard key={rule.id || rule.key || index} code={text(rule.code || rule.key, `RULE-${index + 1}`)} title={text(rule.label || rule.name, 'Règle ServiceOS')} text={`WHEN ${text(rule.when || rule.condition, 'condition configurée')} · THEN ${Array.isArray(rule.then) ? rule.then.join(' · ') : text(rule.action, 'action configurée')}`} status={<SourceBadge label={text(rule.status, 'active')} tone={String(rule.status).toLowerCase() === 'active' ? 'live' : 'configured'} />} pills={[{ label: text(rule.type, 'operational') }, { label: text(rule.escalation, 'standard'), tone: String(rule.escalation).includes('critical') ? 'risk' : 'neutral' }]} stats={[{ label: 'Modifier', value: money(rule.pricingModifierMad ?? rule.pricingModifier) }, { label: 'Impact', value: text(rule.impact || rule.severity, 'standard') }, { label: 'Certification', value: text(rule.requiredCertification, 'Non requise') }]} footer="Configured rule" />)}</div>
    </Panel>
  )

  if (kind === 'operations' || kind === 'live-ops') return (
    <Panel eyebrow={kind === 'live-ops' ? 'Current execution' : 'Operational management'} title={kind === 'live-ops' ? 'Missions actuellement visibles' : 'Portefeuille d’exécution ServiceOS'} text="Ces missions proviennent du snapshot ServiceOS partagé. Le bandeau de provenance évite de les confondre avec le registre principal des missions lorsque la source est simulée.">
      {missions.length ? <div className={styles.gridAuto}>{missions.map((mission: any) => <ServiceCard key={mission.id} code={text(mission.serviceCode)} title={text(mission.clientName || mission.client)} text={`${text(mission.city)} · ${text(mission.assignedStaff, 'Staff non affecté')}`} status={<SourceBadge label={text(mission.status)} tone="simulation" />} pills={[{ label: `Risque ${number(mission.riskScore ?? mission.risk, 0)}`, tone: number(mission.riskScore ?? mission.risk, 0) > 60 ? 'risk' : 'warn' }]} stats={[{ label: 'Prix', value: money(mission.priceMad ?? mission.valueMad) }, { label: 'Ville', value: text(mission.city) }, { label: 'État', value: text(mission.status) }]} footer="ServiceOS mission snapshot" />)}</div> : <EmptyState title="Aucune mission visible" text="Le snapshot ServiceOS n’expose aucune mission pour ce workspace." />}
    </Panel>
  )

  if (kind === 'workflows') return (
    <Panel eyebrow="Workflow architecture" title="Parcours configurés par blueprint" text="Les étapes suivantes décrivent une architecture de workflow. Elles ne sont pas présentées comme des automatisations live lorsqu’aucun moteur d’exécution ne le confirme.">
      <div className={styles.gridAuto}>{blueprints.map((bp: any) => { const workflow = list(bp.defaultWorkflow).length ? list(bp.defaultWorkflow) : list(bp.workflows).map((item: any) => typeof item === 'string' ? item : text(item.label || item.name)); return <ServiceCard key={bp.id || bp.code} code={text(bp.code)} title={text(bp.name)} text={workflow.length ? workflow.join(' → ') : 'Aucun workflow explicite configuré.'} status={<SourceBadge label="Configured workflow" tone="configured" />} pills={workflow.slice(0, 5).map((step: string) => ({ label: step }))} stats={[{ label: 'Étapes', value: workflow.length }, { label: 'SLA', value: `${number(bp.slaMinutes, 120)} min` }, { label: 'Risque', value: text(bp.riskLevel, 'standard') }]} footer="Blueprint workflow" /> })}</div>
    </Panel>
  )

  if (kind === 'incidents') {
    const categories = ['Retard terrain', 'Réclamation parent', 'Escalade besoins spécifiques', 'Transport', 'SLA', 'Remplacement staff']
    return <Panel eyebrow="Quality intelligence" title="Catégories de risque service" text="Ces catégories structurent l’analyse qualité. Elles sont volontairement étiquetées comme modèle de contrôle et non comme incidents live."><div className={styles.gridAuto}>{categories.map((category, index) => <ServiceCard key={category} code={`QUALITY-${String(index + 1).padStart(2, '0')}`} title={category} text="Root cause, owner, severity, corrective action and quality review." status={<SourceBadge label="Quality model" tone="simulation" />} pills={[{ label: index % 2 ? 'Surveillance' : 'Contrôlé', tone: index % 2 ? 'warn' : 'good' }]} stats={[{ label: 'Source', value: 'Simulation' }, { label: 'Owner', value: 'Quality' }, { label: 'Evidence', value: 'Required' }]} footer="No live incident claim" />)}</div></Panel>
  }

  if (kind === 'commercial' || kind === 'subscriptions') return (
    <Panel eyebrow="Commercial architecture" title={kind === 'subscriptions' ? 'Éligibilité abonnements & institutions' : 'Portefeuille de packaging commercial'} text="Les offres restent liées aux propriétés configurées des blueprints et ne prétendent pas créer un nouveau moteur de billing.">
      <div className={styles.gridAuto}>{blueprints.map((bp: any) => <ServiceCard key={bp.id || bp.code} code={text(bp.code)} title={text(bp.name || bp.title)} text={text(bp.marketSegment || bp.description, 'Positionnement à confirmer.')} status={<SourceBadge label={bp.subscriptionEligible ? 'Subscription eligible' : 'Standard offer'} tone="configured" />} pills={[{ label: bp.subscriptionEligible ? 'Abonnement' : 'Ponctuel', tone: bp.subscriptionEligible ? 'good' : 'neutral' }, { label: bp.institutionalEligible ? 'Institutionnel' : 'B2C / standard', tone: bp.institutionalEligible ? 'good' : 'neutral' }]} stats={[{ label: 'Prix base', value: money(bp.basePriceMad) }, { label: 'Marge cible', value: `${number(bp.marginTarget, 35)}%` }, { label: 'Clients', value: list(bp.targetClients).length || text(bp.marketSegment) }]} footer="Commercial configuration" />)}</div>
    </Panel>
  )

  if (kind === 'capacity' || kind === 'expansion') return (
    <Panel eyebrow={kind === 'capacity' ? 'Capacity planning' : 'Expansion planning'} title={kind === 'capacity' ? 'Capacité et pression par ville' : 'Priorités géographiques'} text="Demand, capacity and risk are transparent planning inputs. They are never labelled as certified live staffing counts unless their source confirms it.">
      <div className={styles.gridAuto}>{deployments.map((city: any, index: number) => { const capacity = number(city.capacityScore ?? city.capacity, 0); const demand = number(city.demandScore, 0); const risk = number(city.riskScore, 0); return <ServiceCard key={city.id || city.city || index} code={text(city.country, 'MA')} title={text(city.city)} text={text(city.notes, kind === 'capacity' ? 'Configured city-capacity profile.' : 'Candidate deployment profile.')} status={<SourceBadge label={text(city.launchStage, city.active ? 'active' : 'configured')} tone="configured" />} pills={[{ label: `Demande ${demand}`, tone: demand >= 70 ? 'good' : 'neutral' }, { label: `Capacité ${capacity}`, tone: capacity >= demand ? 'good' : 'warn' }, { label: `Risque ${risk}`, tone: risk >= 60 ? 'risk' : 'neutral' }]} stats={[{ label: 'Hires', value: number(city.requiredHires, 0) }, { label: 'Revenue cible', value: money(city.targetMonthlyRevenueMad) }, { label: 'Priorité', value: text(city.launchPriority, index < 3 ? 'high' : 'medium') }]} footer="Configured deployment" /> })}</div>
    </Panel>
  )

  if (kind === 'client-journey') {
    const journey = [
      ['Discovery', 'Market OS / Sales', 'Connected'], ['Selection', 'Service catalogue', 'Live'], ['Qualification', 'Sales & family context', 'Partial'], ['Contract', 'Contract planner', 'Static mapping'], ['Mission', 'Service code inherited', 'Connected'], ['Delivery', 'Operations / CareLink', 'Semantic'], ['Quality', 'Incidents & review', 'Partial'], ['Renewal', 'Commercial follow-up', 'Manual'],
    ]
    return <Panel eyebrow="End-to-end architecture" title="Parcours client et handoffs" text="Chaque étape indique le système existant et le niveau de connexion réel."><div className={styles.gridAuto}>{journey.map(([stage, system, state], index) => <ServiceCard key={stage} code={`0${index + 1}`} title={stage} text={system} status={<SourceBadge label={state} tone={state === 'Live' || state === 'Connected' ? 'live' : 'configured'} />} stats={[{ label: 'System', value: system }, { label: 'Handoff', value: state }, { label: 'Control', value: 'Human-visible' }]} footer="Architecture map" />)}</div></Panel>
  }

  if (kind === 'contracts') {
    const rows = [
      ['Catalogue service code', 'service_catalog.service_code', 'Live source'], ['Contract service code', 'contracts.service_code', 'Persisted'], ['Contract service type', 'contracts.service_type', 'Persisted'], ['Contract planner choices', 'Hard-coded SERVICES list', 'Partial / manual'], ['Mission service context', 'Inherited from contract', 'Connected'],
    ]
    return <Panel eyebrow="Integration integrity" title="Service ↔ Contract continuity" text="This workspace exposes the actual data handoffs without rewriting contract records or pretending the planner is fully catalogue-driven."><div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Layer</th><th>Current source</th><th>Integration state</th></tr></thead><tbody>{rows.map((row) => <tr key={row[0]}><td><strong>{row[0]}</strong></td><td>{row[1]}</td><td><SourceBadge label={row[2]} tone={row[2].includes('Live') || row[2].includes('Connected') ? 'live' : 'configured'} /></td></tr>)}</tbody></table></div></Panel>
  }

  if (kind === 'compliance') return (
    <Panel eyebrow="Compliance architecture" title="Documents, certifications & service obligations" text="Configured requirements are shown as requirements—not falsely presented as completed verification.">
      <div className={styles.gridAuto}>{blueprints.map((bp: any) => <ServiceCard key={bp.id || bp.code} code={text(bp.code)} title={text(bp.name)} text={text(bp.description, 'Service blueprint compliance profile.')} status={<SourceBadge label={text(bp.complianceLevel, 'configured')} tone="configured" />} pills={[...list(bp.requiredDocuments).slice(0, 3).map((item) => ({ label: item })), ...list(bp.requiredCertifications).slice(0, 2).map((item) => ({ label: item, tone: 'warn' as const }))]} stats={[{ label: 'Documents', value: list(bp.requiredDocuments).length }, { label: 'Certifications', value: list(bp.requiredCertifications).length }, { label: 'SLA', value: `${number(bp.slaMinutes, 120)} min` }]} footer="Requirements, not verification" />)}</div>
    </Panel>
  )

  if (kind === 'ai-matching') return (
    <Panel eyebrow="Explainable matching" title="Matching service pour un besoin représentatif" text="The engine exposes score, blueprint, reasons and price context. The result remains a decision-support simulation.">
      <div className={styles.gridAuto}>{matches.slice(0, 8).map((match: any) => <ServiceCard key={match.blueprint.id || match.blueprint.code} code={`${match.score}% match`} title={text(match.blueprint.name)} text={text(match.blueprint.description || match.blueprint.marketSegment)} status={<SourceBadge label="Simulation" tone="simulation" />} pills={[{ label: text(match.blueprint.marketSegment, 'service') }, ...list(match.blueprint.modules).slice(0, 3).map((item) => ({ label: item }))]} stats={[{ label: 'Prix scénario', value: money(match.price?.totalMad ?? match.price?.total) }, { label: 'Villes', value: list(match.blueprint.cities).length }, { label: 'Risque', value: text(match.price?.riskLevel, 'medium') }]} footer="Human validation required" />)}</div>
    </Panel>
  )

  if (kind === 'ai-strategy' || kind === 'market-intelligence') {
    const recommendations = kind === 'ai-strategy'
      ? ['Développer l’accompagnement besoins spécifiques à Rabat et Casablanca', 'Créer une offre concierge childcare pour hôtellerie', 'Packager le post-partum en relation premium récurrente', 'Renforcer les contrats SLA écoles et institutions', 'Connecter l’Academy au pipeline de certifications terrain']
      : ['Besoins spécifiques et autisme', 'Post-partum premium', 'Montessori parascolaire', 'Hôtellerie et tourisme childcare', 'Contrats écoles et institutions', 'Abonnements familles premium']
    return <Panel eyebrow={kind === 'ai-strategy' ? 'Decision support' : 'Internal market observation'} title={kind === 'ai-strategy' ? 'Recommandations stratégiques structurées' : 'Signaux de marché internes'} text="Every insight is labelled as internal or simulated, with no claim of external research or autonomous execution."><div className={styles.gridAuto}>{recommendations.map((item, index) => <ServiceCard key={item} code={`INSIGHT-${String(index + 1).padStart(2, '0')}`} title={item} text="Analyse de demande, différenciation, capacité, marge et risque à valider avec les équipes responsables." status={<SourceBadge label={kind === 'ai-strategy' ? 'Recommendation' : 'Internal signal'} tone="simulation" />} pills={[{ label: index < 3 ? 'Priorité élevée' : 'À explorer', tone: index < 3 ? 'warn' : 'neutral' }]} stats={[{ label: 'Evidence', value: 'Internal' }, { label: 'Decision', value: 'Human' }, { label: 'Execution', value: 'Blocked' }]} footer="No autonomous action" />)}</div></Panel>
  }

  return (
    <Panel eyebrow="Executive command" title="ServiceOS operating architecture" text="A consolidated view of the shared engine with explicit maturity and provenance signals.">
      <div className={styles.grid4}>
        <ServiceCard code="ARCH" title="Blueprint Architecture" text="Configurable service lines with modules, workflows and requirements." stats={[{ label: 'Blueprints', value: blueprints.length }, { label: 'Active', value: blueprints.filter((item: any) => String(item.status) === 'active').length }, { label: 'Cities', value: new Set(blueprints.flatMap((item: any) => list(item.cities))).size }]} href="/services/blueprints" footer="Configured" />
        <ServiceCard code="RULES" title="Rules & Pricing" text="Operational triggers, modifiers, certifications and pricing simulation." stats={[{ label: 'Rules', value: rules.length }, { label: 'Sample', value: money(samplePrice.totalMad) }, { label: 'Risk', value: text(samplePrice.riskLevel) }]} href="/services/pricing-engine" footer="Configured / simulated" />
        <ServiceCard code="OPS" title="Execution & Capacity" text="Mission posture, city deployment and readiness constraints." stats={[{ label: 'Missions', value: missions.length }, { label: 'Cities', value: deployments.length }, { label: 'Capacity', value: 'Planning' }]} href="/services/operations" footer="Simulation-labelled" />
        <ServiceCard code="GROWTH" title="Expansion & Strategy" text="City prioritization, market signals and human-reviewed recommendations." stats={[{ label: 'Deployments', value: deployments.length }, { label: 'Matches', value: matches.length }, { label: 'Authority', value: 'Human' }]} href="/services/expansion" footer="Decision support" />
      </div>
    </Panel>
  )
}

function renderIntegrityWorkspace(kind: ServiceWorkspaceKind, data: any) {
  const { blueprints, modules, rules, deployments, missions, highRiskCities } = data
  const blueprintWithoutCities = blueprints.filter((item: any) => !list(item.cities).length).length
  const blueprintWithoutModules = blueprints.filter((item: any) => !list(item.modules).length).length
  const inactiveRules = rules.filter((item: any) => String(item.status).toLowerCase() === 'inactive').length
  return (
    <Panel eyebrow="Data reliability" title="Integrity & provenance observations" text="Observations are informational. They do not mutate catalogue, blueprint, rule, deployment or mission records.">
      <div className={styles.grid4}>
        <MiniStat label="Blueprints sans villes" value={blueprintWithoutCities} />
        <MiniStat label="Blueprints sans modules" value={blueprintWithoutModules} />
        <MiniStat label="Règles inactives" value={inactiveRules} />
        <MiniStat label="Villes à risque" value={highRiskCities} />
      </div>
      <div className={styles.sourceStrip}>
        <SourceBadge label={`${blueprints.length} blueprints loaded`} tone="configured" />
        <SourceBadge label={`${modules.length} modules loaded`} tone="configured" />
        <SourceBadge label={`${missions.length} mission snapshots`} tone="simulation" />
        <SourceBadge label={`${deployments.length} city deployments`} tone="configured" />
      </div>
      <details className={styles.details} style={{ marginTop: 14 }}>
        <summary>Evidence & technical interpretation</summary>
        <div className={styles.detailsBody}>This workspace reads the same ServiceOS engine functions as before. It adds presentation, provenance and integrity interpretation only. Database tables, APIs, actions, payloads and cross-module contracts are unchanged.</div>
      </details>
    </Panel>
  )
}

function buildAlerts(kind: ServiceWorkspaceKind, data: any): Array<{ title: string; text: string }> {
  const alerts: Array<{ title: string; text: string }> = []
  if (!data.blueprints.length) alerts.push({ title: 'Blueprint source unavailable', text: 'No blueprint is visible in the current shared engine.' })
  if (!data.modules.length) alerts.push({ title: 'No configurable modules', text: 'The configuration layer is empty or unavailable.' })
  if (!data.rules.length) alerts.push({ title: 'Rules inventory empty', text: 'Pricing and operational policy visibility is incomplete.' })
  if (data.highRiskCities > 0) alerts.push({ title: `${data.highRiskCities} city profile(s) at risk`, text: 'Review capacity, demand and launch posture before scaling.' })
  if (kind === 'operations' || kind === 'live-ops') alerts.push({ title: 'Simulation boundary', text: 'Mission cards come from the ServiceOS snapshot, not a claim of the complete operational mission register.' })
  if (kind === 'contracts') alerts.push({ title: 'Partial contract synchronization', text: 'The contract planner still relies on a static service list in the inspected source.' })
  if (kind === 'ai-strategy' || kind === 'ai-matching' || kind === 'market-intelligence') alerts.push({ title: 'Human authority preserved', text: 'Recommendations and scores do not execute financial, contractual or external actions.' })
  if (!alerts.length) alerts.push({ title: 'Workspace sources loaded', text: 'No critical presentation-level source gap was detected in this view.' })
  return alerts.slice(0, 4)
}
