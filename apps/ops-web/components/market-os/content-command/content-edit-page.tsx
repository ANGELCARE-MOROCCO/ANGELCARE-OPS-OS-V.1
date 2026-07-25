"use client"

import { useRouter } from "next/navigation"
import { Button, ContentForm, NotFoundPanel, PageHeader, Panel, Shell, useContentStore } from "./content-command-system"

export default function ContentEditPage({ id }: { id: string }) {
  const router = useRouter()
  const { store, commit } = useContentStore()
  const item = store.items.find((candidate) => candidate.id === id)
  if (!item) return <NotFoundPanel id={id} />

  return (
    <Shell>
      <main data-market-os-root className="cc360-studio-page">
        <PageHeader
          eyebrow="CONTENT COMMAND 360 · GOVERNANCE STUDIO"
          title={`Modifier : ${item.title}`}
          description="Mettez à jour le record existant avec revue des conséquences sur la production, la validation, le calendrier et la publication."
          actions={(
            <>
              <Button href={`/market-os/content-command-center/${id}`}>Retour au dossier</Button>
              <Button href={`/market-os/content-command-center/${id}/delete`} kind="danger">Contrôles administratifs</Button>
            </>
          )}
        />
        <Panel className="cc360-studio-panel">
          <ContentForm
            initial={item}
            submitLabel="Valider les modifications"
            onSave={(updated) => {
              commit((draft) => {
                draft.items = draft.items.map((candidate) => candidate.id === id ? updated : candidate)
              }, "content edit", `Updated ${updated.title}`)
              router.push(`/market-os/content-command-center/${id}`)
            }}
          />
        </Panel>
      </main>
    </Shell>
  )
}
