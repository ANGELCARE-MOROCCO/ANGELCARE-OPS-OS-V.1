import { saveServiceOSBlueprint } from '@/lib/service-os/production/actions'
import type { ServiceOSBlueprint } from '@/lib/service-os/production/types'
import { DarkRailCard, LightRailCard, Panel, ReviewRow, SourceBadge, styles } from '@/components/service-os/Services360UI'

export function ServiceOSBlueprintForm({ blueprint }: { blueprint?: Partial<ServiceOSBlueprint> }) {
  const isEdit = Boolean(blueprint?.id)
  return (
    <form action={saveServiceOSBlueprint} className={styles.grid2}>
      <input type="hidden" name="id" defaultValue={blueprint?.id || ''} />
      <div style={{ display: 'grid', gap: 18 }}>
        <Panel id="blueprint-identity" eyebrow="01 · Architecture identity" title="Blueprint identity & market position" text="Define the canonical production blueprint without changing the existing save action or payload contract.">
          <div className={styles.formGrid}>
            <Field label="Code" required><input className={styles.input} name="code" required defaultValue={blueprint?.code || ''} /></Field>
            <Field label="Title" required><input className={styles.input} name="title" required defaultValue={blueprint?.title || ''} /></Field>
            <Field label="Commercial title"><input className={styles.input} name="commercialTitle" defaultValue={blueprint?.commercialTitle || ''} /></Field>
            <Field label="Family"><select className={styles.select} name="family" defaultValue={blueprint?.family || 'home_care'}><option value="home_care">Home care</option><option value="special_needs">Special needs</option><option value="school_support">School support</option><option value="postpartum">Postpartum</option><option value="events">Events</option><option value="education_ludique">Education ludique</option><option value="corporate_institutional">Corporate</option></select></Field>
            <Field label="Status"><select className={styles.select} name="status" defaultValue={blueprint?.status || 'draft'}><option value="draft">Draft</option><option value="active">Active</option><option value="paused">Paused</option><option value="retired">Retired</option></select></Field>
            <Field label="Horizon"><select className={styles.select} name="createdForHorizon" defaultValue={blueprint?.createdForHorizon || 'now'}><option value="now">Now</option><option value="12_months">12 months</option><option value="3_years">3 years</option><option value="10_years">10 years</option></select></Field>
            <label className={styles.field} style={{ gridColumn: '1 / -1' }}><span className={styles.fieldLabel}>Description</span><textarea className={styles.textarea} name="description" defaultValue={blueprint?.description || ''} rows={4} /></label>
          </div>
        </Panel>

        <Panel id="blueprint-architecture" eyebrow="02 · Operating architecture" title="Modules, rules and workflow" text="CSV inputs remain exactly compatible with the existing production save action.">
          <div className={styles.formGrid}>
            <Field label="Module codes (CSV)"><input className={styles.input} name="modules" defaultValue={(blueprint?.modules || []).join(', ')} /></Field>
            <Field label="Rule codes (CSV)"><input className={styles.input} name="rules" defaultValue={(blueprint?.rules || []).join(', ')} /></Field>
            <Field label="Workflow template"><input className={styles.input} name="workflowTemplate" defaultValue={blueprint?.workflowTemplate || 'standard'} /></Field>
            <Field label="Default SLA (minutes)"><input className={styles.input} name="defaultSlaMinutes" type="number" defaultValue={blueprint?.defaultSlaMinutes || 120} /></Field>
            <Field label="Staff roles (CSV)"><input className={styles.input} name="staffRoles" defaultValue={(blueprint?.staffRoles || []).join(', ')} /></Field>
            <Field label="Required documents (CSV)"><input className={styles.input} name="requiredDocuments" defaultValue={(blueprint?.requiredDocuments || []).join(', ')} /></Field>
          </div>
        </Panel>

        <Panel id="blueprint-commercial" eyebrow="03 · Commercial architecture" title="Pricing, margin and target clients" text="Commercial configuration remains advisory until consumed by the existing downstream engines.">
          <div className={styles.formGrid}>
            <Field label="Base price (Dh)"><input className={styles.input} name="basePriceMad" type="number" defaultValue={blueprint?.basePriceMad || 0} /></Field>
            <Field label="Target margin (%)"><input className={styles.input} name="marginTargetPct" type="number" defaultValue={blueprint?.marginTargetPct || 35} /></Field>
            <Field label="Target clients (CSV)"><input className={styles.input} name="targetClients" defaultValue={(blueprint?.targetClients || []).join(', ')} /></Field>
            <Field label="AI tags (CSV)"><input className={styles.input} name="aiTags" defaultValue={(blueprint?.aiTags || []).join(', ')} /></Field>
          </div>
          <div className={styles.sourceStrip}>
            <label className={styles.pill}><input type="checkbox" name="subscriptionEligible" defaultChecked={!!blueprint?.subscriptionEligible} /> Subscription eligible</label>
            <label className={styles.pill}><input type="checkbox" name="institutionalEligible" defaultChecked={!!blueprint?.institutionalEligible} /> Institutional eligible</label>
          </div>
        </Panel>

        <Panel id="blueprint-coverage" eyebrow="04 · Coverage" title="City deployment scope" text="Cities remain stored as the existing comma-separated blueprint configuration.">
          <div className={styles.formGrid}><Field label="Cities (CSV)"><input className={styles.input} name="cities" defaultValue={(blueprint?.cities || []).join(', ')} /></Field></div>
        </Panel>
      </div>

      <aside className={styles.commandRail}>
        <DarkRailCard title={isEdit ? 'Blueprint change control' : 'Blueprint provisioning'} alerts={[
          { title: 'Architecture integrity', text: 'Module and rule codes must exist in the current ServiceOS configuration.' },
          { title: 'Commercial truth', text: 'Base price and margin are planning configuration, not accounting approval.' },
          { title: 'Coverage truth', text: 'Configured cities do not automatically create capacity or staffing.' },
          { title: 'Existing action preserved', text: 'The form still submits to saveServiceOSBlueprint.' },
        ]} />
        <LightRailCard title="Blueprint passport">
          <ReviewRow label="Mode" value={isEdit ? 'Edit existing' : 'Create new'} />
          <ReviewRow label="Code" value={blueprint?.code || 'To define'} />
          <ReviewRow label="Status" value={blueprint?.status || 'draft'} />
          <ReviewRow label="Modules" value={(blueprint?.modules || []).length} />
          <ReviewRow label="Cities" value={(blueprint?.cities || []).length} />
        </LightRailCard>
        <section className={styles.railCardLight}>
          <SourceBadge label="Production ServiceOS action" tone="live" />
          <button className={styles.primaryAction} style={{ width: '100%', marginTop: 14 }} type="submit">{isEdit ? 'Valider les modifications' : 'Créer le blueprint'}</button>
        </section>
      </aside>
    </form>
  )
}

function Field({ label, children, required = false }: { label: string; children: React.ReactNode; required?: boolean }) {
  return <label className={styles.field}><span className={styles.fieldLabel}>{label}{required ? ' *' : ''}</span>{children}</label>
}
