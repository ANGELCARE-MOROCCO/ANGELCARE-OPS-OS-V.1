import AngelCareConnect from '@/app/components/connect/AngelCareConnect'

export default function ConnectPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-slate-50">
      <AngelCareConnect embedded defaultOpen forceFloating />
    </main>
  )
}
