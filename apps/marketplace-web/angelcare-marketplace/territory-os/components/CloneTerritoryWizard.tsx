"use client"

import type { ReactNode } from 'react'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Check, Copy, Layers3, Loader2, LockKeyhole, ShieldCheck } from 'lucide-react'
import type { Territory } from '../types'
import { TerritoryClientError, territoryRequest } from '../client-api'
import styles from '../territory-os.module.css'

const domains = [
  ['modules','Modules et disponibilité','Références de modules compatibles avec le territoire.'],
  ['settings','Standards de configuration','Langues, devise, fuseau, support et règles globales.'],
  ['catalog','Catalogue','Références d’offre, sans inventer les futures capacités.'],
  ['content','Contenu','Références de contenu et shells de localisation.'],
  ['workflows','Workflows','Règles opérationnelles et contrôles structurants.'],
  ['trust','Trust standards','Standards de confiance et preuve, non badges fictifs.'],
  ['launch_gates','Launch gates','Checklist complète avec responsabilités et état initial.'],
] as const
const overrideCategories = ['Localisation','Finance','Catalogue','Opérations','Support','Confiance']
const steps = ['Source','Héritage','Identité','Gouvernance','Validation']

interface CloneForm {
  sourceTerritoryCode: string
  territoryCode: string
  name: string
  countryCode: string
  timezone: string
  currencyLabel: string
  defaultLocale: 'fr'|'en'|'ar'
  activeLocales: Array<'fr'|'en'|'ar'>
  ownerId: string
  executiveSponsorId: string
  inheritedDomains: string[]
  allowedOverrideCategories: string[]
  reason: string
}

