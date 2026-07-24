'use client'

import Link from 'next/link'
import { useMemo, useState, type ChangeEvent } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  HeartHandshake,
  Home,
  MapPinned,
  Phone,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from 'lucide-react'
import {
  BrandLockup,
  Eyebrow,
  InfoBox,
  Monogram,
  StatusBadge,
  text,
} from './FamilyUi'
import styles from './families-sanila.module.css'

type FormAction = (formData: FormData) => void | Promise<void>

type FamilyDraft = {
  family_name: string
  parent_name: string
  phone: string
  secondary_phone: string
  city: string
  zone: string
  address: string
  status: string
  source: string
  children_count: string
  children_ages: string
  preferred_schedule: string
  service_preferences: string
  special_needs: string
  notes: string
}

const initialDraft: FamilyDraft = {
  family_name: '',
  parent_name: '',
  phone: '',
  secondary_phone: '',
  city: '',
  zone: '',
  address: '',
  status: 'active',
  source: '',
  children_count: '0',
  children_ages: '',
  preferred_schedule: '',
  service_preferences: '',
  special_needs: '',
  notes: '',
}

const stages = [
  { label: 'Foyer', icon: Home },
  { label: 'Localisation', icon: MapPinned },
  { label: 'Enfants & besoins', icon: UsersRound },
  { label: 'Contexte relationnel', icon: HeartHandshake },
  { label: 'Revue finale', icon: ClipboardCheck },
]

