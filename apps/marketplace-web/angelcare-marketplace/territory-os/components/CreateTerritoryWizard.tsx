"use client"

import type { ReactNode } from 'react'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Check, Globe2, Loader2, ShieldCheck } from 'lucide-react'
import type { Territory, TerritoryTemplate } from '../types'
import { TerritoryClientError, territoryRequest } from '../client-api'
import styles from '../territory-os.module.css'

const steps = [
  ['Identité', 'Code, pays et modèle'],
  ['Régional', 'Langues, devise, fuseau'],
  ['Couverture', 'Villes et stratégie'],
  ['Support', 'Contacts et escalade'],
  ['Leadership', 'Propriétaire et sponsor'],
  ['Validation', 'Résumé avant création'],
] as const

interface FormState {
  territoryCode: string
  name: string
  countryCode: string
  territoryType: string
  sourceTemplateId: string
  timezone: string
  currencyLabel: string
  defaultLocale: 'fr' | 'en' | 'ar'
  activeLocales: Array<'fr' | 'en' | 'ar'>
  cityNames: string
  activationStrategy: string
  targetLaunchAt: string
  publicEmail: string
  publicPhone: string
  operationsEmail: string
  escalationEmail: string
  ownerId: string
  executiveSponsorId: string
  reason: string
}

const initial: FormState = {
  territoryCode: '', name: '', countryCode: 'MA', territoryType: 'country', sourceTemplateId: '',
  timezone: 'Africa/Casablanca', currencyLabel: 'Dh', defaultLocale: 'fr', activeLocales: ['fr'],
  cityNames: '', activationStrategy: 'configuration_only', targetLaunchAt: '', publicEmail: '', publicPhone: '',
  operationsEmail: '', escalationEmail: '', ownerId: '', executiveSponsorId: '', reason: 'Création du territoire sous gouvernance Territory OS.',
}