export function CloneTerritoryWizard({ territories }: { territories: Territory[] }) {
  const router = useRouter()
  const sourceDefault = territories.find((item) => item.territory_code === 'MA-MASTER') || territories[0]
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<CloneForm>({
    sourceTerritoryCode: sourceDefault?.territory_code || '', territoryCode: '', name: '', countryCode: '',
    timezone: sourceDefault?.timezone || 'Africa/Casablanca', currencyLabel: sourceDefault?.currency_label || 'Dh',
    defaultLocale: sourceDefault?.default_locale || 'fr', activeLocales: sourceDefault?.active_locales || ['fr'],
    ownerId: '', executiveSponsorId: '', inheritedDomains: domains.map(([key]) => key), allowedOverrideCategories: overrideCategories,
    reason: 'Clonage gouverné depuis le territoire maître pour préparer une nouvelle expansion.',
  })
  const [busy,setBusy] = useState(false)
  const [error,setError] = useState<string|null>(null)
  const source = useMemo(() => territories.find((item) => item.territory_code === form.sourceTerritoryCode), [territories, form.sourceTerritoryCode])
  const update = <K extends keyof CloneForm>(key: K, value: CloneForm[K]) => setForm((current) => ({...current,[key]:value}))

  function selectSource(code: string) {
    const item = territories.find((territory) => territory.territory_code === code)
    setForm((current) => ({
      ...current, sourceTerritoryCode: code,
      timezone: item?.timezone || current.timezone,
      currencyLabel: item?.currency_label || current.currencyLabel,
      defaultLocale: item?.default_locale || current.defaultLocale,
      activeLocales: item?.active_locales || current.activeLocales,
    }))
  }

  async function submit() {
    setBusy(true); setError(null)
    try {
      const created = await territoryRequest<Territory>('/api/angelcare-marketplace/territories/clone', {
        method:'POST',
        body: JSON.stringify({...form, idempotencyKey: crypto.randomUUID()}),
      })
      router.push(`/angelcare-marketplace/admin/territories/${created.territory_code}/overrides`)
      router.refresh()
    } catch (cause) {
      setError(cause instanceof TerritoryClientError ? `${cause.message}${cause.requestId ? ` · Réf. ${cause.requestId}` : ''}` : 'Le clonage a été interrompu.')
    } finally { setBusy(false) }
  }

  const canContinue = step === 0 ? Boolean(source) : step === 1 ? form.inheritedDomains.length > 0 : step === 2 ? Boolean(form.territoryCode.length >= 3 && form.name.length >= 3 && form.countryCode.length === 2) : step === 3 ? Boolean(form.reason.trim()) : true

  return <div className={styles.territoryCommand}><div className={styles.wizardShell}>
    <aside className={styles.wizardRail}><h2 className={styles.wizardRailTitle}>Cloner un territoire</h2><p className={styles.wizardRailText}>Le clonage crée des références héritées, des snapshots versionnés et des shells de dérogation. Les standards verrouillés restent intouchables.</p><div className={styles.wizardSteps}>{steps.map((label,index) => <div key={label} className={`${styles.wizardStep} ${index===step?styles.wizardStepActive:''} ${index<step?styles.wizardStepDone:''}`}><span className={styles.stepNumber}>{index<step?<Check size={13}/>:index+1}</span><span className={styles.stepLabel}><strong>{label}</strong><span>{['Choisir le maître','Définir les domaines','Créer la destination','Assigner les autorités','Contrôler le plan'][index]}</span></span></div>)}</div></aside>
    <section className={styles.wizardMain}>
      <header className={styles.wizardHeader}><span className={styles.wizardEyebrow}>Clone Engine · Étape {step+1}/{steps.length}</span><h1 className={styles.wizardTitle}>{['Sélectionner le monde source','Composer le contrat d’héritage','Définir le territoire destination','Fixer les limites et responsabilités','Valider le plan de clonage'][step]}</h1><p className={styles.wizardDescription}>Le processus reste explicite, idempotent, auditable et bloqué contre les raccourcis de duplication incontrôlée.</p></header>
      <div className={styles.wizardContent}>{error?<div className={styles.noticeDanger} style={{marginBottom:18}}><ShieldCheck size={17}/><span>{error}</span></div>:null}
        {step===0?<SourceStep territories={territories} selected={form.sourceTerritoryCode} onSelect={selectSource}/>:null}
        {step===1?<InheritanceStep form={form} update={update}/>:null}
        {step===2?<DestinationStep form={form} update={update}/>:null}
        {step===3?<GovernanceStep form={form} update={update}/>:null}
        {step===4?<CloneReview form={form} source={source}/>:null}
      </div>
      <footer className={styles.wizardFooter}><button className={styles.buttonSecondary} disabled={step===0||busy} onClick={()=>setStep((value)=>Math.max(0,value-1))}><ArrowLeft size={13}/> Retour</button>{step<steps.length-1?<button className={styles.buttonPrimary} disabled={!canContinue||busy} onClick={()=>setStep((value)=>Math.min(steps.length-1,value+1))}>Continuer <ArrowRight size={13}/></button>:<button className={styles.buttonPrimary} disabled={!canContinue||busy} onClick={submit}>{busy?<Loader2 size={14}/>:<Copy size={14}/>} Exécuter le clonage gouverné</button>}</footer>
    </section>
  </div></div>
}

