"use client"

import * as React from "react"
import Link from "next/link"
import {
  AlertTriangle,
  ArchiveRestore,
  ArrowRight,
  BadgeCheck,
  Boxes,
  CalendarClock,
  CheckCircle2,
  CircleOff,
  Link2,
  ShieldCheck,
  Sparkles,
} from "lucide-react"
import { useContentStore, type ContentAsset } from "@/components/market-os/content-command/content-command-system"
import {
  CommandHero,
  EmptyOperational,
  MetricCard,
  ProductionCanvas,
  SectionHeading,
  StatusPill,
  TruthNotice,
  styles,
} from "../production-ui"
import { getAssetTruth } from "../production-model"

export default function ActiveAssetsWorkspace() {
  const { store, commit } = useContentStore()
  const evaluated = store.assets.map((asset) => {
    const item = store.items.find((candidate) => candidate.id === asset.linkedContentId)
    return { asset, item, truth: getAssetTruth(asset, item) }
  })
  const active = evaluated.filter((entry) => entry.truth.active)
  const approvedWithGaps = evaluated.filter((entry) => entry.truth.approved && !entry.truth.active)
  const channelCounts = active.reduce<Record<string, number>>((acc, entry) => {
    acc[entry.asset.channel] = (acc[entry.asset.channel] ?? 0) + 1
    return acc
  }, {})

  function retire(asset: ContentAsset) {
    const item = store.items.find((candidate) => candidate.id === asset.linkedContentId)
    const impact = item ? `Lié au contenu « ${item.title} ».` : "Aucun contenu lié n'est visible."
    if (!window.confirm(`Archiver l'asset « ${asset.name} » ? ${impact}`)) return
    commit((draft) => {
      draft.assets = draft.assets.map((candidate) => candidate.id === asset.id ? { ...candidate, status: "archived" } : candidate)
    }, "asset retirement", `Archived active asset ${asset.name}`)
  }

  return <ProductionCanvas>
    <CommandHero
      eyebrow="ACTIVE ASSETS · CONTROLLED RELEASE SHELF"
      title="Seulement les assets réellement observables comme utilisables."
      description="Un statut approuvé ne suffit pas. Active Assets exige aussi un owner, un dossier lié et une référence de source observable dans le modèle actuel."
      icon={BadgeCheck}
      tone="emerald"
      metrics={[
        { label: "Opérationnels", value: active.length, detail: "Approuvés et sans manque observable" },
        { label: "Approuvés avec écarts", value: approvedWithGaps.length, detail: "Le statut existe mais la constitution est incomplète" },
        { label: "Canaux couverts", value: Object.keys(channelCounts).length, detail: "Canaux réellement représentés" },
      ]}
      actions={<>
        <Link className={styles.primaryAction} href="/market-os/content-command-center/assets"><Boxes /> Asset Library</Link>
        <Link className={styles.secondaryAction} href="/market-os/content-command-center/source-vault"><Link2 /> Source Vault</Link>
        <Link className={styles.secondaryAction} href="/market-os/content-command-center/distribution"><ArrowRight /> Distribution Tower</Link>
      </>}
    />

    <section className={styles.metricGrid}>
      <MetricCard icon={ShieldCheck} label="Prêts à l’usage" value={active.length} detail="Condition déterministe MZ5" tone="success" />
      <MetricCard icon={AlertTriangle} label="Écarts de constitution" value={approvedWithGaps.length} detail="Source, owner ou dossier manquant" tone={approvedWithGaps.length ? "warning" : "success"} />
      <MetricCard icon={CalendarClock} label="Expiration" value="Non modélisée" detail="Aucune date de droits n’est inventée" tone="neutral" />
      <MetricCard icon={Sparkles} label="Usage réel" value="Non journalisé" detail="Les clics locaux ne deviennent pas un historique d’usage" tone="info" />
    </section>

    <section className={styles.section}>
      <SectionHeading eyebrow="APPROVED ASSET SHELF" title="Inventaire opérationnel" description="Ces assets satisfont les conditions observables du modèle actuel. La Validation formelle, les droits et l’expiration restent des domaines distincts lorsqu’ils ne sont pas persistés." />
      {active.length ? <div className={styles.cardGrid}>{active.map(({ asset, item }) => <article key={asset.id} className={styles.assetCard}>
        <div className={styles.assetPreview}><CheckCircle2 /></div>
        <header><StatusPill tone="success">Opérationnel</StatusPill><StatusPill>{asset.channel}</StatusPill></header>
        <h3>{asset.name}</h3>
        <p>{asset.type} · {item?.title}</p>
        <div className={styles.assetMeta}>
          <div><span>Owner</span><strong>{asset.owner}</strong></div>
          <div><span>Source</span><strong>Référence présente</strong></div>
          <div><span>Campagne</span><strong>{item?.campaign || "Non renseignée"}</strong></div>
          <div><span>Statut contenu</span><strong>{item?.status || "Non renseigné"}</strong></div>
        </div>
        <footer>
          {asset.url ? <a className={styles.quietAction} href={asset.url} target="_blank" rel="noreferrer">Ouvrir référence</a> : null}
          {item ? <Link className={styles.quietAction} href={`/market-os/content-command-center/${item.id}`}>Dossier <ArrowRight /></Link> : null}
          <button className={styles.dangerAction} onClick={() => retire(asset)}><CircleOff size={15}/> Retirer de l’actif</button>
        </footer>
      </article>)}</div> : <EmptyOperational title="Aucun asset ne satisfait encore toutes les conditions" detail="Un asset actif doit être approuvé, lié à un contenu existant, attribué à un owner et disposer d’une URL ou référence." action="Ouvrir Asset Library" href="/market-os/content-command-center/assets" />}
    </section>

    {approvedWithGaps.length ? <section className={styles.section}>
      <SectionHeading eyebrow="READINESS EXCEPTIONS" title="Approuvés, mais non libérables" description="Ces assets conservent leur statut existant, mais MZ5 refuse de les présenter comme opérationnellement sûrs." />
      <div className={styles.cardGrid}>{approvedWithGaps.map(({ asset, item, truth }) => <article key={asset.id} className={styles.assetCard}>
        <header><StatusPill tone="warning">Libération bloquée</StatusPill><StatusPill>{asset.type}</StatusPill></header>
        <h3>{asset.name}</h3>
        <p>{item?.title ?? "Dossier introuvable"}</p>
        <TruthNotice title="Éléments manquants" detail={truth.missing.join(", ")} tone="warning" />
        <footer><Link className={styles.quietAction} href="/market-os/content-command-center/assets">Corriger dans Asset Library <ArrowRight /></Link></footer>
      </article>)}</div>
    </section> : null}

    <section className={styles.section}>
      <SectionHeading eyebrow="CHANNEL READINESS" title="Couverture des canaux observés" description="Cette lecture compte les assets actifs par canal; elle ne prétend pas connaître leur performance ni leur diffusion réelle." />
      {Object.keys(channelCounts).length ? <div className={styles.cardGrid}>{Object.entries(channelCounts).map(([channel, count]) => <article className={styles.assetCard} key={channel}><header><StatusPill tone="info">Canal</StatusPill><strong>{count}</strong></header><h3>{channel}</h3><p>{count} asset(s) opérationnel(s) selon les conditions observables.</p></article>)}</div> : <TruthNotice title="Aucune couverture active" detail="Les canaux apparaîtront dès qu’un asset satisfait la constitution opérationnelle." tone="neutral" />}
    </section>

    <section className={styles.section}>
      <SectionHeading eyebrow="RETIREMENT CONTROL" title="Retirer sans effacer la mémoire" description="L’action disponible archive l’asset dans le store existant. Elle ne prétend pas propager automatiquement un remplacement dans Distribution ou Publishing." />
      <div className={styles.workflowRail}>{[
        ["Impact", "Dossier et campagne visibles"],
        ["Decision", "Confirmation explicite"],
        ["Archive", "Statut archivé persistant"],
        ["Replacement", "Non automatisé sans backend"],
        ["Distribution", "Destination distincte"],
        ["Audit", "Log Content Command"],
        ["Recovery", "Réactivation par Asset Library"],
      ].map(([label, detail]) => <div key={label}><strong>{label}</strong><small>{detail}</small></div>)}</div>
      <TruthNotice title="Droits et expiration" detail="Le schéma ContentAsset actuel ne possède pas de champs de droits ou d’expiration. MZ5 affiche cette limite au lieu de déclarer une conformité fictive." tone="warning" />
    </section>
  </ProductionCanvas>
}