export default function NewFamilyIntakeStudio({ action }: { action: FormAction }) {
  const [stage, setStage] = useState(0)
  const [draft, setDraft] = useState<FamilyDraft>(initialDraft)

  const update = (field: keyof FamilyDraft, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }))
  }

  const completion = useMemo(() => {
    const required: Array<keyof FamilyDraft> = ['family_name', 'parent_name', 'phone', 'city', 'children_count', 'service_preferences']
    const completed = required.filter((field) => String(draft[field] || '').trim() && !(field === 'children_count' && Number(draft.children_count) <= 0)).length
    return Math.round((completed / required.length) * 100)
  }, [draft])

  const missing = useMemo(() => {
    const items: string[] = []
    if (!draft.family_name.trim()) items.push('Nom du foyer')
    if (!draft.parent_name.trim()) items.push('Parent principal')
    if (!draft.phone.trim()) items.push('Téléphone principal')
    if (!draft.city.trim()) items.push('Ville')
    if (Number(draft.children_count) <= 0) items.push('Nombre d’enfants')
    if (!draft.service_preferences.trim()) items.push('Préférences de service')
    return items
  }, [draft])

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroMain}>
          <BrandLockup />
          <Eyebrow>Family Relationship Intake Studio</Eyebrow>
          <h1 className={styles.heroTitle}>Créer un dossier famille digne de la confiance accordée à ANGELCARE.</h1>
          <p className={styles.heroText}>
            Un parcours guidé pour établir l’identité du foyer, comprendre les besoins de garde et préparer une continuité commerciale et opérationnelle fiable.
          </p>
        </div>
        <div className={styles.heroSide}>
          <div className={styles.heroMetric}><span className={styles.heroMetricIcon}><ShieldCheck size={21} /></span><div><strong>{completion}%</strong><span>niveau de préparation du dossier</span></div></div>
          <div className={styles.heroMetric}><span className={styles.heroMetricIcon}><UsersRound size={21} /></span><div><strong>{draft.children_count || '0'}</strong><span>enfant(s) déclaré(s)</span></div></div>
          <div className={styles.heroMetric}><span className={styles.heroMetricIcon}><Phone size={21} /></span><div><strong>{draft.phone ? 'Prêt' : 'À compléter'}</strong><span>contact principal du foyer</span></div></div>
        </div>
      </section>

      <nav className={styles.tabNav} aria-label="Étapes de création du dossier famille">
        {stages.map((item, index) => {
          const Icon = item.icon
          return (
            <button
              key={item.label}
              type="button"
              className={`${styles.tabButton} ${stage === index ? styles.tabActive : ''}`}
              onClick={() => setStage(index)}
            >
              {index < stage ? <Check size={14} /> : <Icon size={14} />}
              {String(index + 1).padStart(2, '0')} · {item.label}
            </button>
          )
        })}
      </nav>

      <form action={action} className={styles.formShell}>
        <div className={styles.formMain}>
          <section className={`${styles.formPanel} ${stage === 0 ? '' : styles.hidden}`}>
            <StageHeader number="01" title="Identité du foyer" text="Créez la référence relationnelle principale qui suivra les leads, contrats, missions et opérations." />
            <div className={styles.fieldGrid}>
              <Field label="Nom de la famille" name="family_name" value={draft.family_name} onChange={(value) => update('family_name', value)} placeholder="Ex. Famille Benali" required />
              <Field label="Parent principal" name="parent_name" value={draft.parent_name} onChange={(value) => update('parent_name', value)} placeholder="Nom complet du contact principal" required />
              <Field label="Téléphone principal" name="phone" value={draft.phone} onChange={(value) => update('phone', value)} placeholder="+212 ..." required hint="Ce numéro peut participer au rapprochement lead → famille." />
              <Field label="Téléphone secondaire" name="secondary_phone" value={draft.secondary_phone} onChange={(value) => update('secondary_phone', value)} placeholder="Contact alternatif" />
              <Field label="Source de la relation" name="source" value={draft.source} onChange={(value) => update('source', value)} placeholder="WhatsApp, recommandation, campagne…" />
              <SelectField label="Statut initial" name="status" value={draft.status} onChange={(value) => update('status', value)} options={[['active', 'Active'], ['pending', 'En attente'], ['inactive', 'Inactive'], ['vip', 'VIP']]} />
            </div>
            <div className={styles.warningNotice} style={{ marginTop: 14 }}><ShieldCheck size={18} /><span>Vérifiez le téléphone avant création : certains parcours commerciaux utilisent ce numéro pour rapprocher un lead d’une famille existante.</span></div>
          </section>

          <section className={`${styles.formPanel} ${stage === 1 ? '' : styles.hidden}`}>
            <StageHeader number="02" title="Localisation & disponibilité" text="Documentez le contexte de résidence et les créneaux attendus sans inventer de géolocalisation non enregistrée." />
            <div className={styles.fieldGrid}>
              <Field label="Ville" name="city" value={draft.city} onChange={(value) => update('city', value)} placeholder="Rabat, Casablanca…" required />
              <Field label="Zone / quartier" name="zone" value={draft.zone} onChange={(value) => update('zone', value)} placeholder="Agdal, Hay Riad…" />
              <Field label="Adresse" name="address" value={draft.address} onChange={(value) => update('address', value)} placeholder="Adresse opérationnelle" full />
              <Field label="Créneaux préférés" name="preferred_schedule" value={draft.preferred_schedule} onChange={(value) => update('preferred_schedule', value)} placeholder="Jours, horaires et fréquence" full />
            </div>
          </section>

          <section className={`${styles.formPanel} ${stage === 2 ? '' : styles.hidden}`}>
            <StageHeader number="03" title="Enfants & besoins de garde" text="Concentrez les informations utiles au matching, au briefing opérationnel et à la qualité de prise en charge." />
            <div className={styles.fieldGrid}>
              <Field label="Nombre d’enfants" name="children_count" value={draft.children_count} onChange={(value) => update('children_count', value)} type="number" min="0" required />
              <Field label="Âges des enfants" name="children_ages" value={draft.children_ages} onChange={(value) => update('children_ages', value)} placeholder="Ex. 3 ans, 7 ans" />
              <Field label="Préférences de service" name="service_preferences" value={draft.service_preferences} onChange={(value) => update('service_preferences', value)} placeholder="Garde à domicile, sortie école…" full required />
              <TextAreaField label="Besoins spécifiques" name="special_needs" value={draft.special_needs} onChange={(value) => update('special_needs', value)} placeholder="Uniquement les informations nécessaires à une prise en charge sûre et adaptée." />
            </div>
            <div className={styles.privacyNotice} style={{ marginTop: 14 }}><ShieldCheck size={18} /><span>Zone sensible : saisissez seulement les éléments opérationnellement nécessaires. Évitez tout détail médical ou privé sans utilité directe pour la prestation.</span></div>
          </section>

          <section className={`${styles.formPanel} ${stage === 3 ? '' : styles.hidden}`}>
            <StageHeader number="04" title="Contexte relationnel" text="Ajoutez le contexte interne réellement persistant dans le dossier et utile aux équipes commerciales et opérationnelles." />
            <div className={styles.fieldGrid}>
              <TextAreaField label="Notes CRM internes" name="notes" value={draft.notes} onChange={(value) => update('notes', value)} placeholder="Contexte de relation, attentes exprimées, points de vigilance…" />
            </div>
            <div className={styles.successNotice} style={{ marginTop: 14 }}><CheckCircle2 size={18} /><span>Le statut, la source et les notes saisis ici seront enregistrés avec le dossier. Les champs d’intelligence non pris en charge par l’action de création ne sont pas affichés artificiellement.</span></div>
          </section>

          <section className={`${styles.reviewPanel} ${stage === 4 ? '' : styles.hidden}`}>
            <StageHeader number="05" title="Revue & création" text="Contrôlez l’identité, la localisation et les besoins avant d’émettre le dossier famille officiel." />
            <div className={styles.reviewGrid}>
              <ReviewBlock title="Identité" rows={[['Famille', draft.family_name], ['Parent', draft.parent_name], ['Téléphone', draft.phone], ['Téléphone 2', draft.secondary_phone], ['Source', draft.source], ['Statut', draft.status]]} />
              <ReviewBlock title="Localisation" rows={[['Ville', draft.city], ['Zone', draft.zone], ['Adresse', draft.address], ['Créneaux', draft.preferred_schedule]]} />
              <ReviewBlock title="Enfants & garde" rows={[['Nombre', draft.children_count], ['Âges', draft.children_ages], ['Préférences', draft.service_preferences], ['Besoins spécifiques', draft.special_needs]]} />
              <ReviewBlock title="Contexte interne" rows={[['Notes CRM', draft.notes || 'Aucune note initiale']]} />
            </div>
          </section>

          <div className={styles.formFooter}>
            <Link href="/families" className={styles.secondaryButton}><ArrowLeft size={16} />Annuler</Link>
            <div className={styles.stepActions}>
              {stage > 0 ? <button type="button" className={styles.secondaryButton} onClick={() => setStage((value) => Math.max(0, value - 1))}><ChevronLeft size={16} />Précédent</button> : null}
              {stage < stages.length - 1 ? (
                <button type="button" className={styles.primaryButton} onClick={() => setStage((value) => Math.min(stages.length - 1, value + 1))}>Continuer<ChevronRight size={16} /></button>
              ) : (
                <button type="submit" className={styles.primaryButton}><Sparkles size={16} />Créer le dossier famille</button>
              )}
            </div>
          </div>
        </div>

        <aside className={styles.formRail}>
          <div className={styles.previewCard}>
            <div className={styles.previewIdentity}>
              <Monogram familyName={draft.family_name} parentName={draft.parent_name} />
              <div><h3>{text(draft.family_name, 'Nouvelle famille')}</h3><p>{text(draft.parent_name, 'Parent principal à renseigner')}</p></div>
            </div>
            <div className={styles.passportTags}>
              <StatusBadge value={draft.status} />
              <span className={styles.trustBadge}>{text(draft.city, 'Ville à définir')}</span>
            </div>
            <div className={styles.miniStats} style={{ marginTop: 16 }}>
              <InfoBox label="Enfants" value={draft.children_count || '0'} />
              <InfoBox label="Zone" value={text(draft.zone, '—')} />
              <InfoBox label="Service" value={text(draft.service_preferences, 'À définir')} />
            </div>
          </div>

          <div className={styles.railPanel}>
            <h3 className={styles.railTitle}>Préparation du dossier</h3>
            <div style={{ marginTop: 14 }}>
              <div className={styles.progressMeta}><span>Complétude essentielle</span><strong>{completion}%</strong></div>
              <div className={styles.progressTrack}><div className={styles.progressBar} style={{ width: `${completion}%` }} /></div>
            </div>
          </div>

          <div className={styles.railPanel}>
            <h3 className={styles.railTitle}>Centre de validation</h3>
            <div className={styles.validationList} style={{ marginTop: 12 }}>
              {missing.length ? missing.map((item) => <div key={item} className={styles.validationItem}><ArrowRight size={14} /><span>{item} reste à compléter.</span></div>) : <div className={styles.validationItem}><CheckCircle2 size={14} color="#0a8f65" /><span>Les informations essentielles sont prêtes.</span></div>}
            </div>
          </div>
        </aside>
      </form>
    </div>
  )
}

