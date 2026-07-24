'use client'

import Link from 'next/link'
import { useMemo, useState, type ChangeEvent } from 'react'
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  HeartHandshake,
  History,
  MapPinned,
  Save,
  ShieldCheck,
  UsersRound,
} from 'lucide-react'
import { BrandLockup, Eyebrow, InfoBox, Monogram, StatusBadge, text } from './FamilyUi'
import styles from './families-sanila.module.css'

type FormAction = (formData: FormData) => void | Promise<void>

type FamilyRecord = {
  id: string | number
  family_name?: string | null
  parent_name?: string | null
  phone?: string | null
  secondary_phone?: string | null
  city?: string | null
  zone?: string | null
  address?: string | null
  children_count?: string | number | null
  children_ages?: string | null
  preferred_schedule?: string | null
  service_preferences?: string | null
  special_needs?: string | null
  source?: string | null
  status?: string | null
  notes?: string | null
}

type Draft = {
  family_name: string
  parent_name: string
  phone: string
  secondary_phone: string
  city: string
  zone: string
  address: string
  children_count: string
  children_ages: string
  preferred_schedule: string
  service_preferences: string
  special_needs: string
  source: string
  status: string
  notes: string
}

const sections = [
  { label: 'Identité & contact', icon: UsersRound },
  { label: 'Enfants & service', icon: HeartHandshake },
  { label: 'Gouvernance relationnelle', icon: ShieldCheck },
  { label: 'Revue des changements', icon: ClipboardCheck },
]

function toDraft(family: FamilyRecord): Draft {
  return {
    family_name: String(family.family_name || ''),
    parent_name: String(family.parent_name || ''),
    phone: String(family.phone || ''),
    secondary_phone: String(family.secondary_phone || ''),
    city: String(family.city || ''),
    zone: String(family.zone || ''),
    address: String(family.address || ''),
    children_count: String(family.children_count || 0),
    children_ages: String(family.children_ages || ''),
    preferred_schedule: String(family.preferred_schedule || ''),
    service_preferences: String(family.service_preferences || ''),
    special_needs: String(family.special_needs || ''),
    source: String(family.source || ''),
    status: String(family.status || 'active'),
    notes: String(family.notes || ''),
  }
}

const fieldLabels: Record<keyof Draft, string> = {
  family_name: 'Nom de la famille',
  parent_name: 'Parent principal',
  phone: 'Téléphone principal',
  secondary_phone: 'Téléphone secondaire',
  city: 'Ville',
  zone: 'Zone',
  address: 'Adresse',
  children_count: 'Nombre d’enfants',
  children_ages: 'Âges des enfants',
  preferred_schedule: 'Créneaux préférés',
  service_preferences: 'Préférences de service',
  special_needs: 'Besoins spécifiques',
  source: 'Source',
  status: 'Statut',
  notes: 'Notes CRM',
}

