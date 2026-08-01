'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle,
  Archive,
  BookOpenCheck,
  Boxes,
  CheckCircle2,
  Clock3,
  Database,
  Edit3,
  FileClock,
  Layers3,
  LockKeyhole,
  Save,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from 'lucide-react'
import type { CollectionDossier as CollectionDossierType, TaxonomyNode } from '@/lib/flashcards-os/types'
import styles from './flashcards-os.module.css'

const SECTION_GUIDANCE: Record<string, { title: string; lead: string; delivery: number }> = {
  identity: { title: 'Product identity & classification', lead: 'Identité stable, lignée, rattachement, ownership et statut de cycle de vie.', delivery: 1 },
  doctrine: { title: 'Pedagogical doctrine & objectives', lead: 'Finalité, compétences, méthode pédagogique et résultats attendus.', delivery: 1 },
  audience: { title: 'Audience, age & use-case intelligence', lead: 'Publics, âges, contextes d’usage et conditions d’adaptation.', delivery: 1 },
  cards: { title: 'Structured card register', lead: 'Registre éditorial carte par carte, volontairement séparé du PDF final.', delivery: 1 },
  specification: { title: 'Product & format specification', lead: 'Quantité, format historique, dimensions et future architecture multi-format.', delivery: 1 },
  research: { title: 'Research & evidence', lead: 'Missions Tavily, preuves normalisées et synthèses OpenRouter.', delivery: 2 },
  design: { title: 'Product design intelligence', lead: 'Opportunité, thèse produit, alternatives, différenciation et décisions.', delivery: 2 },
  commands: { title: 'External production commands', lead: 'Commandes lourdes, versionnées et copiables vers les outils externes.', delivery: 3 },
  vault: { title: 'Sources & final deliverables', lead: 'Sources éditables et livrables PDF, MP4 ou classroom sur le Windows Node.', delivery: 3 },
  quality: { title: 'Quality, review & approvals', lead: 'Contrôles linguistiques, pédagogiques, techniques, marque et conformité.', delivery: 1 },
  commercial: { title: 'Costing & commercial readiness', lead: 'Prix historique, futur costing, marge, stock et éligibilité aux offres.', delivery: 1 },
  performance: { title: 'Performance & customer learning', lead: 'Ventes, inclusion dans les offres, retours, plaintes et recommandations.', delivery: 6 },
}

function flatten(nodes: TaxonomyNode[]): TaxonomyNode[] {
  return nodes.flatMap((node) => [node, ...flatten(node.children)])
}

function formatValue(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === '') return 'Non renseigné'
  return String(value)
}

