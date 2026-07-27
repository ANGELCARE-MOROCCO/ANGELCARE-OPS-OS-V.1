"use client"

import * as React from "react"
import Link from "next/link"
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  CircleDashed,
  Clock3,
  ExternalLink,
  FileCheck2,
  History,
  Link2,
  Radio,
  RefreshCcw,
  RotateCcw,
  Send,
  ShieldCheck,
  Siren,
  UploadCloud,
} from "lucide-react"
import {
  canPublish,
  statusLabel as legacyStatusLabel,
  todayISO,
  useContentStore,
  type ContentItem,
} from "./content-command-system"
import { formatDate, headquartersAction, statusLabel, tone, useHeadquartersSnapshot } from "./headquarters/client"
import type { PublicationPackage } from "@/lib/market-os/content-command-headquarters/types"
import { Empty, Field, Metric, Modal, Pill, SectionTitle, toneClass, type ReleaseTone } from "./release/release-ui"
import styles from "./release/mz7-release.module.css"

type ProofTarget =
  | { kind: "package"; pkg: PublicationPackage }
  | { kind: "legacy"; item: ContentItem }
  | null

export default function ContentPublishingPage() {
  const { snapshot, loading, error, refresh } = useHeadquartersSnapshot()
  const { store, commit } = useContentStore()
  const [date, setDate] = React.useState(todayISO(2))
  const [selectedPackageId, setSelectedPackageId] = React.useState("")
  const [proofTarget, setProofTarget] = React.useState<ProofTarget>(null)
  const [externalReference, setExternalReference] = React.useState("")
  const [proofNote, setProofNote] = React.useState("")
  const [busy, setBusy] = React.useState("")
  const [notice, setNotice] = React.useState("")

  const packages = snapshot?.publicationPackages || []
  const selectedPackage = packages.find((pkg) => pkg.id === selectedPackageId) || packages[0]
  const selectedDossier = snapshot?.dossiers.find((dossier) => dossier.id === selectedPackage?.dossier_id)
  const legacyQueue = store.items.filter((item) => ["approved", "scheduled", "published"].includes(item.status))
  const readyNow = packages.filter((pkg) => ["ready", "scheduled"].includes(pkg.status))
  const scheduledToday = packages.filter((pkg) => dayKey(pkg.scheduled_at) === todayISO(0))
  const verifiedPackages = packages.filter((pkg) => Boolean(pkg.published_at && pkg.external_reference))
  const failedPackages = packages.filter((pkg) => ["failed", "blocked", "cancelled"].includes(pkg.status))
  const missingProof = packages.filter((pkg) => pkg.status === "published" && !pkg.external_reference)

  const history = React.useMemo(() => packages
    .flatMap((pkg) => {
      const dossier = snapshot?.dossiers.find((item) => item.id === pkg.dossier_id)
      const events = [
        pkg.scheduled_at ? { id: `${pkg.id}-schedule`, label: "Publication planifiée", detail: `${dossier?.title || "Dossier"} · ${pkg.channel}`, at: pkg.scheduled_at, icon: <CalendarClock/> } : null,
        pkg.published_at ? { id: `${pkg.id}-published`, label: "Publication confirmée", detail: pkg.external_reference || "Référence externe absente", at: pkg.published_at, icon: <CheckCircle2/> } : null,
      ].filter(Boolean)
      return events
    })
    .sort((a, b) => String((b as { at?: string }).at || "").localeCompare(String((a as { at?: string }).at || ""))), [packages, snapshot])

  async function updatePackage(pkg: PublicationPackage, status: string) {
    setBusy(pkg.id)
    setNotice("")
    try {
      await headquartersAction("update_publication_package", { packageId: pkg.id, status, scheduledAt: pkg.scheduled_at || "" })
      setNotice(`Publication package: ${statusLabel(status)}.`)
      await refresh()
    } catch (nextError) {
      setNotice(nextError instanceof Error ? nextError.message : "PUBLISHING_UPDATE_FAILED")
    } finally { setBusy("") }
  }

  async function confirmPublication() {
    if (!proofTarget || !externalReference.trim()) return
    setBusy(proofTarget.kind === "package" ? proofTarget.pkg.id : proofTarget.item.id)
    setNotice("")
    try {
      if (proofTarget.kind === "package") {
        await headquartersAction("update_publication_package", {
          packageId: proofTarget.pkg.id,
          status: "published",
          externalReference: externalReference.trim(),
          evidence: [{ type: "manual_publication_proof", note: proofNote.trim(), externalReference: externalReference.trim(), recordedAt: new Date().toISOString() }],
        })
        await refresh()
      } else {
        const item = proofTarget.item
        commit((draft) => {
          draft.items = draft.items.map((candidate) => candidate.id === item.id ? { ...candidate, status: "published", updatedAt: new Date().toISOString(), notes: [candidate.notes, `Preuve manuelle: ${externalReference.trim()}${proofNote.trim() ? ` — ${proofNote.trim()}` : ""}`].filter(Boolean).join("\n") } : candidate)
        }, "manual_publish_confirmation", `Publication manuelle confirmée pour ${item.title}: ${externalReference.trim()}`)
      }
      setNotice("Confirmation manuelle enregistrée. La référence externe demeure distincte d’une vérification provider automatisée.")
      setProofTarget(null)
      setExternalReference("")
      setProofNote("")
    } catch (nextError) {
      setNotice(nextError instanceof Error ? nextError.message : "PUBLICATION_PROOF_FAILED")
    } finally { setBusy("") }
  }

  function scheduleLegacy(item: ContentItem) {
    commit((draft) => {
      draft.items = draft.items.map((candidate) => candidate.id === item.id ? { ...candidate, status: "scheduled", scheduledDate: date, updatedAt: new Date().toISOString() } : candidate)
    }, "reschedule", `Planification de ${item.title} au ${date}`)
    setNotice("Planification enregistrée dans le registre de compatibilité Content Command.")
  }

  return <main className={styles.canvas}>
    <div className={styles.liveRegion} aria-live="polite">{notice}</div>
    {error ? <div className={styles.notice}>Snapshot Headquarters indisponible: {error}<button type="button" onClick={() => void refresh()}><RefreshCcw/></button></div> : null}
    {notice ? <div className={styles.notice}>{notice}<button type="button" aria-label="Fermer la notification" onClick={() => setNotice("")}>×</button></div> : null}

    <section className={styles.hero}>
      <div className={styles.heroCopy}><span className={styles.eyebrow}><Radio/> PUBLISHING OPERATIONS</span><h1>Exécuter, confirmer, vérifier et récupérer chaque publication.</h1><p>Le cockpit sépare strictement l’autorisation, la confirmation manuelle, la vérification externe et la preuve. Aucun bouton ne simule un provider ou un succès live.</p></div>
      <aside className={styles.heroCommand}><div className={styles.heroStat}><span><Send/></span><div><strong>{readyNow.length}</strong><small>packages prêts ou planifiés</small></div><b>{loading ? "…" : `${packages.length} package(s)`}</b></div><div className={styles.heroActions}><Link className={styles.primary} href="/market-os/content-command-center/distribution"><ShieldCheck/> Distribution Tower</Link><button type="button" className={styles.secondary} onClick={() => void refresh()}><RefreshCcw/> Actualiser</button></div></aside>
    </section>

    <section className={styles.metrics} aria-label="Indicateurs de publication">
      <Metric icon={<Clock3/>} label="Aujourd’hui" value={scheduledToday.length} detail="Packages dont la date persistée correspond à aujourd’hui." tone="info"/>
      <Metric icon={<CheckCircle2/>} label="Vérifiées par preuve" value={verifiedPackages.length} detail="Published_at et référence externe sont tous deux présents." tone="success"/>
      <Metric icon={<UploadCloud/>} label="Preuve manquante" value={missingProof.length} detail="Statut publié sans référence externe observable." tone={missingProof.length ? "warning" : "success"}/>
      <Metric icon={<Siren/>} label="Échec / blocage" value={failedPackages.length} detail="États persistés failed, blocked ou cancelled uniquement." tone={failedPackages.length ? "danger" : "success"}/>
    </section>

    <section className={styles.publishLayout}>
      <article className={styles.section}>
        <SectionTitle eyebrow="RELEASE QUEUE" title="Packages autorisés et planifiés" description="Chaque action est liée à un vrai PublicationPackage. Le passage à publié exige une référence externe et une preuve manuelle."/>
        <div className={styles.releaseQueue}>{packages.map((pkg) => {
          const dossier = snapshot?.dossiers.find((item) => item.id === pkg.dossier_id)
          const packageTone: ReleaseTone = pkg.published_at && pkg.external_reference ? "success" : pkg.status === "published" ? "warning" : ["failed", "blocked", "cancelled"].includes(pkg.status) ? "danger" : ["scheduled", "ready"].includes(pkg.status) ? "info" : "neutral"
          return <article key={pkg.id} className={`${styles.releaseCard} ${toneClass(packageTone)}`} onClick={() => setSelectedPackageId(pkg.id)}><span>{packageTone === "success" ? <CheckCircle2/> : packageTone === "danger" ? <Siren/> : <Radio/>}</span><div><strong>{dossier?.title || "Dossier non exposé"}</strong><p>{dossier?.content_code || pkg.dossier_id} · {pkg.channel} · {formatDate(pkg.scheduled_at, true)}</p><small>{pkg.external_reference ? `Référence: ${pkg.external_reference}` : "Référence externe non enregistrée"}</small></div><div className={styles.releaseActions}><Pill tone={packageTone}>{statusLabel(pkg.status)}</Pill><Link href={`/market-os/content-command-center/dossiers/${pkg.dossier_id}`}>Dossier</Link>{["ready", "scheduled"].includes(pkg.status) ? <button type="button" disabled={busy === pkg.id} onClick={(event) => { event.stopPropagation(); setProofTarget({ kind: "package", pkg }) }}><ExternalLink/> Confirmer</button> : null}{pkg.status === "failed" ? <button type="button" disabled={busy === pkg.id} onClick={(event) => { event.stopPropagation(); void updatePackage(pkg, "scheduled") }}><RotateCcw/> Replanifier</button> : null}</div></article>
        })}{!packages.length ? <Empty title="Aucun package Headquarters" detail="Les packages autorisés depuis Distribution Tower apparaîtront ici."/> : null}</div>
      </article>

      <aside className={styles.commandRail}>
        <section className={styles.statusPanel}><h3>État de la release</h3><div className={styles.statusList}><div className={styles.statusItem}><strong>Ready / scheduled</strong><b>{readyNow.length}</b></div><div className={styles.statusItem}><strong>Published + reference</strong><b>{verifiedPackages.length}</b></div><div className={styles.statusItem}><strong>Published sans preuve</strong><b>{missingProof.length}</b></div><div className={styles.statusItem}><strong>Recovery requis</strong><b>{failedPackages.length}</b></div></div></section>
        <section className={styles.statusPanel}><h3>Contrat de vérité</h3><div className={styles.inspectionRail}><div className={`${styles.truthCard} ${toneClass("info")}`}><span><Radio/></span><div><strong>Provider execution</strong><p>Aucun connecteur provider n’est simulé. La publication demeure manuelle tant qu’un provider réel n’est pas exposé.</p></div></div><div className={`${styles.truthCard} ${toneClass("warning")}`}><span><ExternalLink/></span><div><strong>Confirmation ≠ verification</strong><p>La référence externe constitue une preuve déclarée, pas une vérification live automatique.</p></div></div><div className={`${styles.truthCard} ${toneClass("success")}`}><span><History/></span><div><strong>Historique</strong><p>Les dates planifiées, published_at et external_reference alimentent l’historique observable.</p></div></div></div></section>
      </aside>
    </section>

    {selectedPackage ? <section className={styles.section}>
      <SectionTitle eyebrow="ACTIVE PUBLICATION CONTROL" title={selectedDossier?.title || "Package sélectionné"} description="Version, canal, horaire, readiness, preuve et prochaine action restent réunis dans le cockpit." action={{ href: `/market-os/content-command-center/dossiers/${selectedPackage.dossier_id}`, label: "Ouvrir Dossier 360" }}/>
      <div className={styles.inspectionGrid}>
        <div className={styles.preview}><div className={styles.previewFallback}><Radio/><strong>{selectedPackage.channel}</strong><p>{selectedPackage.external_reference || "Aucun URL ou identifiant externe n’est enregistré. Le système ne prétend pas que la publication existe en ligne."}</p><Pill tone={tone(selectedPackage.status) as ReleaseTone}>{statusLabel(selectedPackage.status)}</Pill></div></div>
        <aside className={styles.inspectionRail}>
          <div className={`${styles.truthCard} ${toneClass("info")}`}><span><CalendarClock/></span><div><strong>Schedule</strong><p>{formatDate(selectedPackage.scheduled_at, true)}</p></div></div>
          <div className={`${styles.truthCard} ${toneClass(selectedPackage.package_readiness >= 80 ? "success" : "warning")}`}><span><FileCheck2/></span><div><strong>Package readiness</strong><p>{selectedPackage.package_readiness}% selon le registre Headquarters.</p></div></div>
          <div className={`${styles.truthCard} ${toneClass(selectedPackage.external_reference ? "success" : "warning")}`}><span><Link2/></span><div><strong>External reference</strong><p>{selectedPackage.external_reference || "Preuve externe requise."}</p></div></div>
          <div className={`${styles.truthCard} ${toneClass(selectedPackage.published_at ? "success" : "neutral")}`}><span><CheckCircle2/></span><div><strong>Published timestamp</strong><p>{formatDate(selectedPackage.published_at, true)}</p></div></div>
          <div className={styles.releaseActions}><button type="button" className={styles.primary} disabled={busy === selectedPackage.id || !["ready", "scheduled", "published"].includes(selectedPackage.status)} onClick={() => setProofTarget({ kind: "package", pkg: selectedPackage })}><ExternalLink/> Confirmation manuelle</button>{selectedPackage.status === "failed" ? <button type="button" className={styles.secondary} onClick={() => void updatePackage(selectedPackage, "scheduled")}><RotateCcw/> Retry gouverné</button> : null}</div>
        </aside>
      </div>
    </section> : null}

    <section className={styles.section}>
      <SectionTitle eyebrow="SCHEDULE RUNWAY" title="Aujourd’hui et prochaines publications" description="Le runway affiche uniquement les dates réellement persistées dans les packages Headquarters."/>
      <div className={styles.runway}>{packages.filter((pkg) => pkg.scheduled_at).sort((a, b) => String(a.scheduled_at).localeCompare(String(b.scheduled_at))).map((pkg) => { const dossier = snapshot?.dossiers.find((item) => item.id === pkg.dossier_id); return <article className={styles.runwayItem} key={pkg.id}><time>{formatDate(pkg.scheduled_at, true)}</time><span><strong>{dossier?.title || "Dossier"}</strong><small>{pkg.channel} · {dossier?.content_code || pkg.dossier_id}</small></span><Pill tone={pkg.external_reference ? "success" : "info"}>{pkg.external_reference ? "PREUVE" : "PLANIFIÉ"}</Pill><Pill tone={tone(pkg.status) as ReleaseTone}>{statusLabel(pkg.status)}</Pill><button type="button" className={styles.quiet} onClick={() => setSelectedPackageId(pkg.id)}>Inspecter</button></article>})}{!packages.some((pkg) => pkg.scheduled_at) ? <Empty title="Runway vide" detail="Aucun package Headquarters ne possède de date planifiée."/> : null}</div>
    </section>

    <section className={styles.section}>
      <SectionTitle eyebrow="LEGACY COMPATIBILITY" title="Registre historique Content Command" description="Les anciens items approved/scheduled/published restent accessibles. Leur confirmation est explicitement manuelle et ne prétend pas exécuter un provider."/>
      <div className={styles.legacyBoundary}><strong>Frontière de compatibilité</strong><p>Ce registre local préserve les actions historiques existantes. Les nouveaux workflows institutionnels doivent utiliser Distribution Tower et PublicationPackage.</p></div>
      <div className={styles.formGrid} style={{ marginTop: 12 }}><Field label="Date de planification legacy"><input type="date" value={date} onChange={(event) => setDate(event.target.value)}/></Field></div>
      <div className={styles.releaseQueue} style={{ marginTop: 12 }}>{legacyQueue.map((item) => {
        const ready = canPublish(item, store.tasks, store.rules)
        return <article key={item.id} className={`${styles.releaseCard} ${toneClass(item.status === "published" ? "success" : ready ? "info" : "warning")}`}><span>{item.status === "published" ? <CheckCircle2/> : <CircleDashed/>}</span><div><strong>{item.title}</strong><p>{item.channel} · {item.scheduledDate || "Date non définie"} · {item.owner}</p><small>{ready ? "Readiness legacy satisfaite" : "Readiness legacy incomplète"}</small></div><div className={styles.releaseActions}><Pill tone={item.status === "published" ? "success" : "neutral"}>{legacyStatusLabel(item.status)}</Pill><Link href={`/market-os/content-command-center/${item.id}`}>Ouvrir</Link><button type="button" onClick={() => scheduleLegacy(item)}><CalendarClock/> Planifier</button><button type="button" disabled={!ready} onClick={() => setProofTarget({ kind: "legacy", item })}><ExternalLink/> Confirmer manuellement</button><button type="button" onClick={() => commit((draft) => { draft.items = draft.items.map((candidate) => candidate.id === item.id ? { ...candidate, status: "approved", updatedAt: new Date().toISOString() } : candidate) }, "hold", `Mise en attente de ${item.title}`)}>Hold</button></div></article>
      })}{!legacyQueue.length ? <Empty title="Registre legacy vide" detail="Aucun item approved, scheduled ou published n’est présent dans le store historique."/> : null}</div>
    </section>

    <section className={styles.section}>
      <SectionTitle eyebrow="PUBLICATION EVIDENCE & HISTORY" title="Preuves et événements observables" description="L’historique provient de scheduled_at, published_at et external_reference. Aucun événement système fictif n’est ajouté."/>
      <div className={styles.evidenceGrid}>{verifiedPackages.map((pkg) => { const dossier = snapshot?.dossiers.find((item) => item.id === pkg.dossier_id); return <article className={styles.evidenceCard} key={pkg.id}><span><ExternalLink/> PREUVE EXTERNE</span><h3>{dossier?.title || pkg.channel}</h3><p>{pkg.external_reference} · {formatDate(pkg.published_at, true)}</p></article>})}{!verifiedPackages.length ? <Empty title="Aucune preuve vérifiable" detail="Aucun package ne combine published_at et external_reference."/> : null}</div>
      <div className={styles.timeline} style={{ marginTop: 14 }}>{history.map((event) => event ? <article className={styles.timelineItem} key={event.id}><span>{event.icon}</span><div><strong>{event.label}</strong><p>{event.detail}</p></div><time>{formatDate(event.at, true)}</time></article> : null)}{!history.length ? <Empty title="Historique vide" detail="Aucun horaire ou publication confirmée n’est disponible."/> : null}</div>
    </section>

    <section className={styles.section}>
      <SectionTitle eyebrow="FAILURE & RECOVERY COMMAND" title="Échecs persistés et recovery" description="Le cockpit ne fabrique aucune panne. Seuls les packages dont le statut existe réellement comme failed, blocked ou cancelled apparaissent."/>
      <div className={styles.collisionGrid}>{failedPackages.map((pkg) => { const dossier = snapshot?.dossiers.find((item) => item.id === pkg.dossier_id); return <article className={styles.collisionCard} key={pkg.id}><span><Siren/></span><div><strong>{dossier?.title || pkg.channel}</strong><p>{statusLabel(pkg.status)} · {formatDate(pkg.scheduled_at, true)}. Le retry remet le package en scheduled; aucun retry provider automatique n’est lancé.</p><button type="button" className={styles.secondary} disabled={busy === pkg.id} onClick={() => void updatePackage(pkg, "scheduled")}><RotateCcw/> Replanifier</button></div></article>})}{!failedPackages.length ? <Empty title="Aucun échec persisté" detail="Aucun PublicationPackage n’expose actuellement un statut failed, blocked ou cancelled."/> : null}</div>
    </section>

    <Modal open={Boolean(proofTarget)} eyebrow="MANUAL PUBLICATION CONFIRMATION" title={proofTarget?.kind === "package" ? "Enregistrer la publication du package" : "Confirmer la publication legacy"} onClose={() => setProofTarget(null)} footer={<><button type="button" className={styles.secondary} onClick={() => setProofTarget(null)}>Annuler</button><button type="button" className={styles.primary} disabled={!externalReference.trim() || busy === (proofTarget?.kind === "package" ? proofTarget.pkg.id : proofTarget?.item.id)} onClick={() => void confirmPublication()}><CheckCircle2/> Enregistrer la preuve</button></>}>
      <div className={styles.formGrid}>
        <Field label="Référence externe" wide><input value={externalReference} onChange={(event) => setExternalReference(event.target.value)} placeholder="URL, identifiant de plateforme, référence imprimeur ou preuve interne"/></Field>
        <Field label="Note de publication" wide><textarea rows={6} value={proofNote} onChange={(event) => setProofNote(event.target.value)} placeholder="Décrivez le canal, le contrôle effectué et la preuve. Cette action ne lance aucun provider."/></Field>
      </div>
    </Modal>
  </main>
}

function dayKey(value: string | null | undefined) {
  return value ? value.slice(0, 10) : ""
}
