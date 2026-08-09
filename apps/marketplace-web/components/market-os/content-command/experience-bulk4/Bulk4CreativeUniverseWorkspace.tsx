"use client"

import Link from "next/link"
import {
  ArrowRight,
  BookOpenText,
  Boxes,
  FileStack,
  Image as ImageIcon,
  Layers3,
  LayoutTemplate,
  Printer,
  Rocket,
  ShieldCheck,
  Sparkles,
  WandSparkles,
  GitBranch,
} from "lucide-react"
import { useBulk4Registry } from "./bulk4-api"
import { BULK4_TEMPLATE_COUNTS } from "./bulk4-template-estate"
import { Bulk4BrandCrown, Bulk4TruthState, SectionTitle, TonePill, styles } from "./Bulk4Shared"

const PORTALS = [
  {
    href: "/market-os/content-command-center/studio/templates",
    code: "FOUNDRY 60",
    title: "Template Foundry",
    description: "Constitutions de production, anatomies, variantes, règles et versions d’autorité.",
    icon: LayoutTemplate,
    className: styles.portalFoundry,
    features: ["60 Template DNA", "Impact avant modification", "Version authority"],
  },
  {
    href: "/market-os/content-command-center/studio/digital",
    code: "DIGITAL STAGE",
    title: "Digital Campaign Studio",
    description: "Composition maître, mur de renditions, synchronisation copy–visual et contrôle multi-canal.",
    icon: ImageIcon,
    className: styles.portalDigital,
    features: ["Campaign bundles", "Message drift", "Localization chamber"],
  },
  {
    href: "/market-os/content-command-center/studio/print",
    code: "PHYSICAL TABLE",
    title: "Print & Field Studio",
    description: "Spécifications physiques, BAT, kits terrain, placements véhicules et uniformes.",
    icon: Printer,
    className: styles.portalPrint,
    features: ["Prepress gate", "Field kit builder", "Dieline control"],
  },
  {
    href: "/market-os/content-command-center/studio/documents",
    code: "DOCUMENT DESK",
    title: "Corporate Documentation",
    description: "Architecture A4, composants institutionnels, pagination, autorités et révisions.",
    icon: BookOpenText,
    className: styles.portalDocuments,
    features: ["SOP engine", "Authority fields", "Bilingual control"],
  },
  {
    href: "/market-os/content-command-center/studio/quick-create",
    code: "LAUNCH CORRIDOR",
    title: "Quick Create",
    description: "Démarrage gouverné depuis brief, dossier, mission, tâche, template ou asset existant.",
    icon: Rocket,
    className: styles.portalQuick,
    features: ["Context first", "Output family", "Correct studio launch"],
  },
  {
    href: "/market-os/content-command-center/assets",
    code: "ASSET INTELLIGENCE",
    title: "Asset Library",
    description: "Découverte visuelle, registre, provenance, droits, relations et réutilisation.",
    icon: Boxes,
    className: styles.portalAssets,
    features: ["Rights command", "Relationship graph", "Reuse intelligence"],
  },
  {
    href: "/market-os/content-command-center/active-assets",
    code: "TRUSTED RELEASE SHELF",
    title: "Active Assets",
    description: "Versions réellement utilisables, restrictions, expirations et remplacements opérationnels.",
    icon: ShieldCheck,
    className: styles.portalActive,
    features: ["Ready-now truth", "Restriction visibility", "Replacement control"],
  },
  {
    href: "/market-os/content-command-center/studio/version-control",
    code: "VERSION AUTHORITY",
    title: "Version & Rendition Control",
    description: "Comparaison, lineage, branches, différences de copy, metadata et findings observables.",
    icon: GitBranch,
    className: styles.portalVersions,
    features: ["Side-by-side", "Metadata diff", "Restore as new version"],
  },
] as const