export default function CollectionDossier({
  dossier,
  taxonomy,
  sourceMode,
}: {
  dossier: CollectionDossierType
  taxonomy: TaxonomyNode[]
  sourceMode: 'database' | 'catalogue_seed'
}) {
  const router = useRouter()
  const [section, setSection] = useState('identity')
  const [edit, setEdit] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const nodes = useMemo(() => flatten(taxonomy), [taxonomy])
  const activeSection = dossier.sections.find((item) => item.key === section) || dossier.sections[0]
  const guidance = SECTION_GUIDANCE[section]
  const expected = dossier.expectedCardCount || 0
  const completeness = dossier.sections.length
    ? Math.round(dossier.sections.reduce((sum, item) => sum + item.completeness, 0) / dossier.sections.length)
    : 0
  const lifecycle = ['legacy_intake', 'idea', 'structuring', 'content_draft', 'review', 'approved', 'published', 'archived', 'revision_required']

  async function saveCollection(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setMessage('')
    const data = new FormData(event.currentTarget)
    const split = (name: string) => String(data.get(name) || '').split(',').map((value) => value.trim()).filter(Boolean)
    try {
      const response = await fetch(`/api/flashcards-os/collections/${encodeURIComponent(dossier.code)}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: String(data.get('name') || ''),
          categoryId: String(data.get('categoryId') || dossier.categoryId),
          status: String(data.get('status') || dossier.status),
          lifecycle: String(data.get('lifecycle') || dossier.lifecycle),
          expectedCardCount: data.get('expectedCardCount') ? Number(data.get('expectedCardCount')) : null,
          historicalPriceDh: data.get('historicalPriceDh') ? Number(data.get('historicalPriceDh')) : null,
          ageMinMonths: data.get('ageMinMonths') ? Number(data.get('ageMinMonths')) : null,
          ageMaxMonths: data.get('ageMaxMonths') ? Number(data.get('ageMaxMonths')) : null,
          languages: split('languages'),
          methodologies: split('methodologies'),
          audiences: split('audiences'),
          usageContexts: split('usageContexts'),
          primaryObjective: String(data.get('primaryObjective') || ''),
          owner: String(data.get('owner') || ''),
          notes: String(data.get('notes') || ''),
        }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'La sauvegarde a échoué.')
      setMessage('Dossier mis à jour et événement d’audit enregistré.')
      setEdit(false)
      router.refresh()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Erreur inconnue.')
    } finally {
      setSaving(false)
    }
  }

  function renderIdentity() {
    if (edit) {
      return (
        <form onSubmit={saveCollection}>
          <div className={styles.formGrid} style={{ marginTop: 18 }}>
            <label className={`${styles.field} ${styles.fieldWide}`}><span className={styles.fieldLabel}>Nom officiel</span><input className={styles.fieldInput} name="name" defaultValue={dossier.name} required /></label>
            <label className={styles.field}><span className={styles.fieldLabel}>Sous-catégorie</span><select className={styles.fieldSelect} name="categoryId" defaultValue={dossier.categoryId}>{nodes.filter((node) => node.parentId).map((node) => <option value={node.id} key={node.id}>{node.code} · {node.name}</option>)}</select></label>
            <label className={styles.field}><span className={styles.fieldLabel}>Owner</span><input className={styles.fieldInput} name="owner" defaultValue={dossier.owner} /></label>
            <label className={styles.field}><span className={styles.fieldLabel}>Operational status</span><select className={styles.fieldSelect} name="status" defaultValue={dossier.status}><option value="needs_structuring">Needs structuring</option><option value="needs_review">Needs review</option><option value="active">Active</option><option value="approved">Approved</option><option value="archived">Archived</option></select></label>
            <label className={styles.field}><span className={styles.fieldLabel}>Lifecycle</span><select className={styles.fieldSelect} name="lifecycle" defaultValue={dossier.lifecycle}>{lifecycle.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label className={styles.field}><span className={styles.fieldLabel}>Nombre de cartes attendu</span><input className={styles.fieldInput} name="expectedCardCount" type="number" min="1" defaultValue={dossier.expectedCardCount ?? ''} /></label>
            <label className={styles.field}><span className={styles.fieldLabel}>Prix historique Dh</span><input className={styles.fieldInput} name="historicalPriceDh" type="number" min="0" step="0.01" defaultValue={dossier.historicalPriceDh ?? ''} /></label>
            <label className={styles.field}><span className={styles.fieldLabel}>Âge minimum (mois)</span><input className={styles.fieldInput} name="ageMinMonths" type="number" min="0" defaultValue={dossier.ageMinMonths ?? ''} /></label>
            <label className={styles.field}><span className={styles.fieldLabel}>Âge maximum (mois)</span><input className={styles.fieldInput} name="ageMaxMonths" type="number" min="0" defaultValue={dossier.ageMaxMonths ?? ''} /></label>
            <label className={`${styles.field} ${styles.fieldWide}`}><span className={styles.fieldLabel}>Langues</span><input className={styles.fieldInput} name="languages" defaultValue={dossier.languages.join(', ')} /></label>
            <label className={`${styles.field} ${styles.fieldWide}`}><span className={styles.fieldLabel}>Méthodologies</span><input className={styles.fieldInput} name="methodologies" defaultValue={dossier.methodologies.join(', ')} /></label>
            <label className={`${styles.field} ${styles.fieldWide}`}><span className={styles.fieldLabel}>Objectif principal</span><textarea className={styles.fieldTextarea} name="primaryObjective" defaultValue={dossier.primaryObjective} /></label>
            <label className={`${styles.field} ${styles.fieldWide}`}><span className={styles.fieldLabel}>Audiences</span><input className={styles.fieldInput} name="audiences" defaultValue={dossier.audiences.join(', ')} /></label>
            <label className={`${styles.field} ${styles.fieldWide}`}><span className={styles.fieldLabel}>Contextes d’usage</span><input className={styles.fieldInput} name="usageContexts" defaultValue={dossier.usageContexts.join(', ')} /></label>
            <label className={`${styles.field} ${styles.fieldWide}`}><span className={styles.fieldLabel}>Notes de gouvernance</span><textarea className={styles.fieldTextarea} name="notes" defaultValue={dossier.notes} /></label>
          </div>
          {message ? <div className={message.includes('mis à jour') ? styles.formSuccess : styles.formError}>{message}</div> : null}
          <div className={styles.modalFooter} style={{ paddingInline: 0 }}><button className={styles.ghostButton} type="button" onClick={() => setEdit(false)}>Annuler</button><button className={styles.actionButton} disabled={saving} type="submit"><Save size={14} /> {saving ? 'Sauvegarde…' : 'Sauvegarder le dossier'}</button></div>
        </form>
      )
    }

    return (
      <div className={styles.sectionGrid}>
        <div className={styles.sectionCard}><div className={styles.sectionLabel}>Code canonique</div><div className={styles.sectionValue}>{dossier.code}</div></div>
        <div className={styles.sectionCard}><div className={styles.sectionLabel}>Owner</div><div className={styles.sectionValue}>{dossier.owner}</div></div>
        <div className={styles.sectionCard}><div className={styles.sectionLabel}>Product architecture</div><div className={styles.sectionValue}>{dossier.parentCategoryName}<br />↳ {dossier.categoryName}</div></div>
        <div className={styles.sectionCard}><div className={styles.sectionLabel}>Current lineage</div><div className={styles.sectionValue}>{dossier.version}<br />{dossier.lifecycle}</div></div>
        <div className={styles.sectionCard}><div className={styles.sectionLabel}>Legacy identity</div><div className={styles.sectionValue}>{dossier.legacyDomain} · item {dossier.legacyNumber}<br />Page {dossier.sourcePage}</div></div>
        <div className={styles.sectionCard}><div className={styles.sectionLabel}>Operational status</div><div className={styles.sectionValue}><span className={dossier.status === 'needs_review' ? `${styles.statusPill} ${styles.statusReview}` : styles.statusPill}>{dossier.status}</span></div></div>
        <div className={`${styles.sectionCard} ${styles.sectionCardWide}`}><div className={styles.sectionLabel}>Source limitation</div><div className={styles.sectionValue}>{dossier.primaryObjective}</div></div>
      </div>
    )
  }

  function renderDoctrine() {
    return (
      <div className={styles.sectionGrid}>
        <div className={`${styles.sectionCard} ${styles.sectionCardWide}`}><div className={styles.sectionLabel}>Primary learning objective</div><div className={styles.sectionValue}>{dossier.primaryObjective}</div></div>
        <div className={styles.sectionCard}><div className={styles.sectionLabel}>Methodologies declared in catalogue</div><div className={styles.sectionChips}>{dossier.methodologies.map((item) => <span className={styles.sectionChip} key={item}>{item}</span>)}</div></div>
        <div className={styles.sectionCard}><div className={styles.sectionLabel}>Doctrine status</div><div className={styles.sectionValue}>Initial intake only. Competencies, progression and outcome metrics require product-team structuring.</div></div>
        <div className={`${styles.sectionCard} ${styles.sectionCardWide}`}><div className={styles.sectionLabel}>Integrity rule</div><div className={styles.sectionValue}>The 2022 catalogue does not provide a full pedagogical dossier for this collection. Flashcards OS records the gap and never presents generic educational claims as approved collection doctrine.</div></div>
      </div>
    )
  }

  function renderAudience() {
    return (
      <div className={styles.sectionGrid}>
        <div className={styles.sectionCard}><div className={styles.sectionLabel}>Age window</div><div className={styles.sectionValue}>{formatValue(dossier.ageMinMonths)} → {formatValue(dossier.ageMaxMonths)} mois</div></div>
        <div className={styles.sectionCard}><div className={styles.sectionLabel}>Languages</div><div className={styles.sectionChips}>{dossier.languages.map((item) => <span className={styles.sectionChip} key={item}>{item.toUpperCase()}</span>)}</div></div>
        <div className={styles.sectionCard}><div className={styles.sectionLabel}>Audiences</div><div className={styles.sectionChips}>{dossier.audiences.map((item) => <span className={styles.sectionChip} key={item}>{item}</span>)}</div></div>
        <div className={styles.sectionCard}><div className={styles.sectionLabel}>Usage contexts</div><div className={styles.sectionChips}>{dossier.usageContexts.map((item) => <span className={styles.sectionChip} key={item}>{item}</span>)}</div></div>
        <div className={`${styles.sectionCard} ${styles.sectionCardWide}`}><div className={styles.sectionLabel}>Audience governance</div><div className={styles.sectionValue}>L’extension vers l’orthophonie, l’autisme, l’éducation spécialisée ou les adultes doit être qualifiée au niveau collection, et non héritée automatiquement de la présentation générale du programme.</div></div>
      </div>
    )
  }

  function renderCards() {
    return (
      <div className={styles.sectionGrid}>
        <div className={styles.sectionCard}><div className={styles.sectionLabel}>Expected cards</div><div className={styles.sectionValue}>{dossier.expectedCardCount ?? 'N/A historique'}</div></div>
        <div className={styles.sectionCard}><div className={styles.sectionLabel}>Structured records</div><div className={styles.sectionValue}>{dossier.structuredCardCount}</div></div>
        <div className={`${styles.sectionCard} ${styles.sectionCardWide}`}>
          <div className={styles.integrityTop}><span className={styles.integrityIcon}><BookOpenCheck size={18} /></span><div><div className={styles.integrityTitle}>Card-level source not supplied</div><div className={styles.insightLabel}>No invented content</div></div></div>
          <p className={styles.integrityCopy}>Le catalogue 2022 ne contient pas les concepts, textes recto/verso, traductions, activités ou briefs visuels de chaque carte. Le registre est donc vide jusqu’à import ou saisie des sources réelles.</p>
          <div style={{ marginTop: 13 }}><Link className={styles.actionButton} href={`/flashcards-os/product/collections/${dossier.code.toLowerCase()}/cards`}>Ouvrir Card Content Registry</Link></div>
        </div>
      </div>
    )
  }

  function renderSpecification() {
    return (
      <div className={styles.sectionGrid}>
        <div className={styles.sectionCard}><div className={styles.sectionLabel}>Primary legacy format</div><div className={styles.sectionValue}>{dossier.primaryFormat.replace(/_/g, ' ')}</div></div>
        <div className={styles.sectionCard}><div className={styles.sectionLabel}>Expected quantity</div><div className={styles.sectionValue}>{dossier.expectedCardCount ?? 'À confirmer'}</div></div>
        <div className={styles.sectionCard}><div className={styles.sectionLabel}>Editions registered</div><div className={styles.sectionChips}>{dossier.editions.length ? dossier.editions.map((item) => <span className={styles.sectionChip} key={item.id}>{item.language.toUpperCase()} · {item.status}</span>) : <span className={styles.sectionValue}>Aucune</span>}</div></div>
        <div className={styles.sectionCard}><div className={styles.sectionLabel}>Formats registered</div><div className={styles.sectionChips}>{dossier.formats.map((item) => <span className={styles.sectionChip} key={item.id}>{item.format}</span>)}</div></div>
        <div className={`${styles.sectionCard} ${styles.sectionCardWide}`}><div className={styles.sectionLabel}>Specification debt</div><div className={styles.sectionValue}>Dimensions, matériau, grammage, impression, plastification, packaging, tolérances et exigences digitales ne sont pas présents dans le catalogue fourni. Ils doivent être saisis à partir des sources de production réelles.</div></div>
      </div>
    )
  }

  function renderQuality() {
    return (
      <div className={styles.sectionGrid}>
        <div className={styles.sectionCard}><div className={styles.sectionLabel}>Imported decision flags</div><div className={styles.sectionValue}>{dossier.issueCount}</div><div className={styles.sectionChips}>{dossier.issues.map((item) => <span className={styles.sectionChip} key={item}>{item.replace(/_/g, ' ')}</span>)}</div></div>
        <div className={styles.sectionCard}><div className={styles.sectionLabel}>Release status</div><div className={styles.sectionValue}>No controlled release registered in Ultra Mega ZIP 1.</div></div>
        <div className={`${styles.sectionCard} ${styles.sectionCardWide}`}><div className={styles.sectionLabel}>Review council</div><div className={styles.sectionValue}>Pedagogical, linguistic, brand, technical and rights-review records are structurally supported by the schema. Final approval workflows are activated progressively with the relevant production and vault engines.</div></div>
      </div>
    )
  }

  function renderCommercial() {
    return (
      <div className={styles.sectionGrid}>
        <div className={styles.sectionCard}><div className={styles.sectionLabel}>Historical catalogue price</div><div className={styles.sectionValue}>{dossier.historicalPriceDh == null ? 'Non renseigné' : `${dossier.historicalPriceDh} Dh`}</div></div>
        <div className={styles.sectionCard}><div className={styles.sectionLabel}>Commercial status</div><div className={styles.sectionValue}>Legacy reference only · not approved as current price book.</div></div>
        <div className={`${styles.sectionCard} ${styles.sectionCardWide}`}><div className={styles.sectionLabel}>Deterministic pricing doctrine</div><div className={styles.sectionValue}>Le prix historique est préservé comme preuve. Coûts, marge, taxes, conditionnement, remises et prix B2C/B2B seront gérés par le moteur commercial déterministe; aucune valeur financière ne sera inventée par l’IA.</div></div>
      </div>
    )
  }

  function renderFuture() {
    return (
      <div className={styles.futurePanel}>
        <div className={styles.futurePanelInner}>
          <span className={styles.futureIcon}>{section === 'vault' ? <Archive size={25} /> : section === 'performance' ? <UsersRound size={25} /> : <Sparkles size={25} />}</span>
          <h3 className={styles.futureTitle}>{guidance.title}</h3>
          <p className={styles.futureCopy}>{guidance.lead}</p>
          <p className={styles.futureCopy}><strong>Contracted activation: Ultra Mega ZIP {guidance.delivery}.</strong> The data boundary and dossier position are reserved now, but no fake engine or decorative output has been inserted.</p>
          <span className={styles.statusPill} style={{ marginTop: 14 }}><LockKeyhole size={11} /> Architecture reserved</span>
        </div>
      </div>
    )
  }

  const renderSection = () => {
    if (section === 'identity') return renderIdentity()
    if (section === 'doctrine') return renderDoctrine()
    if (section === 'audience') return renderAudience()
    if (section === 'cards') return renderCards()
    if (section === 'specification') return renderSpecification()
    if (section === 'quality') return renderQuality()
    if (section === 'commercial') return renderCommercial()
    return renderFuture()
  }

  return (
    <>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Product · Collection dossier</p>
          <h1 className={styles.pageTitle}>Product Passport</h1>
          <p className={styles.pageLead}>Un dossier de gouvernance complet, séparant la vérité produit, les versions, les formats, le contenu structuré et les futurs livrables.</p>
        </div>
        <div className={styles.headerActions}>
          <span className={styles.sourceBanner}><Database size={13} /> {sourceMode === 'database' ? 'Live record' : 'Seed evidence mode'}</span>
          <Link className={styles.secondaryButton} href={`/flashcards-os/product/collections/${dossier.code.toLowerCase()}/cards`}><Layers3 size={14} /> Card Registry</Link>
          <button className={styles.actionButton} type="button" onClick={() => { setSection('identity'); setEdit(true) }}><Edit3 size={14} /> Edit dossier</button>
        </div>
      </header>

      <section className={styles.dossier}>
        <article className={styles.dossierPassport}>
          <span className={styles.passportStripe} />
          <div className={styles.passportTop}>
            <span className={styles.passportGlyph}><Boxes size={28} /></span>
            <div>
              <div className={styles.passportCode}>{dossier.code} · {dossier.parentCategoryName}</div>
              <h2 className={styles.passportTitle}>{dossier.name}</h2>
              <div className={styles.passportMeta}>
                <span className={styles.metaChip}>{dossier.categoryName}</span>
                <span className={styles.metaChip}>{dossier.primaryFormat.replace(/_/g, ' ')}</span>
                <span className={styles.metaChip}>{dossier.expectedCardCount ?? 'N/A'} cartes attendues</span>
                <span className={styles.metaChip}>{dossier.languages.map((item) => item.toUpperCase()).join(' · ')}</span>
                {dossier.issueCount ? <span className={`${styles.metaChip} ${styles.statusReview}`}>{dossier.issueCount} decision flags</span> : null}
              </div>
            </div>
            <div className={styles.passportScore}><div className={styles.passportScoreValue}>{completeness}%</div><div className={styles.passportScoreLabel}>Dossier completeness</div></div>
          </div>
          <div className={styles.lifecycleStrip}>
            {lifecycle.map((item) => <div className={`${styles.lifecycleStep} ${item === dossier.lifecycle ? styles.lifecycleStepCurrent : ''}`} key={item}>{item.replace(/_/g, ' ')}</div>)}
          </div>
        </article>

        <div className={styles.dossierBody}>
          <nav className={styles.dossierNav} aria-label="Sections du dossier">
            {dossier.sections.map((item, index) => (
              <button className={`${styles.dossierNavButton} ${section === item.key ? styles.dossierNavActive : ''}`} type="button" onClick={() => { setSection(item.key); setEdit(false); setMessage('') }} key={item.key}>
                <span className={styles.dossierNavIndex}>{String(index + 1).padStart(2, '0')}</span>
                <span className={styles.dossierNavLabel}>{item.label}</span>
                <span className={styles.dossierNavProgress}>{item.completeness}%</span>
              </button>
            ))}
          </nav>

          <article className={styles.dossierWorkspace}>
            <div className={styles.workspaceHeader}>
              <div><p className={styles.eyebrow}>Section {String(dossier.sections.findIndex((item) => item.key === section) + 1).padStart(2, '0')} · U{guidance.delivery}</p><h3 className={styles.workspaceTitle}>{guidance.title}</h3><p className={styles.workspaceLead}>{guidance.lead}</p></div>
              <span className={activeSection.status === 'future_engine' ? styles.statusPill : activeSection.status === 'ready' ? `${styles.statusPill} ${styles.statusGood}` : `${styles.statusPill} ${styles.statusReview}`}>{activeSection.status.replace(/_/g, ' ')}</span>
            </div>
            {renderSection()}
          </article>

          <aside className={styles.dossierIntelligence}>
            <section className={styles.timelinePanel}>
              <div className={styles.panelHeader} style={{ padding: 0, paddingBottom: 15 }}><div><h3 className={styles.panelTitle}>Decision timeline</h3><p className={styles.panelSubtitle}>Lignée, source et alertes.</p></div><FileClock size={17} color="#3150b5" /></div>
              {dossier.timeline.length ? dossier.timeline.map((item) => (
                <div className={styles.timelineItem} key={item.id}><span className={`${styles.timelineDot} ${item.tone === 'warning' ? styles.timelineWarning : ''}`} /><div className={styles.timelineLabel}>{item.label}</div><div className={styles.timelineDetail}>{item.detail}</div></div>
              )) : <p className={styles.timelineDetail}>Aucun événement encore enregistré.</p>}
            </section>
            <section className={styles.evidencePanel}>
              <div className={styles.integrityTop}><span className={styles.integrityIcon}><ShieldCheck size={18} /></span><div><div className={styles.integrityTitle}>Evidence lock</div><div className={styles.insightLabel}>Catalogue 2022 · page {dossier.sourcePage}</div></div></div>
              <p className={styles.integrityCopy}>Le nom, le nombre de cartes et le prix historique sont conservés avec leur provenance. Les contenus non présents restent explicitement non renseignés.</p>
            </section>
            {dossier.issueCount ? (
              <section className={styles.evidencePanel}>
                <div className={styles.integrityTop}><span className={styles.integrityIcon} style={{ background: '#fff0d8', color: '#9b4b09' }}><AlertTriangle size={18} /></span><div><div className={styles.integrityTitle}>Human arbitration</div><div className={styles.insightLabel}>{dossier.issueCount} open decision(s)</div></div></div>
                <div className={styles.sectionChips}>{dossier.issues.map((item) => <span className={styles.sectionChip} key={item}>{item.replace(/_/g, ' ')}</span>)}</div>
              </section>
            ) : (
              <section className={styles.evidencePanel}><div className={styles.integrityTop}><span className={styles.integrityIcon}><CheckCircle2 size={18} /></span><div><div className={styles.integrityTitle}>No imported anomaly</div><div className={styles.insightLabel}>Source intake clear</div></div></div></section>
            )}
            <section className={styles.evidencePanel}>
              <div className={styles.insightLabel}>Structured content progress</div>
              <div className={styles.insightValue}>{dossier.structuredCardCount}/{dossier.expectedCardCount ?? 'N/A'}</div>
              <div className={styles.progressTrack}><div className={styles.progressFill} style={{ width: expected ? `${Math.min(100, Math.round(dossier.structuredCardCount / expected * 100))}%` : '0%' }} /></div>
            </section>
          </aside>
        </div>
      </section>
    </>
  )
}
