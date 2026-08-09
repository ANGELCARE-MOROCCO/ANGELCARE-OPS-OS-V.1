"use client"

import * as React from "react"
import Link from "next/link"
import {
  AlertOctagon, Archive, ArrowRight, BookOpenCheck, CheckCircle2, CircleDot,
  FileWarning, Gavel, GitBranch, Languages, Plus, Search, ShieldCheck, Sparkles,
  Tags, TriangleAlert, Workflow,
} from "lucide-react"
import { type BrandRule, type ContentItem, statusLabel, uid, useContentStore } from "../content-command-system"
import type { StrategicContext } from "./bulk2-types"
import { brandViolations } from "./bulk2-derivations"
import { readStrategicContext, strategicHref } from "./bulk2-context"
import { Drawer, EmptyStrategicState, Notice, StrategicContextSidecar, StrategicIdentityStrip } from "./Bulk2Shared"
import styles from "./bulk2-experience.module.css"

const categories: BrandRule["category"][] = ["Tone", "Compliance", "Visual", "Message", "CTA", "Medical sensitivity"]

function applicability(rule: BrandRule, item: ContentItem | null) {
  if (!item) return { applies: false, basis: "Sélectionnez un contenu pour calculer l’applicabilité." }
  if (!rule.active) return { applies: false, basis: "La doctrine est hors vigueur." }
  if (rule.category === "CTA") return { applies: ["Blog", "Instagram", "Facebook", "TikTok", "LinkedIn", "Newsletter", "WhatsApp", "Landing Page", "Clinic Partner", "Ambassador Kit"].includes(item.channel), basis: `Canal ${item.channel} identifié comme sortie avec action attendue.` }
  if (rule.category === "Visual") return { applies: !["Blog", "Newsletter"].includes(item.channel) || item.assets.length > 0, basis: `Canal ${item.channel} et ${item.assets.length} asset(s) observé(s).` }
  if (rule.category === "Medical sensitivity") return { applies: /care|sant|diagnos|guér|medical|médical|post.?partum|enfant/i.test(`${item.title} ${item.body} ${item.audience}`), basis: "Termes liés au care, à l’enfant ou à la santé observés dans le contenu." }
  if (rule.category === "Compliance") return { applies: true, basis: "Contrôle de conformité applicable à tout contenu institutionnel." }
  if (rule.category === "Message") return { applies: Boolean(item.body || item.objective), basis: "Un message ou un objectif est présent." }
  return { applies: true, basis: "Doctrine de ton applicable à toute communication ANGELCARE." }
}