export default function Bulk4CreativeUniverseWorkspace() {
  const registry = useBulk4Registry()
  const approvedAssets = registry.assets.filter((asset) => /approved|active/i.test(asset.status)).length
  const sourceGaps = registry.assets.filter((asset) => !asset.storage_path && !asset.preview_url && !String(asset.metadata?.sourceUrl || "")).length
  const pendingDocuments = registry.documents.filter((document) => !/approved|active|published/i.test(document.status)).length

  return <main className={styles.bulk4Canvas} data-content-experience-bulk4="creative-universe">
    <Bulk4BrandCrown
      eyebrow="BULK 4 · CREATIVE PRODUCTION UNIVERSE"
      title="Créer comme une institution. Versionner comme une autorité."
      description="Le Studio relie brief, mission, tâche, template, source, version, variante, preuve et actif opérationnel. Chaque production possède sa propre architecture — jamais un formulaire générique déguisé en studio."
      actions={<Link href="/market-os/content-command-center/studio/quick-create"><WandSparkles/> Lancer une production</Link>}
    />
    <Bulk4TruthState loading={registry.loading} error={registry.error} onRefresh={() => void registry.refresh()} />

    <section className={styles.universeTelemetry} aria-label="État créatif réel">
      <article><LayoutTemplate/><span><small>CONTRAT TEMPLATE</small><strong>{BULK4_TEMPLATE_COUNTS.total}</strong><p>20 digital · 16 print · 16 documents · 8 accélérateurs.</p></span></article>
      <article><Layers3/><span><small>TEMPLATES PERSISTÉS</small><strong>{registry.templates.length}</strong><p>Enregistrements réels de l’API Content Command.</p></span></article>
      <article><ShieldCheck/><span><small>ASSETS APPROUVÉS / ACTIFS</small><strong>{approvedAssets}</strong><p>Statuts observés dans le registre, sans équivalence inventée avec une validation formelle.</p></span></article>
      <article><FileStack/><span><small>DOCUMENTS À FINALISER</small><strong>{pendingDocuments}</strong><p>Documents non approuvés ou non actifs.</p></span></article>
      <article><Sparkles/><span><small>SOURCES NON DOCUMENTÉES</small><strong>{sourceGaps}</strong><p>Assets sans référence source observable.</p></span></article>
    </section>

    <section className={styles.universeSection}>
      <SectionTitle
        eyebrow="SIX PROFESSIONAL UNIVERSES"
        title="Chaque métier créatif possède sa propre silhouette"
        description="La cohérence vient des règles AngelCare, de la continuité et de l’autorité. La composition, les interactions et les contrôles restent spécifiques au travail réel."
        action={<TonePill tone="violet">Post–Bulk 3 continuity</TonePill>}
      />
      <div className={styles.portalUniverse}>
        {PORTALS.map((portal, index) => {
          const Icon = portal.icon
          return <Link href={portal.href} key={portal.href} className={`${styles.creativePortal} ${portal.className}`}>
            <header><span>{String(index + 1).padStart(2, "0")}</span><Icon/></header>
            <small>{portal.code}</small>
            <h2>{portal.title}</h2>
            <p>{portal.description}</p>
            <ul>{portal.features.map((feature) => <li key={feature}><ShieldCheck/>{feature}</li>)}</ul>
            <footer>Entrer dans l’environnement <ArrowRight/></footer>
          </Link>
        })}
      </div>
    </section>

    <section className={styles.creativeLifecycle}>
      <SectionTitle eyebrow="CONTINUOUS CREATIVE CONTEXT" title="Un même dossier, une production continue" description="Le contexte ne disparaît jamais lorsque l’employé passe de la tâche au studio, du studio au registre, puis au handover Evidence & Review." />
      <div>{[
        ["Brief approuvé", "Objectif, audience, message et contraintes"],
        ["Mandat de production", "Mission, tâche, owner, deadline"],
        ["Template DNA", "Structure, slots, outputs et doctrine"],
        ["Working branch", "Version de travail et variantes"],
        ["Preflight", "Source, droits, marque, accessibilité"],
        ["Evidence handover", "Version, outputs et preuve"],
        ["Active asset", "Usage opérationnel sous conditions"],
      ].map(([label, detail], index) => <article key={label}><span>{String(index + 1).padStart(2, "0")}</span><strong>{label}</strong><p>{detail}</p><i/></article>)}</div>
    </section>
  </main>
}
