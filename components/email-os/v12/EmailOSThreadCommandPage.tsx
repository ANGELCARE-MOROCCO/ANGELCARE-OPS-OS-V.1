
import ThreadWorkspace from "./ThreadWorkspace"
import AIComposeAssistant from "./AIComposeAssistant"
import SharedCollaborationPanel from "./SharedCollaborationPanel"

export default function EmailOSThreadCommandPage() {
  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto grid max-w-7xl grid-cols-12 gap-6">
        <section className="col-span-12 xl:col-span-8">
          <ThreadWorkspace />
        </section>
        <aside className="col-span-12 space-y-6 xl:col-span-4">
          <AIComposeAssistant />
          <SharedCollaborationPanel />
        </aside>
      </div>
    </main>
  )
}