export default function Bulk2BrandGovernanceWorkspace() {
  const { store, commit } = useContentStore()
  const [query, setQuery] = React.useState("")
  const [category, setCategory] = React.useState("all")
  const [selectedRuleId, setSelectedRuleId] = React.useState("")
  const [selectedItemId, setSelectedItemId] = React.useState("")
  const [createOpen, setCreateOpen] = React.useState(false)
  const [exceptionOpen, setExceptionOpen] = React.useState(false)
  const [notice, setNotice] = React.useState<{ tone: "success" | "warning" | "danger"; text: string } | null>(null)
  const [strategicContext, setStrategicContext] = React.useState<StrategicContext | null>(null)
  const [form, setForm] = React.useState<BrandRule>({ id: uid("rule"), title: "", category: "Tone", required: true, active: true, notes: "" })
  const [exception, setException] = React.useState({ reason: "", compensatingControl: "", authority: "", expiration: "" })

  React.useEffect(() => { setStrategicContext(readStrategicContext()) }, [])

  const rules = React.useMemo(() => store.rules.filter((rule) => `${rule.title} ${rule.category} ${rule.notes}`.toLowerCase().includes(query.toLowerCase()) && (category === "all" || rule.category === category)), [store.rules, query, category])
  const selectedRule = store.rules.find((rule) => rule.id === selectedRuleId) || rules[0] || null
  const selectedItem = store.items.find((item) => item.id === selectedItemId) || store.items[0] || null
  const allViolations = React.useMemo(() => brandViolations(store.items, store.rules), [store.items, store.rules])
  const selectedViolations = selectedItem ? allViolations.filter((violation) => violation.item.id === selectedItem.id) : []
  const applicable = selectedItem ? store.rules.map((rule) => ({ rule, ...applicability(rule, selectedItem) })).filter((entry) => entry.applies) : []
  const ruleHistory = selectedRule ? store.logs.filter((log) => log.detail.includes(selectedRule.title) || log.detail.includes(selectedRule.id)).slice(0, 12) : []
  const exceptionHistory = selectedItem ? store.logs.filter((log) => log.detail.includes(`[brand-exception:${selectedItem.id}]`)).slice(0, 8) : []

  const context: StrategicContext = {
    caseId: strategicContext?.caseId || selectedItem?.id,
    caseCode: strategicContext?.caseCode || selectedItem?.id,
    title: strategicContext?.title || selectedItem?.title,
    stage: "brand",
    owner: selectedItem?.owner,
    deadline: selectedItem?.dueDate,
    status: selectedViolations.length ? `${selectedViolations.length} violation(s)` : selectedItem ? "Contrôle sans violation déterministe" : "Aucun contenu",
    returnTo: "/market-os/content-command-center/brand-governance",
  }

  function addRule() {
    if (!form.title.trim()) return
    const next = { ...form, id: form.id || uid("rule") }
    commit((draft) => { draft.rules = [next, ...draft.rules] }, "brand rule create", `[brand-rule:${next.id}] Règle créée : ${next.title}`)
    setSelectedRuleId(next.id); setCreateOpen(false)
    setForm({ id: uid("rule"), title: "", category: "Tone", required: true, active: true, notes: "" })
    setNotice({ tone: "success", text: "Doctrine ajoutée au registre existant. Son applicabilité est recalculée sur les contenus observables." })
  }

  function toggleRule(rule: BrandRule) {
    commit((draft) => { draft.rules = draft.rules.map((item) => item.id === rule.id ? { ...item, active: !item.active } : item) }, "brand rule toggle", `[brand-rule:${rule.id}] ${rule.title} : ${rule.active ? "désactivée" : "activée"}`)
    setNotice({ tone: "success", text: `Règle ${rule.active ? "désactivée" : "activée"}. L’historique reste observable dans le journal.` })
  }

  function recordException() {
    if (!selectedItem || !selectedRule || !exception.reason.trim()) return
    commit(() => undefined, "brand exception request", `[brand-exception:${selectedItem.id}] Règle ${selectedRule.id}; demandeur/autorité ${exception.authority || "non renseignée"}; expiration ${exception.expiration || "non renseignée"}; raison ${exception.reason}; contrôle compensatoire ${exception.compensatingControl || "non renseigné"}`)
    setExceptionOpen(false); setException({ reason: "", compensatingControl: "", authority: "", expiration: "" })
    setNotice({ tone: "warning", text: "Demande consignée dans l’audit existant. Elle n’est pas présentée comme approuvée : le modèle ne fournit pas d’entité d’exception structurée." })
  }

  const nextAction = !selectedItem ? "Sélectionner un contenu" : selectedViolations.length ? "Corriger la violation" : applicable.some((entry) => entry.rule.required) ? "Confirmer la readiness marque" : "Ouvrir le brief"

  return <main aria-label="Brand Governance AngelCare" className={`${styles.bulk2Canvas} ${styles.brandCanvas}`}>
    <section className={styles.brandHero}>
      <div className={styles.constitutionSeal}><Gavel/><span>ANGELCARE</span><small>BRAND AUTHORITY</small></div>
      <div className={styles.heroCopy}><span>Brand Constitution Chamber</span><h1>Faire de la marque une autorité opérationnelle, pas un simple style guide.</h1><p>Les doctrines, leur applicabilité, les écarts et les demandes d’exception restent explicites. Aucun contenu n’est déclaré conforme sur la base d’un décor ou d’un score inventé.</p></div>
      <div className={styles.heroCommandCluster}><button className={styles.sovereignButton} onClick={() => setCreateOpen(true)}><Plus/> Créer une doctrine</button><Link className={styles.secondaryButton} href={strategicHref("/market-os/content-command-center/briefs", { ...context, stage: "brief" })}><BookOpenCheck/> Briefing Suite</Link></div>
    </section>

    {notice ? <Notice tone={notice.tone} onClose={() => setNotice(null)}>{notice.text}</Notice> : null}
    <StrategicIdentityStrip context={context} nextAction={nextAction}/>

    <section className={styles.brandCommandBar}>
      <label className={styles.searchControl}><Search/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Doctrine, catégorie ou rationale…"/></label>
      <select className={styles.selectControl} value={category} onChange={(event) => setCategory(event.target.value)}><option value="all">Toutes les catégories</option>{categories.map((value) => <option key={value}>{value}</option>)}</select>
      <select className={styles.selectControl} value={selectedItem?.id || ""} onChange={(event) => setSelectedItemId(event.target.value)} aria-label="Contenu à contrôler"><option value="">Sélectionner un contenu</option>{store.items.map((item) => <option value={item.id} key={item.id}>{item.title}</option>)}</select>
      <div className={styles.truthCounters}><span><strong>{store.rules.filter((rule) => rule.active).length}</strong> doctrines actives</span><span><strong>{allViolations.length}</strong> écarts</span><span><strong>{exceptionHistory.length}</strong> demandes consignées</span></div>
    </section>

    <div className={styles.brandChamber}>
      <aside className={styles.doctrineLibrary}>
        <header className={styles.zoneHeader}><div><span>01 · Doctrine Library</span><h2>Constitution de marque</h2><p>Registre persistant actuel, sans règle fictive.</p></div><BookOpenCheck/></header>
        <div className={styles.doctrineRows}>{rules.map((rule) => <button key={rule.id} className={selectedRule?.id === rule.id ? styles.doctrineRowActive : styles.doctrineRow} onClick={() => setSelectedRuleId(rule.id)}><header><span className={rule.required ? styles.requiredBadge : styles.recommendedBadge}>{rule.required ? "Obligatoire" : "Recommandée"}</span><small>{rule.active ? "En vigueur" : "Hors vigueur"}</small></header><strong>{rule.title}</strong><p>{rule.category}</p><footer>{rule.notes || "Rationale non renseignée"}</footer></button>)}{!rules.length ? <EmptyStrategicState title="Aucune doctrine dans ce filtre" detail="Créez une règle réelle avec son rationale, sa catégorie et son obligation." action={<button className={styles.inlineAction} onClick={() => setCreateOpen(true)}>Créer une doctrine <ArrowRight/></button>}/> : null}</div>
      </aside>

      <section className={styles.doctrineStage}>
        {selectedRule ? <>
          <header className={styles.doctrineTitle}><div><span>DOCTRINE {selectedRule.id}</span><h2>{selectedRule.title}</h2><p>{selectedRule.notes || "Aucun rationale enregistré."}</p></div><button className={selectedRule.active ? styles.dangerButton : styles.sovereignButton} onClick={() => toggleRule(selectedRule)}>{selectedRule.active ? <><Archive/> Suspendre</> : <><CheckCircle2/> Activer</>}</button></header>
          <div className={styles.doctrineFacts}><article><small>Catégorie</small><strong>{selectedRule.category}</strong></article><article><small>Obligation</small><strong>{selectedRule.required ? "Obligatoire" : "Recommandée"}</strong></article><article><small>État</small><strong>{selectedRule.active ? "En vigueur" : "Hors vigueur"}</strong></article><article><small>Version</small><strong>Non structurée dans BrandRule</strong></article></div>

          <section className={styles.applicabilityEngine}>
            <header className={styles.subsectionTitle}><div><span>02 · Applicability Engine</span><h3>Pourquoi cette doctrine s’applique — ou non</h3></div><Tags/></header>
            {selectedItem ? <div className={styles.applicabilityCase}><article className={styles.selectedContentCard}><span>{selectedItem.channel}</span><h4>{selectedItem.title}</h4><p>{selectedItem.campaign || "Campagne non renseignée"} · {selectedItem.audience || "Audience non renseignée"}</p><footer><span>{selectedItem.assets.length} asset(s)</span><span>Score observé {selectedItem.brandScore}%</span></footer></article><div className={styles.applicableRules}>{store.rules.map((rule) => { const state = applicability(rule, selectedItem); return <article key={rule.id} className={state.applies ? styles.applies : styles.notApplies}><span>{state.applies ? <CheckCircle2/> : <CircleDot/>}</span><div><strong>{rule.title}</strong><p>{state.basis}</p></div><small>{state.applies ? "Applicable" : "Non applicable"}</small></article> })}</div></div> : <EmptyStrategicState title="Sélectionnez un contenu" detail="L’applicabilité utilise le canal, le message, l’audience et les assets persistés. Elle ne peut pas être calculée sans objet."/>}
          </section>

          <section className={styles.violationInspector}>
            <header className={styles.subsectionTitle}><div><span>03 · Violation Inspector</span><h3>Écarts déterministes et corrections attendues</h3></div><FileWarning/></header>
            <div className={styles.violationRows}>{selectedViolations.map((violation) => <article key={violation.id}><span className={styles.violationSeverity}><AlertOctagon/></span><div><strong>{violation.issue}</strong><p>{violation.rule.title}</p><small>{violation.item.title} · {violation.item.channel}</small></div><Link href={`/market-os/content-command-center/${encodeURIComponent(violation.item.id)}/edit?returnTo=${encodeURIComponent("/market-os/content-command-center/brand-governance")}`}>Corriger <ArrowRight/></Link></article>)}{selectedItem && !selectedViolations.length ? <div className={styles.noViolation}><ShieldCheck/><div><strong>Aucun écart déterministe détecté</strong><p>Cela ne remplace pas une revue humaine complète ni une validation formelle.</p></div></div> : !selectedItem ? <EmptyStrategicState title="Aucun objet contrôlé" detail="Sélectionnez un contenu pour inspecter les écarts liés aux doctrines actives."/> : null}</div>
          </section>

          <section className={styles.exceptionChamber}>
            <header><Sparkles/><div><span>04 · Exception Chamber</span><h3>Une exception doit rester une demande d’autorité</h3></div></header>
            <p>Le store actuel ne contient pas d’entité persistante d’exception. Bulk 2 consigne les demandes dans l’audit sans les présenter comme approuvées.</p>
            <div>{exceptionHistory.map((log) => <article key={log.id}><TriangleAlert/><div><strong>{log.action}</strong><p>{log.detail}</p><small>{new Date(log.timestamp).toLocaleString("fr-FR")}</small></div></article>)}{!exceptionHistory.length ? <span className={styles.noException}>Aucune demande consignée pour ce contenu.</span> : null}</div>
            <button className={styles.secondaryButton} disabled={!selectedItem || !selectedRule} onClick={() => setExceptionOpen(true)}><Plus/> Demander une exception</button>
          </section>

          <section className={styles.doctrineVersionAuthority}>
            <header className={styles.subsectionTitle}><div><span>05 · Doctrine Version Authority</span><h3>Historique observable, sans faux numéro de version</h3></div><Workflow/></header>
            <div>{ruleHistory.map((log) => <article key={log.id}><span>{new Date(log.timestamp).toLocaleDateString("fr-FR")}</span><div><strong>{log.action}</strong><p>{log.detail}</p></div></article>)}{!ruleHistory.length ? <p>Aucun événement spécifique à cette doctrine dans le journal observable.</p> : null}</div>
          </section>
        </> : <EmptyStrategicState title="Sélectionnez une doctrine" detail="Applicabilité, écarts, exceptions et historique apparaîtront ici."/>}
      </section>

      <StrategicContextSidecar context={context} sections={[
        { label: "Doctrines applicables", value: selectedItem ? String(applicable.length) : "—", tone: selectedItem ? "success" : "neutral" },
        { label: "Violations", value: String(selectedViolations.length), tone: selectedViolations.length ? "danger" : selectedItem ? "success" : "neutral" },
        { label: "Exceptions", value: String(exceptionHistory.length), tone: exceptionHistory.length ? "warning" : "neutral" },
        { label: "Autorité", value: "Non exposée par le modèle", tone: "warning" },
      ]}/>
    </div>

    <section className={styles.brandReadinessDeck}>
      <article className={styles.brandReadinessGate}><header><ShieldCheck/><div><span>06 · Brand Readiness Gate</span><h2>{selectedItem?.title || "Aucun contenu sélectionné"}</h2></div></header><div className={styles.brandReadinessChecks}><article className={selectedItem ? styles.checkPassed : styles.checkMissing}>{selectedItem ? <CheckCircle2/> : <AlertOctagon/>}<div><strong>Objet identifié</strong><p>{selectedItem ? selectedItem.id : "Sélection requise"}</p></div></article><article className={applicable.filter((entry) => entry.rule.required).length ? styles.checkPassed : styles.checkMissing}>{applicable.filter((entry) => entry.rule.required).length ? <CheckCircle2/> : <AlertOctagon/>}<div><strong>Doctrines obligatoires</strong><p>{applicable.filter((entry) => entry.rule.required).length} applicable(s)</p></div></article><article className={selectedViolations.length ? styles.checkMissing : styles.checkPassed}>{selectedViolations.length ? <AlertOctagon/> : <CheckCircle2/>}<div><strong>Violations bloquantes</strong><p>{selectedViolations.length ? `${selectedViolations.length} à corriger ou gouverner.` : "Aucune violation déterministe."}</p></div></article><article className={exceptionHistory.length ? styles.checkMissing : styles.checkPassed}>{exceptionHistory.length ? <AlertOctagon/> : <CheckCircle2/>}<div><strong>Exception ouverte</strong><p>{exceptionHistory.length ? "Demande enregistrée, décision non structurée." : "Aucune demande."}</p></div></article></div><footer><p>La readiness indique uniquement les contrôles observables. Elle ne remplace pas la Validation Chamber.</p><Link className={styles.sovereignButton} href={strategicHref("/market-os/content-command-center/briefs", { ...context, stage: "brief" })}>Retour au brief <ArrowRight/></Link></footer></article>
      <article className={styles.languageGovernance}><header><Languages/><span>Gouvernance linguistique</span></header><h3>Limite du modèle actuel</h3><p>Les traductions approuvées, termes interdits et degrés de formalité ne sont pas structurés dans BrandRule. Aucun texte automatique n’est présenté comme doctrine.</p></article>
    </section>

    {createOpen ? <Drawer title="Créer une doctrine de marque" eyebrow="Brand Constitution · Rule" onClose={() => setCreateOpen(false)} footer={<><button className={styles.secondaryButton} onClick={() => setCreateOpen(false)}>Annuler</button><button className={styles.sovereignButton} disabled={!form.title.trim()} onClick={addRule}><Plus/> Enregistrer la doctrine</button></>}>
      <div className={styles.drawerFormGrid}><label>Titre<input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })}/></label><label>Catégorie<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value as BrandRule["category"] })}>{categories.map((value) => <option key={value}>{value}</option>)}</select></label><label className={styles.checkboxField}><input type="checkbox" checked={form.required} onChange={(event) => setForm({ ...form, required: event.target.checked })}/><span><strong>Doctrine obligatoire</strong>Les écarts doivent être visibles.</span></label><label className={styles.checkboxField}><input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })}/><span><strong>Activer immédiatement</strong>Entre dans les contrôles déterministes.</span></label><label>Rationale et instructions<textarea rows={7} value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })}/></label></div>
    </Drawer> : null}

    {exceptionOpen && selectedItem && selectedRule ? <Drawer title="Demander une exception gouvernée" eyebrow={`${selectedItem.title} · ${selectedRule.category}`} onClose={() => setExceptionOpen(false)} footer={<><button className={styles.secondaryButton} onClick={() => setExceptionOpen(false)}>Annuler</button><button className={styles.sovereignButton} disabled={!exception.reason.trim()} onClick={recordException}><Gavel/> Consigner la demande</button></>}>
      <div className={styles.drawerFormGrid}><label>Raison business<textarea rows={5} value={exception.reason} onChange={(event) => setException({ ...exception, reason: event.target.value })}/></label><label>Contrôle compensatoire<textarea rows={4} value={exception.compensatingControl} onChange={(event) => setException({ ...exception, compensatingControl: event.target.value })}/></label><label>Autorité attendue<input value={exception.authority} onChange={(event) => setException({ ...exception, authority: event.target.value })}/></label><label>Expiration<input type="date" value={exception.expiration} onChange={(event) => setException({ ...exception, expiration: event.target.value })}/></label><div className={styles.dataBoundary}><TriangleAlert/><p>La demande sera auditée, mais aucun statut “approuvé” ne sera inventé sans modèle persistant et action d’autorité existante.</p></div></div>
    </Drawer> : null}
  </main>
}
