"use client"

import { useRouter } from "next/navigation"
import { Button, ContentForm, PageHeader, Panel, Shell, useContentStore } from "./content-command-system"

export default function ContentCreatePage() {
  const router = useRouter()
  const { commit } = useContentStore()

  return (
    <Shell>
      <main data-market-os-root className="cc360-studio-page">
        <PageHeader
          eyebrow="CONTENT COMMAND 360 · CREATION STUDIO"
          title="Concevoir un contenu de production"
          description="Construisez le record existant à travers un parcours stratégique, opérationnel et gouverné, sans modifier son contrat de persistence."
          actions={<Button href="/market-os/content-command-center">Retour au Command</Button>}
        />
        <Panel className="cc360-studio-panel">
          <ContentForm
            submitLabel="Créer le dossier contenu"
            onSave={(item) => {
              commit((draft) => { draft.items = [item, ...draft.items] }, "content create", `Created ${item.title}`)
              router.push(`/market-os/content-command-center/${item.id}`)
            }}
          />
        </Panel>
      </main>
    </Shell>
  )
}
