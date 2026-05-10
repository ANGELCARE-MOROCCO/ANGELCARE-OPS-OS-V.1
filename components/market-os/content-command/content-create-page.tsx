"use client"

import { useRouter } from "next/navigation"
import { Button, ContentForm, PageHeader, Panel, Shell, useContentStore } from "./content-command-system"

export default function ContentCreatePage() {
  const router = useRouter()
  const { commit } = useContentStore()

  return <Shell>
    <main className="mx-auto max-w-[1400px] space-y-6 p-4 lg:p-8">
      <PageHeader eyebrow="Content Command / Create" title="Create production-ready content" description="Create a real content item with owner, reviewer, channel, campaign link, deadline, CTA, body, SEO keyword and brand score." actions={<Button href="/market-os/content-command-center">Back</Button>} />
      <Panel className="p-6"><ContentForm submitLabel="Create content item" onSave={(item) => { commit((draft) => { draft.items = [item, ...draft.items] }, "content create", `Created ${item.title}`); router.push("/market-os/content-command-center") }} /></Panel>
    </main>
  </Shell>
}