type Update = <K extends keyof CloneForm>(key: K, value: CloneForm[K]) => void
function SourceStep({territories,selected,onSelect}:{territories:Territory[];selected:string;onSelect:(code:string)=>void}) { return <div className={styles.checkGrid}>{territories.map((item)=><button type="button" key={item.id} onClick={()=>onSelect(item.territory_code)} className={`${styles.checkCard} ${selected===item.territory_code?styles.checkCardSelected:''}`}><span className={styles.stepNumber}>{item.country_code}</span><span><strong>{item.name}</strong><p>{item.territory_code} · version {item.version} · readiness {item.readiness_score}%</p></span></button>)}</div> }
function InheritanceStep({form,update}:{form:CloneForm;update:Update}) { return <div className={styles.reviewSheet}><div className={styles.noticeInfo}><Layers3 size={17}/><span>Les domaines sélectionnés sont référencés ou snapshotés selon leur type. Les contenus futurs non installés restent explicitement indisponibles.</span></div><div className={styles.checkGrid}>{domains.map(([key,label,description])=>{const selected=form.inheritedDomains.includes(key);return <label key={key} className={`${styles.checkCard} ${selected?styles.checkCardSelected:''}`}><input type="checkbox" checked={selected} onChange={(event)=>update('inheritedDomains',event.target.checked?[...form.inheritedDomains,key]:form.inheritedDomains.filter((item)=>item!==key))}/><span><strong>{label}</strong><p>{description}</p></span></label>})}</div></div> }
function DestinationStep({form,update}:{form:CloneForm;update:Update}) { return <div className={styles.formGrid}><Field label="Code destination"><input className={styles.input} value={form.territoryCode} onChange={(event)=>update('territoryCode',event.target.value.toUpperCase())} placeholder="FR-IDF"/></Field><Field label="Nom destination"><input className={styles.input} value={form.name} onChange={(event)=>update('name',event.target.value)} placeholder="Territory 2 — Île-de-France"/></Field><Field label="Code pays"><input className={styles.input} maxLength={2} value={form.countryCode} onChange={(event)=>update('countryCode',event.target.value.toUpperCase())}/></Field><Field label="Fuseau horaire"><input className={styles.input} value={form.timezone} onChange={(event)=>update('timezone',event.target.value)}/></Field><Field label="Libellé devise"><input className={styles.input} value={form.currencyLabel} onChange={(event)=>update('currencyLabel',event.target.value)}/></Field><Field label="Langue par défaut"><select className={styles.select} value={form.defaultLocale} onChange={(event)=>update('defaultLocale',event.target.value as 'fr'|'en'|'ar')}><option value="fr">FR</option><option value="en">EN</option><option value="ar">AR</option></select></Field></div> }
function GovernanceStep({form,update}:{form:CloneForm;update:Update}) { return <div className={styles.reviewSheet}><div className={styles.formGrid}><Field label="Propriétaire"><input className={styles.input} value={form.ownerId} onChange={(event)=>update('ownerId',event.target.value)} placeholder="Vide = utilisateur authentifié"/></Field><Field label="Sponsor exécutif"><input className={styles.input} value={form.executiveSponsorId} onChange={(event)=>update('executiveSponsorId',event.target.value)} placeholder="UUID interne"/></Field><div className={styles.formFieldFull}><Field label="Raison du clonage"><textarea className={styles.textarea} value={form.reason} onChange={(event)=>update('reason',event.target.value)}/></Field></div></div><section className={styles.reviewSection}><div className={styles.reviewSectionTitle}>Catégories de dérogation locale autorisées</div><div className={styles.checkGrid} style={{padding:14}}>{overrideCategories.map((category)=>{const selected=form.allowedOverrideCategories.includes(category);return <label key={category} className={`${styles.checkCard} ${selected?styles.checkCardSelected:''}`}><input type="checkbox" checked={selected} onChange={(event)=>update('allowedOverrideCategories',event.target.checked?[...form.allowedOverrideCategories,category]:form.allowedOverrideCategories.filter((item)=>item!==category))}/><span><strong>{category}</strong><p>Les standards verrouillés restent exclus.</p></span></label>})}</div></section></div> }
function CloneReview({form,source}:{form:CloneForm;source?:Territory}) { return <div className={styles.reviewSheet}><div className={styles.noticeWarning}><LockKeyhole size={17}/><span>Le clonage ne publie rien. Il crée un territoire en configuration, conserve la version source, génère les gates et trace les catégories d’override autorisées.</span></div><section className={styles.reviewSection}><div className={styles.reviewSectionTitle}>Lignée d’héritage</div><div className={styles.reviewRows}>{[["Source",source?.name||'Introuvable'],["Version source",String(source?.version||0)],["Destination",form.name],["Code",form.territoryCode],["Pays",form.countryCode],["Domaines",form.inheritedDomains.join(' · ')],["Overrides autorisés",form.allowedOverrideCategories.join(' · ')],["Raison",form.reason]].map(([label,value])=><div className={styles.reviewRow} key={label}><span>{label}</span><strong>{value}</strong></div>)}</div></section></div> }
function Field({label,children}:{label:string;children:ReactNode}) { return <label className={styles.formField}><span className={styles.formLabel}>{label}</span>{children}</label> }