function StageHeader({ number, title, text: description }: { number: string; title: string; text: string }) {
  return <div className={styles.stageHeader}><span className={styles.stageNumber}>{number}</span><div className={styles.stageCopy}><h2>{title}</h2><p>{description}</p></div></div>
}

function Field({ label, name, value, onChange, placeholder, type = 'text', hint, required = false, full = false, min }: { label: string; name: keyof FamilyDraft; value: string; onChange: (value: string) => void; placeholder?: string; type?: string; hint?: string; required?: boolean; full?: boolean; min?: string }) {
  return (
    <label className={`${styles.field} ${full ? styles.fieldFull : ''}`}>
      <span className={styles.fieldLabel}>{label}{required ? <span className={styles.required}>Essentiel</span> : null}</span>
      <input className={styles.input} name={name} value={value} onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)} placeholder={placeholder} type={type} min={min} />
      {hint ? <span className={styles.fieldHint}>{hint}</span> : null}
    </label>
  )
}

function SelectField({ label, name, value, onChange, options }: { label: string; name: keyof FamilyDraft; value: string; onChange: (value: string) => void; options: Array<[string, string]> }) {
  return <label className={styles.field}><span className={styles.fieldLabel}>{label}</span><select className={styles.select} name={name} value={value} onChange={(event: ChangeEvent<HTMLSelectElement>) => onChange(event.target.value)}>{options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}</select></label>
}

function TextAreaField({ label, name, value, onChange, placeholder }: { label: string; name: keyof FamilyDraft; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return <label className={`${styles.field} ${styles.fieldFull}`}><span className={styles.fieldLabel}>{label}</span><textarea className={styles.textarea} name={name} value={value} onChange={(event: ChangeEvent<HTMLTextAreaElement>) => onChange(event.target.value)} placeholder={placeholder} /></label>
}

function ReviewBlock({ title, rows }: { title: string; rows: Array<[string, string]> }) {
  return <div className={styles.reviewBlock}><h4>{title}</h4><dl>{rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{text(value)}</dd></div>)}</dl></div>
}
