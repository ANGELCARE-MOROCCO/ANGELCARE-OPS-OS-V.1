"use client"

import { useRouter } from "next/navigation"
import { ArrowRight, ClipboardCheck, FilePlus2, Layers3, ShieldCheck, Sparkles } from "lucide-react"
import { ContentForm, useContentStore } from "./content-command-system"
import {
  CommandHero,
  ProductionCanvas,
  SectionHeading,
  TruthNotice,
  styles,
} from "./production/production-ui"

export default function ContentCreatePage() {
  const router = useRouter()
  const { store, commit } = useContentStore()
  const requiredRules = store.rules.filter((rule) => rule.active && rule.required)

  return <ProductionCanvas>
    <CommandHero
      eyebrow="CRÉATION RAPIDE · GOVERNED ENTRY"
      title="Initier un contenu standard sans contourner le cycle institutionnel."
      description="Le parcours rapide constitue le record existant, attribue la responsabilité et prépare la destination Studio. Il ne vaut ni preuve, ni review, ni validation."
      icon={FilePlus2}
      tone="navy"
      metrics={[
        { label: "Briefs disponibles", value: store.briefs.filter((brief) => brief.status === "ready").length, detail: "Briefs marqués prêts dans le store existant" },
        { label: "Règles obligatoires", value: requiredRules.length, detail: "Doctrine active réellement enregistrée" },
        { label: "Productions ouvertes", value: store.items.filter((item) => !["published", "archived"].includes(item.status)).length, detail: "Records non clôturés" },
      ]}
      actions={<>
        <a className={styles.secondaryAction} href="/market-os/content-command-center/studio"><Sparkles /> Studios spécialisés</a>
        <a className={styles.secondaryAction} href="/market-os/content-command-center/briefs"><ClipboardCheck /> Briefing Suite</a>
      </>}
    />

    <section className={styles.section}>
      <SectionHeading eyebrow="CONTROLLED SHORT PATH" title="Constitution essentielle" description="Les éléments structurants sont saisis avant la création du record. Les exigences manquantes restent visibles dans le formulaire existant." />
      <div className={styles.workflowRail}>{[
        ["Type", "Famille, format et canal"],
        ["Brief", "Objectif, audience et message"],
        ["Ownership", "Owner, reviewer et priorité"],
        ["Gouvernance", "Règles et brand score"],
        ["Sortie", "Contenu, CTA et assets"],
        ["Dossier", "Record persistant existant"],
        ["Studio", "Destination spécialisée"],
      ].map(([label, detail]) => <div key={label}><strong>{label}</strong><small>{detail}</small></div>)}</div>
    </section>

    <section className={styles.workbenchGrid} style={{ marginTop: 18 }}>
      <article className={styles.commandPanel}>
        <SectionHeading eyebrow="QUICK CREATE WORKBENCH" title="Construire le record de production" description="Le composant ContentForm et son contrat de persistance sont conservés; seule l’expérience est replacée dans un environnement de constitution et de vérité opérationnelle." />
        <ContentForm
          submitLabel="Créer le dossier contenu"
          onSave={(item) => {
            commit((draft) => { draft.items = [item, ...draft.items] }, "content create", `Created ${item.title}`)
            router.push(`/market-os/content-command-center/${item.id}`)
          }}
        />
      </article>

      <aside className={styles.inspectorPanel}>
        <h3>Contrôle de sortie</h3>
        <p>La création rapide réduit le temps d’entrée, jamais le niveau de responsabilité. Les étapes aval restent obligatoires selon le dossier.</p>
        <dl>
          <div><dt>Persistance</dt><dd>Store Content Command existant</dd></div>
          <div><dt>Règles actives</dt><dd>{requiredRules.length} exigence(s) obligatoire(s)</dd></div>
          <div><dt>Review</dt><dd>Non accordée par cette page</dd></div>
          <div><dt>Validation</dt><dd>Destination distincte et future</dd></div>
        </dl>
        <TruthNotice title="Vérité institutionnelle" detail="Enregistrer un record ne signifie pas que le contenu est produit, prouvé, révisé, validé ou publié." tone="warning" />
        <a className={styles.primaryAction} href="/market-os/content-command-center/studio" style={{ marginTop: 14 }}>Ouvrir le Studio <ArrowRight /></a>
      </aside>
    </section>

    <section className={styles.section}>
      <SectionHeading eyebrow="ENTRY CONDITIONS" title="Ce que cette voie rapide protège" description="Les raccourcis visuels ne deviennent jamais des raccourcis de gouvernance." />
      <div className={styles.cardGrid}>{[
        [Layers3, "Classification", "Le record conserve famille, type, canal, campagne et priorité."],
        [ClipboardCheck, "Brief essentiel", "Objectif, audience, message, sortie et CTA restent inspectables."],
        [ShieldCheck, "Responsabilité", "Owner, reviewer et score de marque restent explicitement enregistrés."],
      ].map(([Icon, title, detail]) => {
        const Component = Icon as typeof Layers3
        return <article className={styles.assetCard} key={String(title)}><span className={styles.assetPreview}><Component /></span><h3>{String(title)}</h3><p>{String(detail)}</p></article>
      })}</div>
    </section>
  </ProductionCanvas>
}