export function CreateTerritoryWizard({ templates }: { templates: TerritoryTemplate[] }) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormState>(initial)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((current) => ({ ...current, [key]: value }))
  const canContinue = useMemo(() => {
    if (step === 0) return form.territoryCode.trim().length >= 3 && form.name.trim().length >= 3 && form.countryCode.trim().length === 2
    if (step === 1) return Boolean(form.timezone && form.currencyLabel && form.activeLocales.length)
    if (step === 2) return Boolean(form.activationStrategy)
    if (step === 3) return true
    if (step === 4) return true
    return Boolean(form.reason.trim())
  }, [form, step])

  async function submit() {
    setBusy(true); setError(null); setFieldErrors({})
    try {
      const territory = await territoryRequest<Territory>('/api/angelcare-marketplace/territories', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          activeLocales: form.activeLocales,
          cityNames: form.cityNames.split(',').map((item) => item.trim()).filter(Boolean),
          support: {
            public: { email: form.publicEmail || null, phone: form.publicPhone || null },
            operations: { email: form.operationsEmail || null },
            escalation: { email: form.escalationEmail || null },
          },
        }),
      })
      router.push(`/angelcare-marketplace/admin/territories/${territory.territory_code}`)
      router.refresh()
    } catch (cause) {
      if (cause instanceof TerritoryClientError) {
        setError(`${cause.message}${cause.requestId ? ` · Réf. ${cause.requestId}` : ''}`)
        setFieldErrors(cause.fieldErrors)
      } else setError('Une erreur inattendue a interrompu la création.')
    } finally { setBusy(false) }
  }

  return (
    <div className={styles.territoryCommand}>
      <div className={styles.wizardShell}>
        <aside className={styles.wizardRail}>
          <h2 className={styles.wizardRailTitle}>Créer un territoire</h2>
          <p className={styles.wizardRailText}>Un dossier gouverné sera créé avec paramètres, gates de lancement, responsables et historique. Aucun statut live n’est simulé.</p>
          <div className={styles.wizardSteps}>
            {steps.map(([label, hint], index) => (
              <div key={label} className={`${styles.wizardStep} ${index === step ? styles.wizardStepActive : ''} ${index < step ? styles.wizardStepDone : ''}`}>
                <span className={styles.stepNumber}>{index < step ? <Check size={13} /> : index + 1}</span>
                <span className={styles.stepLabel}><strong>{label}</strong><span>{hint}</span></span>
              </div>
            ))}
          </div>
        </aside>
        <section className={styles.wizardMain}>
          <header className={styles.wizardHeader}>
            <span className={styles.wizardEyebrow}>Territory Command · Étape {step + 1}/{steps.length}</span>
            <h1 className={styles.wizardTitle}>{wizardTitle(step)}</h1>
            <p className={styles.wizardDescription}>{wizardDescription(step)}</p>
          </header>
          <div className={styles.wizardContent}>
            {error ? <div className={styles.noticeDanger} style={{ marginBottom: 18 }}><ShieldCheck size={17} /><span>{error}</span></div> : null}
            {step === 0 ? <IdentityStep form={form} update={update} templates={templates} errors={fieldErrors} /> : null}
            {step === 1 ? <RegionalStep form={form} update={update} errors={fieldErrors} /> : null}
            {step === 2 ? <CoverageStep form={form} update={update} /> : null}
            {step === 3 ? <SupportStep form={form} update={update} /> : null}
            {step === 4 ? <LeadershipStep form={form} update={update} /> : null}
            {step === 5 ? <ReviewStep form={form} templates={templates} /> : null}
          </div>
          <footer className={styles.wizardFooter}>
            <button className={styles.buttonSecondary} type="button" disabled={step === 0 || busy} onClick={() => setStep((current) => Math.max(0, current - 1))}><ArrowLeft size={13} /> Retour</button>
            {step < steps.length - 1 ? (
              <button className={styles.buttonPrimary} type="button" disabled={!canContinue || busy} onClick={() => { setError(null); setStep((current) => Math.min(steps.length - 1, current + 1)) }}>Continuer <ArrowRight size={13} /></button>
            ) : (
              <button className={styles.buttonPrimary} type="button" disabled={!canContinue || busy} onClick={submit}>{busy ? <Loader2 size={14} className="animate-spin" /> : <Globe2 size={14} />} Créer le dossier territoire</button>
            )}
          </footer>
        </section>
      </div>
    </div>
  )
}

type Updater = <K extends keyof FormState>(key: K, value: FormState[K]) => void

function IdentityStep({ form, update, templates, errors }: { form: FormState; update: Updater; templates: TerritoryTemplate[]; errors: Record<string,string[]> }) {
  return <div className={styles.formGrid}>
    <Field label="Code territoire" help="Stable, lisible et unique. Exemple MA-MASTER." error={errors.territoryCode?.[0]}><input className={styles.input} value={form.territoryCode} onChange={(event) => update('territoryCode', event.target.value.toUpperCase())} placeholder="MA-MASTER" /></Field>
    <Field label="Nom du territoire" help="Nom exécutif et public du monde opérationnel." error={errors.name?.[0]}><input className={styles.input} value={form.name} onChange={(event) => update('name', event.target.value)} placeholder="Territory 1 — Maroc" /></Field>
    <Field label="Code pays ISO" help="Deux lettres, par exemple MA, FR ou AE." error={errors.countryCode?.[0]}><input className={styles.input} maxLength={2} value={form.countryCode} onChange={(event) => update('countryCode', event.target.value.toUpperCase())} /></Field>
    <Field label="Type de territoire" help="Pays, région, cluster de villes ou univers vertical."><select className={styles.select} value={form.territoryType} onChange={(event) => update('territoryType', event.target.value)}><option value="country">Pays</option><option value="region">Région</option><option value="city_cluster">Cluster de villes</option><option value="vertical_world">Univers vertical</option></select></Field>
    <div className={styles.formFieldFull}><Field label="Modèle de départ" help="Le modèle fournit les standards initiaux. Il ne déclenche aucun lancement."><select className={styles.select} value={form.sourceTemplateId} onChange={(event) => update('sourceTemplateId', event.target.value)}><option value="">Standard Global Master</option>{templates.map((template) => <option key={template.id} value={template.id}>{template.name} · v{template.version}</option>)}</select></Field></div>
  </div>
}

