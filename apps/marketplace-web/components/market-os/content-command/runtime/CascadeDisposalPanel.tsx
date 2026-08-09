"use client"

import * as React from "react"
import Link from "next/link"
import { Archive, CheckCircle2, GitBranch, Layers3, Link2, ShieldAlert, Trash2 } from "lucide-react"
import styles from "./cascade-disposal-panel.module.css"

export type CascadeDisposition = "delete" | "detach" | "archive"
export type CascadeNode = {
  key: string
  entityType: string
  entityId: string
  label: string
  code: string
  status: string
  family: string
  table: string
  depth: number
  active: boolean
  protected: boolean
  availableDispositions: CascadeDisposition[]
  recommendedDisposition: CascadeDisposition
  href?: string
}
export type CascadePlan = {
  root: { key: string; entityType: string; entityId: string; label: string; code: string; status: string; family: string; table: string; protected: boolean }
  nodes: CascadeNode[]
  totals: { attached: number; active: number; protected: number; deletable: number; detachable: number; archivable: number }
  warnings: string[]
  acknowledgementPhrase: string
}
export type CascadeSelection = { key: string; disposition: CascadeDisposition }

const dispositionLabel: Record<CascadeDisposition, string> = {
  delete: "Supprimer avec le cycle",
  detach: "Détacher et conserver",
  archive: "Archiver",
}

export function defaultCascadeSelections(plan: CascadePlan | null, mode: "delete_all" | "recommended" = "delete_all"): CascadeSelection[] {
  if (!plan) return []
  return plan.nodes.map(node => ({ key: node.key, disposition: mode === "delete_all" ? "delete" : node.recommendedDisposition }))
}

export default function CascadeDisposalPanel({
  plan,
  selections,
  onSelectionsChange,
  acknowledgeAll,
  onAcknowledgeAll,
  acknowledgeIrreversible,
  onAcknowledgeIrreversible,
  acknowledgeProtected,
  onAcknowledgeProtected,
  onArchiveAll,
  busy = false,
}: {
  plan: CascadePlan
  selections: CascadeSelection[]
  onSelectionsChange: (next: CascadeSelection[]) => void
  acknowledgeAll: boolean
  onAcknowledgeAll: (next: boolean) => void
  acknowledgeIrreversible: boolean
  onAcknowledgeIrreversible: (next: boolean) => void
  acknowledgeProtected: boolean
  onAcknowledgeProtected: (next: boolean) => void
  onArchiveAll?: () => void
  busy?: boolean
}) {
  const selected = new Map(selections.map(item => [item.key, item.disposition]))
  const allCovered = plan.nodes.every(node => selected.has(node.key))
  const setAll = (checked: boolean) => {
    onAcknowledgeAll(checked)
    onSelectionsChange(checked ? defaultCascadeSelections(plan, "delete_all") : [])
  }
  const toggleNode = (node: CascadeNode, checked: boolean) => {
    const next = selections.filter(item => item.key !== node.key)
    if (checked) next.push({ key: node.key, disposition: "delete" })
    onSelectionsChange(next)
    if (!checked) onAcknowledgeAll(false)
  }
  const setDisposition = (node: CascadeNode, disposition: CascadeDisposition) => {
    const next = selections.filter(item => item.key !== node.key)
    next.push({ key: node.key, disposition })
    onSelectionsChange(next)
  }
  const grouped = plan.nodes.reduce<Record<string, CascadeNode[]>>((acc, node) => {
    ;(acc[node.family] ||= []).push(node)
    return acc
  }, {})

  return <section className={styles.panel}>
    <header className={styles.header}>
      <div><Layers3/><span><small>OWNER-CONTROLLED CASCADE</small><strong>Vous décidez du sort de tout le cycle</strong></span></div>
      <dl><div><dt>Attachés</dt><dd>{plan.totals.attached}</dd></div><div><dt>Actifs</dt><dd>{plan.totals.active}</dd></div><div><dt>Protégés</dt><dd>{plan.totals.protected}</dd></div></dl>
    </header>

    <div className={styles.doctrine}><ShieldAlert/><p>Le système n’interdit plus la décision. Il expose l’impact, exige une reconnaissance explicite, puis exécute le périmètre choisi sous autorité de purge.</p></div>

    <label className={styles.selectAll}>
      <input type="checkbox" checked={acknowledgeAll && allCovered} onChange={event => setAll(event.target.checked)} />
      <span><strong>Sélectionner et prendre en charge tous les objets attachés</strong><small>Chaque objet sera supprimé, sauf ceux que vous choisissez explicitement de détacher.</small></span>
      <CheckCircle2/>
    </label>

    <div className={styles.scope}>
      {Object.entries(grouped).map(([family, nodes]) => <section key={family} className={styles.family}>
        <header><GitBranch/><strong>{family}</strong><span>{nodes.length}</span></header>
        {nodes.map(node => {
          const disposition = selected.get(node.key)
          return <article key={node.key} data-selected={Boolean(disposition)} data-protected={node.protected}>
            <input type="checkbox" checked={Boolean(disposition)} onChange={event => toggleNode(node, event.target.checked)} aria-label={`Inclure ${node.label}`} />
            <div className={styles.identity}><small>{node.code || node.entityType} · {node.status}</small><strong>{node.label}</strong><span>{node.table}{node.active ? " · ACTIF" : " · INACTIF"}{node.protected ? " · HISTORIQUE PROTÉGÉ" : ""}</span></div>
            <select value={disposition || ""} disabled={!disposition} onChange={event => setDisposition(node, event.target.value as CascadeDisposition)}>
              <option value="" disabled>Choisir</option>
              {node.availableDispositions.filter(option => option !== "archive").map(option => <option key={option} value={option}>{dispositionLabel[option]}</option>)}
            </select>
            {node.href ? <Link href={node.href}><Link2/>Ouvrir</Link> : null}
          </article>
        })}
      </section>)}
      {!plan.nodes.length ? <div className={styles.empty}><CheckCircle2/><strong>Aucun objet attaché</strong><span>Seul l’objet racine sera supprimé.</span></div> : null}
    </div>

    <div className={styles.acknowledgements}>
      <label><input type="checkbox" checked={acknowledgeIrreversible} onChange={event => onAcknowledgeIrreversible(event.target.checked)} /><span><strong>Je reconnais que la suppression est irréversible.</strong><small>La décision et le périmètre restent tracés dans l’audit minimal.</small></span></label>
      {plan.totals.protected > 0 ? <label data-critical><input type="checkbox" checked={acknowledgeProtected} onChange={event => onAcknowledgeProtected(event.target.checked)} /><span><strong>Je reconnais la suppression d’historique validé, publié ou institutionnel.</strong><small>{plan.totals.protected} objet(s) sont concernés.</small></span></label> : null}
    </div>

    {onArchiveAll ? <button type="button" className={styles.archiveAll} disabled={busy} onClick={onArchiveAll}><Archive/>Archiver tout le cycle à la place</button> : null}
  </section>
}
