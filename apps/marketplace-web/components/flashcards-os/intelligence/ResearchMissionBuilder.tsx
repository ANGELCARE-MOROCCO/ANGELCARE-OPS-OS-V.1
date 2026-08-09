'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, CheckCircle2, CircleDollarSign, Globe2, SearchCheck, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import styles from '../flashcards-os.module.css'

const PURPOSES = [
  ['new_collection_opportunity', 'Nouvelle opportunité collection'], ['product_concept_validation', 'Validation d’un concept'], ['format_benchmark', 'Benchmark format'], ['methodology_review', 'Revue méthodologique'], ['age_suitability', 'Adéquation par âge'], ['institutional_demand', 'Demande institutionnelle'], ['competitor_portfolio', 'Portefeuille concurrent'], ['parent_pain_points', 'Pain points parents'], ['specialist_use_case', 'Usage spécialiste'], ['market_positioning', 'Positionnement marché'], ['cultural_adaptation', 'Adaptation culturelle'], ['content_gap', 'Gap de contenu'],
]

export default function ResearchMissionBuilder() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    title: '', strategicQuestion: '', purpose: 'new_collection_opportunity', mode: 'deep_evidence', productDomain: '', audienceProfiles: '', geographicScope: 'Maroc, International', languages: 'fr, en', sourceCategories: 'research, institutions, market', includeDomains: '', excludeDomains: '', plannedQueries: '', searchDepth: 'advanced', sourceLimit: 12, budgetCredits: 20, ownerName: 'Direction Produit', reviewerName: 'Direction Générale', deadline: '',
  })
  const queryCount = useMemo(() => form.plannedQueries.split('\n').map((item) => item.trim()).filter(Boolean).length, [form.plannedQueries])
  function field(name: string, value: string | number) { setForm((current) => ({ ...current, [name]: value })) }
  function csv(value: string) { return value.split(',').map((item) => item.trim()).filter(Boolean) }

  async function submit() {
    setBusy(true); setError('')
    try {
      const response = await fetch('/api/flashcards-os/intelligence/research/missions', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...form, audienceProfiles: csv(form.audienceProfiles), geographicScope: csv(form.geographicScope), languages: csv(form.languages), sourceCategories: csv(form.sourceCategories), includeDomains: csv(form.includeDomains), excludeDomains: csv(form.excludeDomains), plannedQueries: form.plannedQueries.split('\n').map((item) => item.trim()).filter(Boolean) }) })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'Mission creation failed.')
      router.push(`/flashcards-os/intelligence/research/${payload.mission.id}`)
      router.refresh()
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Mission creation failed.') } finally { setBusy(false) }
  }

  return (
    <div className={styles.missionBuilderPage}>
      <header className={styles.missionBuilderHeader}>
        <Link href="/flashcards-os/intelligence/research"><ArrowLeft size={16} /> Mission Control</Link>
        <div><span>MISSION ARCHITECT · ÉTAPE {step}/4</span><h1>Construire une recherche qui mérite d’être exécutée.</h1></div>
        <div className={styles.builderStepRail}>{[1,2,3,4].map((value) => <button type="button" className={value === step ? styles.builderStepActive : value < step ? styles.builderStepDone : ''} onClick={() => setStep(value)} key={value}>{value < step ? <CheckCircle2 size={15} /> : value}</button>)}</div>
      </header>

      <section className={styles.missionBuilderCanvas}>
        <main className={styles.missionBuilderMain}>
          {step === 1 ? <div className={styles.builderSection}><div className={styles.builderSectionTitle}><SearchCheck size={20} /><div><span>01 · STRATEGIC QUESTION</span><h2>Quel problème décisionnel devons-nous résoudre ?</h2></div></div><label>Nom exécutif de la mission<input value={form.title} onChange={(e: any) => field('title', e.target.value)} placeholder="Ex. Opportunité bilingual Home Routine 3–6 ans" /></label><label>Question stratégique<textarea value={form.strategicQuestion} onChange={(e: any) => field('strategicQuestion', e.target.value)} rows={5} placeholder="Formulez la décision attendue, pas seulement un sujet de recherche." /></label><div className={styles.builderTwoColumns}><label>Finalité<select value={form.purpose} onChange={(e: any) => field('purpose', e.target.value)}>{PURPOSES.map(([value,label]) => <option value={value} key={value}>{label}</option>)}</select></label><label>Domaine produit<input value={form.productDomain} onChange={(e: any) => field('productDomain', e.target.value)} placeholder="Langage, routines, inclusion…" /></label></div></div> : null}
          {step === 2 ? <div className={styles.builderSection}><div className={styles.builderSectionTitle}><Globe2 size={20} /><div><span>02 · RESEARCH PERIMETER</span><h2>Définir la profondeur, les territoires et les sources.</h2></div></div><div className={styles.builderModeGrid}>{[['rapid_scan','Rapid scan','Validation préliminaire et terminologie.'],['deep_evidence','Deep evidence','Mission multi-source pour décision produit.'],['known_source','Known source','Extraction de sources déjà identifiées.'],['domain_investigation','Domain investigation','Cartographie ciblée d’un domaine.']].map(([value,label,detail]) => <button type="button" className={form.mode === value ? styles.builderModeActive : ''} onClick={() => field('mode', value)} key={value}><strong>{label}</strong><span>{detail}</span></button>)}</div><div className={styles.builderTwoColumns}><label>Périmètre géographique<input value={form.geographicScope} onChange={(e: any) => field('geographicScope', e.target.value)} /></label><label>Langues de recherche<input value={form.languages} onChange={(e: any) => field('languages', e.target.value)} /></label><label>Profils audiences<input value={form.audienceProfiles} onChange={(e: any) => field('audienceProfiles', e.target.value)} placeholder="parents, écoles, orthophonistes" /></label><label>Catégories sources<input value={form.sourceCategories} onChange={(e: any) => field('sourceCategories', e.target.value)} /></label><label>Domaines inclus<input value={form.includeDomains} onChange={(e: any) => field('includeDomains', e.target.value)} placeholder="unicef.org, nih.gov" /></label><label>Domaines exclus<input value={form.excludeDomains} onChange={(e: any) => field('excludeDomains', e.target.value)} placeholder="réseaux non vérifiés…" /></label></div></div> : null}
          {step === 3 ? <div className={styles.builderSection}><div className={styles.builderSectionTitle}><ShieldCheck size={20} /><div><span>03 · QUERY ARCHITECTURE</span><h2>Programmer des angles de recherche contrôlés.</h2></div></div><label>Une requête par ligne<textarea value={form.plannedQueries} onChange={(e: any) => field('plannedQueries', e.target.value)} rows={10} placeholder={'Flashcards home routine bilingual early childhood market\nVisual routines speech therapy evidence\nInstitutional procurement educational cards Morocco'} /></label><div className={styles.queryArchitectureSummary}><strong>{queryCount}</strong><span>requêtes planifiées</span><i>Le système les exécute sous plafond, puis déduplique les sources.</i></div></div> : null}
          {step === 4 ? <div className={styles.builderSection}><div className={styles.builderSectionTitle}><CircleDollarSign size={20} /><div><span>04 · AUTHORITY & COST</span><h2>Fixer les limites avant l’acquisition.</h2></div></div><div className={styles.builderTwoColumns}><label>Profondeur<select value={form.searchDepth} onChange={(e: any) => field('searchDepth', e.target.value)}><option value="basic">Basic</option><option value="advanced">Advanced</option></select></label><label>Nombre maximal de sources<input type="number" min={3} max={50} value={form.sourceLimit} onChange={(e: any) => field('sourceLimit', Number(e.target.value))} /></label><label>Plafond crédits Tavily<input type="number" min={1} max={500} value={form.budgetCredits} onChange={(e: any) => field('budgetCredits', Number(e.target.value))} /></label><label>Échéance<input type="date" value={form.deadline} onChange={(e: any) => field('deadline', e.target.value)} /></label><label>Propriétaire<input value={form.ownerName} onChange={(e: any) => field('ownerName', e.target.value)} /></label><label>Réviseur<input value={form.reviewerName} onChange={(e: any) => field('reviewerName', e.target.value)} /></label></div><div className={styles.missionAuthorityNotice}><ShieldCheck size={18} /><div><strong>La création ne lance pas Tavily.</strong><p>La mission reste en draft jusqu’à soumission, approbation et exécution explicite par une autorité habilitée.</p></div></div></div> : null}
          {error ? <div className={styles.intelErrorBanner}>{error}</div> : null}
          <footer className={styles.builderFooter}><button type="button" className={styles.intelSecondaryAction} disabled={step === 1} onClick={() => setStep((value) => Math.max(1, value - 1))}><ArrowLeft size={15} /> Précédent</button>{step < 4 ? <button type="button" className={styles.intelPrimaryAction} onClick={() => setStep((value) => Math.min(4, value + 1))}>Continuer <ArrowRight size={15} /></button> : <button type="button" className={styles.intelPrimaryAction} disabled={busy || !form.title.trim() || !form.strategicQuestion.trim() || !queryCount} onClick={submit}>{busy ? 'Création…' : 'Créer la mission gouvernée'} <CheckCircle2 size={15} /></button>}</footer>
        </main>
        <aside className={styles.missionBuilderDoctrine}><span>MISSION DOCTRINE</span><h3>Ce qui sort du système est une preuve, pas une impression.</h3><ul><li>Question décisionnelle explicite</li><li>Sources externes uniquement via Tavily</li><li>Aucune donnée client privée</li><li>Budget et volume plafonnés</li><li>OpenRouter après normalisation</li><li>Arbitrage humain obligatoire</li></ul><div><strong>{form.sourceLimit}</strong><span>sources max</span></div><div><strong>{form.budgetCredits}</strong><span>crédits max</span></div></aside>
      </section>
    </div>
  )
}