export default function EditFamilyGovernanceStudio({ family, action }: { family: FamilyRecord; action: FormAction }) {
  const initial = useMemo(() => toDraft(family), [family])
  const [section, setSection] = useState(0)
  const [draft, setDraft] = useState<Draft>(initial)

  const update = (field: keyof Draft, value: string) => setDraft((current) => ({ ...current, [field]: value }))

  const changes = useMemo(() => (Object.keys(draft) as Array<keyof Draft>)
    .filter((field) => String(draft[field]) !== String(initial[field]))
    .map((field) => ({ field, label: fieldLabels[field], before: initial[field], after: draft[field] })), [draft, initial])

  const completion = useMemo(() => {
    const required: Array<keyof Draft> = ['family_name', 'parent_name', 'phone', 'city', 'children_count', 'service_preferences']
    return Math.round((required.filter((field) => String(draft[field]).trim() && !(field === 'children_count' && Number(draft.children_count) <= 0)).length / required.length) * 100)
  }, [draft])

  const phoneChanged = draft.phone !== initial.phone
  const locationChanged = draft.city !== initial.city || draft.zone !== initial.zone || draft.address !== initial.address
  const statusChanged = draft.status !== initial.status
  const needsChanged = draft.special_needs !== initial.special_needs

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroMain}>
          <BrandLockup />
          <Eyebrow>Family Relationship Governance Studio</Eyebrow>
          <h1 className={styles.heroTitle}>Faire évoluer le dossier sans perdre la continuité opérationnelle.</h1>
          <p className={styles.heroText}>
            Chaque modification doit rester lisible, maîtrisée et cohérente avec les leads, contrats et missions déjà rattachés à cette famille.
          </p>
        </div>
        <div className={styles.heroSide}>
          <div className={styles.heroMetric}><span className={styles.heroMetricIcon}><History size={21} /></span><div><strong>{changes.length}</strong><span>modification(s) en attente</span></div></div>
          <div className={styles.heroMetric}><span className={styles.heroMetricIcon}><ShieldCheck size={21} /></span><div><strong>{completion}%</strong><span>complétude essentielle du dossier</span></div></div>
          <div className={styles.heroMetric}><span className={styles.heroMetricIcon}><UsersRound size={21} /></span><div><strong>#{family.id}</strong><span>référence famille conservée</span></div></div>
        </div>
      </section>

      <nav className={styles.tabNav} aria-label="Espaces de gouvernance du dossier">
        {sections.map((item, index) => {
          const Icon = item.icon
          return <button key={item.label} type="button" className={`${styles.tabButton} ${section === index ? styles.tabActive : ''}`} onClick={() => setSection(index)}><Icon size={14} />{item.label}</button>
        })}
      </nav>

      <form action={action} className={styles.formShell}>
        <div className={styles.formMain}>
          <section className={`${styles.formPanel} ${section === 0 ? '' : styles.hidden}`}>
            <StageHeader number="01" title="Identité, contact & localisation" text="Mettez à jour les informations de référence sans modifier silencieusement les missions ou contrats historiques." />
            <div className={styles.fieldGrid}>
              <Field label="Nom de la famille" name="family_name" value={draft.family_name} onChange={(value) => update('family_name', value)} required />
              <Field label="Parent principal" name="parent_name" value={draft.parent_name} onChange={(value) => update('parent_name', value)} required />
              <Field label="Téléphone principal" name="phone" value={draft.phone} onChange={(value) => update('phone', value)} required hint="Utilisé dans certains rapprochements de leads." />
              <Field label="Téléphone secondaire" name="secondary_phone" value={draft.secondary_phone} onChange={(value) => update('secondary_phone', value)} />
              <Field label="Ville" name="city" value={draft.city} onChange={(value) => update('city', value)} required />
              <Field label="Zone" name="zone" value={draft.zone} onChange={(value) => update('zone', value)} />
              <Field label="Adresse" name="address" value={draft.address} onChange={(value) => update('address', value)} full />
            </div>
            {phoneChanged ? <div className={styles.warningNotice} style={{ marginTop: 14 }}><AlertTriangle size={18} /><span>Le téléphone principal a changé. Vérifiez qu’il ne correspond pas à une autre famille avant validation afin d’éviter un rapprochement commercial incorrect.</span></div> : null}
            {locationChanged ? <div className={styles.privacyNotice} style={{ marginTop: 14 }}><MapPinned size={18} /><span>La localisation a changé. Les missions et contrats existants ne seront pas réécrits automatiquement par cette action.</span></div> : null}
          </section>

          <section className={`${styles.formPanel} ${section === 1 ? '' : styles.hidden}`}>
            <StageHeader number="02" title="Enfants & exigences de service" text="Maintenez une description utile au matching et à la continuité de prise en charge." />
            <div className={styles.fieldGrid}>
              <Field label="Nombre d’enfants" name="children_count" value={draft.children_count} onChange={(value) => update('children_count', value)} type="number" min="0" required />
              <Field label="Âges des enfants" name="children_ages" value={draft.children_ages} onChange={(value) => update('children_ages', value)} />
              <Field label="Créneaux préférés" name="preferred_schedule" value={draft.preferred_schedule} onChange={(value) => update('preferred_schedule', value)} full />
              <Field label="Préférences de service" name="service_preferences" value={draft.service_preferences} onChange={(value) => update('service_preferences', value)} full required />
              <TextAreaField label="Besoins spécifiques" name="special_needs" value={draft.special_needs} onChange={(value) => update('special_needs', value)} />
            </div>
            {needsChanged ? <div className={styles.warningNotice} style={{ marginTop: 14 }}><ShieldCheck size={18} /><span>Vous modifiez une information sensible. Conservez uniquement les éléments nécessaires à une prestation sûre et proportionnée.</span></div> : null}
          </section>

          <section className={`${styles.formPanel} ${section === 2 ? '' : styles.hidden}`}>
            <StageHeader number="03" title="Gouvernance relationnelle" text="Contrôlez les éléments CRM réellement enregistrés par le flux actuel de mise à jour." />
            <div className={styles.fieldGrid}>
              <Field label="Source" name="source" value={draft.source} onChange={(value) => update('source', value)} />
              <SelectField label="Statut" name="status" value={draft.status} onChange={(value) => update('status', value)} options={[['active', 'Active'], ['pending', 'En attente'], ['inactive', 'Inactive'], ['vip', 'VIP']]} />
              <TextAreaField label="Notes CRM internes" name="notes" value={draft.notes} onChange={(value) => update('notes', value)} />
            </div>
            {statusChanged ? <div className={styles.warningNotice} style={{ marginTop: 14 }}><AlertTriangle size={18} /><span>Le statut passe de « {text(initial.status)} » à « {text(draft.status)} ». Cette modification change la lecture relationnelle du dossier, sans supprimer ses missions ni ses contrats.</span></div> : null}
          </section>

          <section className={`${styles.reviewPanel} ${section === 3 ? '' : styles.hidden}`}>
            <StageHeader number="04" title="Revue des changements" text="Vérifiez précisément les écarts avant d’appliquer la nouvelle version du dossier." />
            {changes.length ? (
              <div className={styles.changeList}>
                {changes.map((change) => (
                  <div key={change.field} className={styles.changeItem}>
                    <History size={15} />
                    <span><strong style={{ color: '#173451' }}>{change.label}</strong><br />{text(change.before)} → <strong style={{ color: '#0b5ed7' }}>{text(change.after)}</strong></span>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.empty}><div><CheckCircle2 size={28} /><strong>Aucun changement détecté</strong><p>Le dossier correspond encore exactement à sa version enregistrée.</p></div></div>
            )}
          </section>

          <div className={styles.formFooter}>
            <Link href={`/families/${family.id}`} className={styles.secondaryButton}><ArrowLeft size={16} />Retour au dossier</Link>
            <button type="submit" className={styles.primaryButton}><Save size={16} />Valider les modifications du dossier</button>
          </div>
        </div>

        <aside className={styles.formRail}>
          <div className={styles.previewCard}>
            <div className={styles.previewIdentity}>
              <Monogram familyName={draft.family_name} parentName={draft.parent_name} />
              <div><h3>{text(draft.family_name, `Famille #${family.id}`)}</h3><p>{text(draft.parent_name)}</p></div>
            </div>
            <div className={styles.passportTags}>
              <StatusBadge value={draft.status} />
              <span className={styles.trustBadge}>Dossier #{family.id}</span>
            </div>
            <div className={styles.miniStats} style={{ marginTop: 16 }}>
              <InfoBox label="Ville" value={text(draft.city, '—')} />
              <InfoBox label="Enfants" value={draft.children_count || '0'} />
              <InfoBox label="Service" value={text(draft.service_preferences, 'À définir')} />
            </div>
          </div>

          <div className={styles.railPanel}>
            <h3 className={styles.railTitle}>Impact de la mise à jour</h3>
            <div className={styles.validationList} style={{ marginTop: 12 }}>
              <div className={styles.validationItem}><History size={14} /><span>{changes.length} champ(s) modifié(s).</span></div>
              <div className={styles.validationItem}><ShieldCheck size={14} /><span>Identifiant famille conservé.</span></div>
              <div className={styles.validationItem}><CheckCircle2 size={14} /><span>Missions, leads et contrats non supprimés.</span></div>
            </div>
          </div>

          <div className={styles.railPanel}>
            <h3 className={styles.railTitle}>Complétude essentielle</h3>
            <div style={{ marginTop: 14 }}>
              <div className={styles.progressMeta}><span>Dossier exploitable</span><strong>{completion}%</strong></div>
              <div className={styles.progressTrack}><div className={styles.progressBar} style={{ width: `${completion}%` }} /></div>
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

function Field({ label, name, value, onChange, type = 'text', required = false, full = false, hint, min }: { label: string; name: keyof Draft; value: string; onChange: (value: string) => void; type?: string; required?: boolean; full?: boolean; hint?: string; min?: string }) {
  return <label className={`${styles.field} ${full ? styles.fieldFull : ''}`}><span className={styles.fieldLabel}>{label}{required ? <span className={styles.required}>Essentiel</span> : null}</span><input className={styles.input} name={name} value={value} onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)} type={type} min={min} />{hint ? <span className={styles.fieldHint}>{hint}</span> : null}</label>
}

function SelectField({ label, name, value, onChange, options }: { label: string; name: keyof Draft; value: string; onChange: (value: string) => void; options: Array<[string, string]> }) {
  return <label className={styles.field}><span className={styles.fieldLabel}>{label}</span><select className={styles.select} name={name} value={value} onChange={(event: ChangeEvent<HTMLSelectElement>) => onChange(event.target.value)}>{options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}</select></label>
}

function TextAreaField({ label, name, value, onChange }: { label: string; name: keyof Draft; value: string; onChange: (value: string) => void }) {
  return <label className={`${styles.field} ${styles.fieldFull}`}><span className={styles.fieldLabel}>{label}</span><textarea className={styles.textarea} name={name} value={value} onChange={(event: ChangeEvent<HTMLTextAreaElement>) => onChange(event.target.value)} /></label>
}
