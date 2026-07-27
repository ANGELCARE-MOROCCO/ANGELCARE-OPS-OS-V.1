"use client"

import * as React from "react"
import Link from "next/link"
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  CircleDashed,
  FileOutput,
  Fingerprint,
  Link2,
  MapPin,
  PackageCheck,
  Plus,
  RadioTower,
  Route,
  Send,
  ShieldCheck,
  Sparkles,
  Users,
  Waves,
} from "lucide-react"
import { PageStatus } from "./primitives"
import { formatDate, headquartersAction, statusLabel, tone, useHeadquartersSnapshot } from "./client"
import type { PublicationPackage } from "@/lib/market-os/content-command-headquarters/types"
import { Empty, Field, Metric, Modal, Pill, SectionTitle, toneClass, type ReleaseTone } from "../release/release-ui"
import styles from "../release/mz7-release.module.css"

const channels = ["Instagram", "Facebook", "LinkedIn", "Website", "WhatsApp", "Print", "Internal Workspace"]

function dayKey(value: string | null | undefined) {
  return value ? value.slice(0, 10) : ""
}

export default function DistributionWorkspace() {
  const { snapshot, loading, error, refresh } = useHeadquartersSnapshot()
  const [selectedId, setSelectedId] = React.useState("")
  const [createOpen, setCreateOpen] = React.useState(false)
  const [busy, setBusy] = React.useState("")
  const [notice, setNotice] = React.useState("")
  const [form, setForm] = React.useState({ dossierId: "", channel: "Instagram", scheduledAt: "", renditions: "Portrait 1080×1350\nStory 1080×1920" })

  const packages = snapshot?.publicationPackages || []
  const selectedPackage = packages.find((pkg) => pkg.id === selectedId) || packages[0]
  const selectedDossier = snapshot?.dossiers.find((item) => item.id === selectedPackage?.dossier_id)
  const eligibleDossiers = snapshot?.dossiers.filter((dossier) => dossier.source_state === "secured" && ["source_secured", "classified", "ready_distribution", "scheduled", "published"].includes(dossier.status)) || []
  const draftPackages = packages.filter((pkg) => pkg.status === "draft")
  const readyPackages = packages.filter((pkg) => ["ready", "scheduled"].includes(pkg.status))
  const missingSchedule = packages.filter((pkg) => !pkg.scheduled_at)
  const sourceMismatch = packages.filter((pkg) => snapshot?.dossiers.find((dossier) => dossier.id === pkg.dossier_id)?.source_state !== "secured")

  const collisions = React.useMemo(() => {
    const output: Array<{ key: string; channel: string; day: string; packages: PublicationPackage[] }> = []
    const groups = new Map<string, PublicationPackage[]>()
    for (const pkg of packages) {
      const day = dayKey(pkg.scheduled_at)
      if (!day) continue
      const key = `${pkg.channel}::${day}`
      groups.set(key, [...(groups.get(key) || []), pkg])
    }
    for (const [key, group] of groups) {
      if (group.length > 1) output.push({ key, channel: group[0].channel, day: dayKey(group[0].scheduled_at), packages: group })
    }
    return output
  }, [packages])

  const selectedRenditions = ((selectedPackage as PublicationPackage & { required_renditions?: Array<{ name?: string; required?: boolean; status?: string }> })?.required_renditions || [])
  const packageDossier = selectedDossier
  const preflight = selectedPackage && packageDossier ? [
    { label: "Validation formelle", ok: ["validated", "source_required", "source_secured", "classified", "ready_distribution", "scheduled", "published"].includes(packageDossier.status), detail: "Le dossier expose un état post-validation." },
    { label: "Source canonique", ok: packageDossier.source_state === "secured", detail: "La source doit être sécurisée dans Source Vault." },
    { label: "Renditions", ok: selectedRenditions.length > 0, detail: "Les adaptations attendues sont déclarées dans le package." },
    { label: "Canal", ok: Boolean(selectedPackage.channel), detail: "Un canal réel est associé au package." },
    { label: "Horaire", ok: Boolean(selectedPackage.scheduled_at), detail: "La date de publication doit être persistée." },
    { label: "Publisher / tracking", ok: false, detail: "Le modèle actuel ne fournit pas encore publisher, CTA et tracking persistés." },
  ] : []
  const selectedReady = preflight.length > 0 && preflight.slice(0, 5).every((gate) => gate.ok)

  async function createPackage() {
    if (!form.dossierId || !form.channel) return
    setBusy("create")
    setNotice("")
    try {
      await headquartersAction("create_publication_package", {
        dossierId: form.dossierId,
        channel: form.channel,
        scheduledAt: form.scheduledAt ? new Date(form.scheduledAt).toISOString() : "",
        requiredRenditions: form.renditions.split("\n").map((name) => name.trim()).filter(Boolean).map((name) => ({ name, required: true, status: "required" })),
      })
      setCreateOpen(false)
      setForm({ dossierId: "", channel: "Instagram", scheduledAt: "", renditions: "Portrait 1080×1350\nStory 1080×1920" })
      setNotice("Package de distribution créé dans le registre existant.")
      await refresh()
    } catch (nextError) {
      setNotice(nextError instanceof Error ? nextError.message : "PUBLICATION_PACKAGE_FAILED")
    } finally { setBusy("") }
  }

  async function advancePackage(pkg: PublicationPackage, status: string) {
    setBusy(pkg.id)
    setNotice("")
    try {
      await headquartersAction("update_publication_package", { packageId: pkg.id, status, scheduledAt: pkg.scheduled_at || "" })
      setNotice(status === "scheduled" ? "Package autorisé et transmis au runway Publishing." : "État du package mis à jour.")
      await refresh()
    } catch (nextError) {
      setNotice(nextError instanceof Error ? nextError.message : "PUBLICATION_UPDATE_FAILED")
    } finally { setBusy("") }
  }

  return <main className={styles.canvas}>
    <PageStatus loading={loading} error={error} migrationReady={snapshot?.migrationReady} refresh={refresh}/>
    <div className={styles.liveRegion} aria-live="polite">{notice}</div>
    {notice ? <div className={styles.notice}>{notice}<button type="button" aria-label="Fermer la notification" onClick={() => setNotice("")}>×</button></div> : null}

    <section className={styles.hero}>
      <div className={styles.heroCopy}><span className={styles.eyebrow}><RadioTower/> DISTRIBUTION TOWER</span><h1>Le package, le canal et le pre-flight avant toute publication.</h1><p>Chaque version validée devient un package traçable. La tour contrôle la source, les renditions, le canal, l’horaire, les collisions et l’autorisation avant le handover vers Publishing Operations.</p></div>
      <aside className={styles.heroCommand}><div className={styles.heroStat}><span><Waves/></span><div><strong>{readyPackages.length}</strong><small>packages prêts ou planifiés</small></div><b>{packages.length} total</b></div><div className={styles.heroActions}><button type="button" className={styles.primary} onClick={() => setCreateOpen(true)}><Plus/> Nouveau package</button><Link className={styles.secondary} href="/market-os/content-command-center/publishing"><Send/> Publishing Operations</Link></div></aside>
    </section>

    <section className={styles.metrics} aria-label="Indicateurs de distribution">
      <Metric icon={<PackageCheck/>} label="En construction" value={draftPackages.length} detail="Packages encore à compléter ou autoriser." tone="info"/>
      <Metric icon={<CalendarClock/>} label="Sans horaire" value={missingSchedule.length} detail="Aucun calendrier n’est inventé pour ces packages." tone={missingSchedule.length ? "warning" : "success"}/>
      <Metric icon={<AlertTriangle/>} label="Collisions" value={collisions.length} detail="Même canal et même date, base déterministe uniquement." tone={collisions.length ? "danger" : "success"}/>
      <Metric icon={<Fingerprint/>} label="Source bloquante" value={sourceMismatch.length} detail="Packages dont le dossier ne signale pas de source sécurisée." tone={sourceMismatch.length ? "danger" : "success"}/>
    </section>

    <section className={styles.section}>
      <SectionTitle eyebrow="VALIDATED CONTENT INTAKE" title="Contenus éligibles au packaging" description="Seuls les dossiers dont la source est sécurisée apparaissent comme candidats. L’éligibilité n’est jamais confondue avec une autorisation de publication." action={{ onClick: () => setCreateOpen(true), label: "Construire un package" }}/>
      <div className={styles.packageGrid}>{eligibleDossiers.map((dossier) => {
        const linked = packages.filter((pkg) => pkg.dossier_id === dossier.id)
        return <article key={dossier.id} className={styles.packageCard}><header><small>{dossier.content_code}</small><Pill tone="success">SOURCE OK</Pill></header><h3>{dossier.title}</h3><p>{dossier.service_label} · {dossier.channel || "Canal à définir"} · {dossier.campaign_label || "Hors campagne"}</p><div className={styles.progress}><span style={{ width: `${Math.max(0, Math.min(100, dossier.progress))}%` }}/></div><div className={styles.releaseActions}><button type="button" onClick={() => { setForm((current) => ({ ...current, dossierId: dossier.id, channel: dossier.channel || "Instagram" })); setCreateOpen(true) }}><Plus/> Package</button><Link href={`/market-os/content-command-center/dossiers/${dossier.id}`}>Dossier 360</Link><Pill tone={linked.length ? "info" : "neutral"}>{linked.length} package(s)</Pill></div></article>
      })}{!eligibleDossiers.length ? <Empty title="Aucun contenu éligible" detail="Les dossiers validés et dotés d’une source canonique sécurisée arriveront ici."/> : null}</div>
    </section>

    <section className={styles.split}>
      <aside className={styles.section}>
        <SectionTitle eyebrow="PACKAGE REGISTER" title="Packages sous contrôle" description="État, canal, horaire et readiness observée."/>
        <div className={styles.queue}>{packages.map((pkg) => {
          const dossier = snapshot?.dossiers.find((item) => item.id === pkg.dossier_id)
          const packageTone: ReleaseTone = pkg.status === "published" ? "success" : pkg.status === "scheduled" ? "info" : !pkg.scheduled_at ? "warning" : "neutral"
          return <button type="button" key={pkg.id} className={`${styles.queueButton} ${selectedPackage?.id === pkg.id ? styles.queueSelected : ""}`} onClick={() => setSelectedId(pkg.id)}><span><small>{pkg.channel} · {formatDate(pkg.scheduled_at, true)}</small><strong>{dossier?.title || "Dossier non exposé"}</strong><small>{dossier?.content_code || pkg.dossier_id}</small></span><span><Pill tone={packageTone}>{statusLabel(pkg.status)}</Pill></span></button>
        })}{!packages.length ? <Empty title="Aucun package" detail="Créez un package à partir d’un dossier validé et sourcé."/> : null}</div>
      </aside>

      <article className={`${styles.section} ${styles.case}`}>
        {selectedPackage && packageDossier ? <>
          <header className={styles.caseHeader}><div><small>{packageDossier.content_code} · PACKAGE {selectedPackage.id.slice(0, 8)}</small><h2>{packageDossier.title}</h2><p>{selectedPackage.channel} · {formatDate(selectedPackage.scheduled_at, true)} · {packageDossier.audience}</p></div><div className={styles.caseMeta}><Pill tone={tone(selectedPackage.status) as ReleaseTone}>{statusLabel(selectedPackage.status)}</Pill><Pill tone={packageDossier.source_state === "secured" ? "success" : "danger"}>{packageDossier.source_state === "secured" ? "SOURCE AUTHORITY" : "SOURCE BLOQUANTE"}</Pill><Pill tone={selectedPackage.package_readiness >= 80 ? "success" : "warning"}>{selectedPackage.package_readiness}% readiness</Pill></div></header>

          <div className={styles.channelMatrix} role="table" aria-label="Matrice d’adaptation par canal"><div className={styles.matrixHeader} role="row"><span>Canal</span><span>Rendition</span><span>Copy / CTA</span><span>Audience</span><span>Horaire</span><span>État</span></div>{channels.map((channel) => {
            const active = channel === selectedPackage.channel
            const rendition = active ? selectedRenditions[0]?.name || "Rendition non exposée" : "Non requise dans ce package"
            return <div className={styles.matrixRow} role="row" key={channel}><span><strong>{channel}</strong><small>{active ? "Canal autorisé dans ce package" : "Aucune adaptation persistée"}</small></span><span><strong>{rendition}</strong><small>{active ? `${selectedRenditions.length} rendition(s)` : "—"}</small></span><span><strong>{active ? "Modèle non exposé" : "—"}</strong><small>{active ? "Copy, CTA et tracking restent un boundary explicite." : ""}</small></span><span><strong>{active ? packageDossier.audience || "Audience non exposée" : "—"}</strong><small>{active ? packageDossier.city || "Géographie non exposée" : ""}</small></span><span><strong>{active ? formatDate(selectedPackage.scheduled_at, true) : "—"}</strong><small>{active && !selectedPackage.scheduled_at ? "Horaire requis" : ""}</small></span><span><Pill tone={active ? "info" : "neutral"}>{active ? statusLabel(selectedPackage.status) : "HORS PACKAGE"}</Pill></span></div>
          })}</div>
        </> : <Empty title="Package non sélectionné" detail="Sélectionnez un package pour inspecter sa constitution et son pre-flight."/>}
      </article>
    </section>

    {selectedPackage && packageDossier ? <section className={styles.split}>
      <article className={styles.section}>
        <SectionTitle eyebrow="PRE-FLIGHT CHECKLIST" title="Readiness et autorisation" description="Le système contrôle uniquement les informations réellement persistées. Publisher, tracking et CTA restent signalés comme non modélisés."/>
        <div className={styles.preflight}>{preflight.map((gate) => <div key={gate.label} className={`${styles.preflightItem} ${toneClass(gate.ok ? "success" : gate.label === "Publisher / tracking" ? "neutral" : "warning")}`}><span>{gate.ok ? <CheckCircle2/> : <CircleDashed/>}</span><div><strong>{gate.label}</strong><p>{gate.detail}</p></div><Pill tone={gate.ok ? "success" : gate.label === "Publisher / tracking" ? "neutral" : "warning"}>{gate.ok ? "PASS" : gate.label === "Publisher / tracking" ? "BOUNDARY" : "REQUIS"}</Pill></div>)}</div>
        <div className={styles.releaseActions} style={{ marginTop: 12 }}><button type="button" className={styles.secondary} disabled={busy === selectedPackage.id} onClick={() => void advancePackage(selectedPackage, "ready")}><PackageCheck/> Marquer prêt</button><button type="button" className={styles.primary} disabled={!selectedReady || busy === selectedPackage.id} onClick={() => void advancePackage(selectedPackage, "scheduled")}><ShieldCheck/> Autoriser le handover</button><Link className={styles.quiet} href="/market-os/content-command-center/publishing"><ArrowRight/> Ouvrir Publishing</Link></div>
      </article>

      <aside className={styles.section}>
        <SectionTitle eyebrow="SOURCE, COPY & ASSET AUTHORITY" title="Frontières de vérité" description="Distribution résume les autorités existantes sans simuler ce que le backend n’expose pas."/>
        <div className={styles.inspectionRail}>
          <div className={`${styles.truthCard} ${toneClass(packageDossier.source_state === "secured" ? "success" : "danger")}`}><span><Fingerprint/></span><div><strong>Source canonique</strong><p>{packageDossier.source_state === "secured" ? "Sécurisée selon le dossier." : "Bloquante: ouvrir Source Vault."}</p></div></div>
          <div className={`${styles.truthCard} ${toneClass(selectedRenditions.length ? "success" : "warning")}`}><span><FileOutput/></span><div><strong>Renditions</strong><p>{selectedRenditions.length ? selectedRenditions.map((item) => item.name).filter(Boolean).join(", ") : "Aucune rendition persistée."}</p></div></div>
          <div className={`${styles.truthCard} ${toneClass("neutral")}`}><span><Link2/></span><div><strong>Tracking & CTA</strong><p>Non exposés dans le modèle PublicationPackage actuel. Aucun lien de campagne n’est fabriqué.</p></div></div>
          <div className={`${styles.truthCard} ${toneClass("info")}`}><span><Users/></span><div><strong>Audience</strong><p>{packageDossier.audience || "Audience non exposée"} · {packageDossier.city || "Géographie non exposée"}</p></div></div>
        </div>
      </aside>
    </section> : null}

    <section className={styles.section}>
      <SectionTitle eyebrow="COLLISION & PRESSURE RADAR" title="Conflits déterministes" description="Même canal et même date constituent la seule collision calculée ici. Aucune pression audience ou prédiction AI n’est inventée."/>
      <div className={styles.collisionGrid}>{collisions.map((collision) => <article key={collision.key} className={styles.collisionCard}><span><AlertTriangle/></span><div><strong>{collision.channel} · {collision.day}</strong><p>{collision.packages.length} packages partagent le même canal et la même date. Inspectez les horaires et la séquence avant autorisation.</p></div></article>)}{!collisions.length ? <Empty title="Aucune collision déterministe" detail="Aucun canal ne contient plusieurs packages sur la même date selon les données actuelles."/> : null}</div>
    </section>

    <section className={styles.section}>
      <SectionTitle eyebrow="SCHEDULE RUNWAY" title="Handover vers Publishing Operations" description="Le runway montre l’horaire, le canal, la source et l’état de transmission."/>
      <div className={styles.runway}>{packages.filter((pkg) => pkg.scheduled_at).sort((a, b) => String(a.scheduled_at).localeCompare(String(b.scheduled_at))).map((pkg) => { const dossier = snapshot?.dossiers.find((item) => item.id === pkg.dossier_id); return <article className={styles.runwayItem} key={pkg.id}><time>{formatDate(pkg.scheduled_at, true)}</time><span><strong>{dossier?.title || "Dossier"}</strong><small>{dossier?.content_code || pkg.dossier_id}</small></span><Pill tone="info">{pkg.channel}</Pill><Pill tone={tone(pkg.status) as ReleaseTone}>{statusLabel(pkg.status)}</Pill><Link href="/market-os/content-command-center/publishing">Publishing <ArrowRight/></Link></article>})}{!packages.some((pkg) => pkg.scheduled_at) ? <Empty title="Runway vide" detail="Aucun package ne possède encore de date persistée."/> : null}</div>
    </section>

    <Modal open={createOpen} eyebrow="PACKAGE BUILDER" title="Créer un package de distribution gouverné" onClose={() => setCreateOpen(false)} footer={<><button type="button" className={styles.secondary} onClick={() => setCreateOpen(false)}>Annuler</button><button type="button" className={styles.primary} disabled={busy === "create" || !form.dossierId || !form.channel} onClick={() => void createPackage()}><Send/> Créer le package</button></>}>
      <div className={styles.formGrid}>
        <Field label="Dossier source" wide><select value={form.dossierId} onChange={(event) => setForm({ ...form, dossierId: event.target.value })}><option value="">Sélectionner…</option>{eligibleDossiers.map((dossier) => <option key={dossier.id} value={dossier.id}>{dossier.content_code} · {dossier.title}</option>)}</select></Field>
        <Field label="Canal"><select value={form.channel} onChange={(event) => setForm({ ...form, channel: event.target.value })}>{channels.map((channel) => <option key={channel}>{channel}</option>)}</select></Field>
        <Field label="Horaire"><input type="datetime-local" value={form.scheduledAt} onChange={(event) => setForm({ ...form, scheduledAt: event.target.value })}/></Field>
        <Field label="Renditions requises — une par ligne" wide><textarea rows={7} value={form.renditions} onChange={(event) => setForm({ ...form, renditions: event.target.value })}/></Field>
      </div>
    </Modal>
  </main>
}