function RegionalStep({ form, update, errors }: { form: FormState; update: Updater; errors: Record<string,string[]> }) {
  const locales: Array<'fr'|'en'|'ar'> = ['fr','en','ar']
  return <div className={styles.formGrid}>
    <Field label="Fuseau horaire" help="Format IANA requis." error={errors.timezone?.[0]}><input className={styles.input} value={form.timezone} onChange={(event) => update('timezone', event.target.value)} /></Field>
    <Field label="Libellé devise" help="Libellé commercial affiché, sans promesse de prix."><input className={styles.input} value={form.currencyLabel} onChange={(event) => update('currencyLabel', event.target.value)} /></Field>
    <Field label="Langue par défaut" help="Doit faire partie des langues actives."><select className={styles.select} value={form.defaultLocale} onChange={(event) => { const value = event.target.value as 'fr'|'en'|'ar'; update('defaultLocale', value); if (!form.activeLocales.includes(value)) update('activeLocales', [...form.activeLocales, value]) }}><option value="fr">Français</option><option value="en">English</option><option value="ar">العربية</option></select></Field>
    <div className={styles.formField}><span className={styles.formLabel}>Langues actives <span>FR / EN / AR</span></span><div className={styles.checkGrid}>{locales.map((locale) => <label key={locale} className={`${styles.checkCard} ${form.activeLocales.includes(locale) ? styles.checkCardSelected : ''}`}><input type="checkbox" checked={form.activeLocales.includes(locale)} onChange={(event) => { const next = event.target.checked ? [...new Set([...form.activeLocales, locale])] : form.activeLocales.filter((item) => item !== locale); if (next.length) update('activeLocales', next) }} /><span><strong>{locale.toUpperCase()}</strong><p>{locale === 'ar' ? 'RTL obligatoire' : 'Interface et contenu territorialisés'}</p></span></label>)}</div></div>
  </div>
}

function CoverageStep({ form, update }: { form: FormState; update: Updater }) {
  return <div className={styles.formGrid}>
    <div className={styles.formFieldFull}><Field label="Villes initiales" help="Séparez les villes par des virgules. Elles seront créées en statut planned."><textarea className={styles.textarea} value={form.cityNames} onChange={(event) => update('cityNames', event.target.value)} placeholder="Rabat, Casablanca, Kénitra" /></Field></div>
    <Field label="Stratégie d’activation" help="Aucun mode ne contourne les launch gates."><select className={styles.select} value={form.activationStrategy} onChange={(event) => update('activationStrategy', event.target.value)}><option value="configuration_only">Configuration uniquement</option><option value="controlled_soft_launch">Préparer un soft launch contrôlé</option><option value="future_full_launch">Préparer un lancement complet futur</option></select></Field>
    <Field label="Date cible" help="Planning indicatif, sans autorisation automatique."><input className={styles.input} type="date" value={form.targetLaunchAt} onChange={(event) => update('targetLaunchAt', event.target.value)} /></Field>
  </div>
}

function SupportStep({ form, update }: { form: FormState; update: Updater }) {
  return <div className={styles.formGrid}>
    <Field label="Email public" help="Contact visible lorsque les parcours publics seront activés."><input className={styles.input} type="email" value={form.publicEmail} onChange={(event) => update('publicEmail', event.target.value)} placeholder="support@angelcare…" /></Field>
    <Field label="Téléphone public" help="Numéro local ou central du territoire."><input className={styles.input} value={form.publicPhone} onChange={(event) => update('publicPhone', event.target.value)} /></Field>
    <Field label="Email opérations" help="Route interne pour l’exécution opérationnelle."><input className={styles.input} type="email" value={form.operationsEmail} onChange={(event) => update('operationsEmail', event.target.value)} /></Field>
    <Field label="Email escalade" help="Route de niveau direction / risque."><input className={styles.input} type="email" value={form.escalationEmail} onChange={(event) => update('escalationEmail', event.target.value)} /></Field>
  </div>
}

function LeadershipStep({ form, update }: { form: FormState; update: Updater }) {
  return <div className={styles.formGrid}>
    <Field label="ID du propriétaire" help="Laissez vide pour assigner le créateur authentifié."><input className={styles.input} value={form.ownerId} onChange={(event) => update('ownerId', event.target.value)} placeholder="UUID utilisateur interne" /></Field>
    <Field label="ID du sponsor exécutif" help="Optionnel à la création, obligatoire avant launch live."><input className={styles.input} value={form.executiveSponsorId} onChange={(event) => update('executiveSponsorId', event.target.value)} placeholder="UUID utilisateur interne" /></Field>
    <div className={styles.formFieldFull}><Field label="Raison de création" help="Inscrite dans l’audit et le dossier de gouvernance."><textarea className={styles.textarea} value={form.reason} onChange={(event) => update('reason', event.target.value)} /></Field></div>
  </div>
}

function ReviewStep({ form, templates }: { form: FormState; templates: TerritoryTemplate[] }) {
  const template = templates.find((item) => item.id === form.sourceTemplateId)
  return <div className={styles.reviewSheet}>
    <div className={styles.noticeInfo}><ShieldCheck size={17} /><span>La création génère un territoire en brouillon, ses paramètres de base, ses zones planifiées, ses contacts disponibles et les 11 launch gates. Aucun passage live ne peut se produire ici.</span></div>
    <ReviewSection title="Identité" rows={[["Code",form.territoryCode],["Nom",form.name],["Pays",form.countryCode],["Type",form.territoryType],["Modèle",template?.name || 'Global Master']]} />
    <ReviewSection title="Configuration régionale" rows={[["Fuseau",form.timezone],["Devise",form.currencyLabel],["Langue défaut",form.defaultLocale.toUpperCase()],["Langues actives",form.activeLocales.join(' · ').toUpperCase()],["Villes",form.cityNames || 'Aucune ville initiale']]} />
    <ReviewSection title="Gouvernance" rows={[["Activation",form.activationStrategy],["Date cible",form.targetLaunchAt || 'Non planifiée'],["Propriétaire",form.ownerId || 'Créateur authentifié'],["Sponsor",form.executiveSponsorId || 'À assigner'],["Raison",form.reason]]} />
  </div>
}

function Field({ label, help, error, children }: { label: string; help: string; error?: string; children: ReactNode }) {
  return <label className={styles.formField}><span className={styles.formLabel}>{label}</span>{children}<p className={styles.formHelp}>{help}</p>{error ? <span className={styles.formError}>{error}</span> : null}</label>
}
function ReviewSection({ title, rows }: { title: string; rows: Array<[string,string]> }) {
  return <section className={styles.reviewSection}><div className={styles.reviewSectionTitle}>{title}</div><div className={styles.reviewRows}>{rows.map(([label,value]) => <div className={styles.reviewRow} key={label}><span>{label}</span><strong>{value}</strong></div>)}</div></section>
}
function wizardTitle(step: number) { return ['Définir l’identité territoriale','Configurer le contexte régional','Délimiter la couverture','Établir les routes de support','Assigner la responsabilité','Confirmer le dossier gouverné'][step] }
function wizardDescription(step: number) { return [
  'Créez un code durable et rattachez le territoire à un modèle contrôlé.',
  'Les langues, la devise et le fuseau alimentent tous les futurs modules territoire-aware.',
  'Déclarez ce qui pourra réellement être opéré et la stratégie de préparation.',
  'Les routes de support doivent exister avant qu’un lancement puisse être accepté.',
  'Chaque territoire doit avoir un propriétaire visible et une autorité exécutive identifiable.',
  'Vérifiez le dossier. La création reste en brouillon et déclenche le checklist de readiness.',
][step] }
