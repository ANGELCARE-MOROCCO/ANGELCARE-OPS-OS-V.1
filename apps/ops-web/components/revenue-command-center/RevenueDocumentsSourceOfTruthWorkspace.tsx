"use client"

import { useEffect, useState } from "react"
import { Download, FileText, RefreshCcw, Trash2, Upload } from "lucide-react"
import {
  deleteRevenueDocumentVersion,
  getRevenueDocumentSignedUrl,
  listRevenueDocuments,
  subscribeRevenueDocuments,
  uploadRevenueDocument,
  type RevenueDocumentVersion,
} from "@/lib/revenue-command-center/revenue-document-storage"

export default function RevenueDocumentsSourceOfTruthWorkspace() {
  const [documents, setDocuments] = useState<RevenueDocumentVersion[]>([])
  const [loading, setLoading] = useState(true)
  const [entityId, setEntityId] = useState("general")
  const [title, setTitle] = useState("Revenue document")
  const [uploading, setUploading] = useState(false)

  async function refresh() {
    setLoading(true)
    try {
      setDocuments(await listRevenueDocuments())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refresh()
    const unsubscribe = subscribeRevenueDocuments(() => void refresh())
    return unsubscribe
  }, [])

  async function handleUpload(file: File | null) {
    if (!file) return
    setUploading(true)
    try {
      await uploadRevenueDocument({ file, entityType: "prospect", entityId, title, uploadedBy: "AngelCare" })
      await refresh()
    } finally {
      setUploading(false)
    }
  }

  async function openDocument(doc: RevenueDocumentVersion) {
    const url = await getRevenueDocumentSignedUrl(doc.storage_path)
    window.open(url, "_blank")
  }

  async function removeDocument(doc: RevenueDocumentVersion) {
    if (!confirm(`Delete ${doc.title} v${doc.version}?`)) return
    await deleteRevenueDocumentVersion(doc.id, doc.storage_path)
    await refresh()
  }

  return (
    <main className="min-h-screen w-full min-w-0 bg-[#050b16] p-4 text-white">
      <section className="w-full min-w-0 ">
        <header className="mb-4 rounded-[32px] border border-[#244365] bg-[#07111f]/90 p-6">
          <div className="text-xs font-black uppercase tracking-[.18em] text-violet-300">Supabase Storage</div>
          <h1 className="mt-1 text-3xl font-black">Revenue Documents Storage</h1>
          <p className="mt-1 text-sm font-semibold text-[#cbd5e1]">Real file upload, signed preview, versioning, delete and audit trail.</p>
        </header>

        <section className="mb-4 rounded-[32px] border border-[#244365] bg-[#0e1e34] p-5">
          <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
            <Input label="Linked prospect/entity id" value={entityId} onChange={setEntityId} />
            <Input label="Document title" value={title} onChange={setTitle} />
            <label className="flex cursor-pointer items-end">
              <span className="inline-flex h-[48px] items-center gap-2 rounded-xl bg-violet-600 px-5 text-sm font-black text-white">
                <Upload className="h-4 w-4" />{uploading ? "Uploading..." : "Upload"}
              </span>
              <input type="file" className="hidden" onChange={(e) => void handleUpload(e.target.files?.[0] || null)} />
            </label>
          </div>
        </section>

        <section className="rounded-[32px] border border-[#244365] bg-[#0e1e34] p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-black">Document Versions</h2>
            <button onClick={() => void refresh()} className="rounded-xl border border-[#244365] bg-[#10223a] px-3 py-2 text-sm font-black"><RefreshCcw className="mr-2 inline h-4 w-4" />Refresh</button>
          </div>

          {loading ? <div className="p-10 text-center font-bold text-[#cbd5e1]">Loading documents...</div> : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div key={doc.id} className="grid gap-4 rounded-2xl border border-[#244365] bg-[#10223a] p-4 xl:grid-cols-[42px_1.3fr_.6fr_.6fr_160px] xl:items-center">
                  <FileText className="h-7 w-7 text-violet-300" />
                  <div>
                    <div className="font-black">{doc.title} · v{doc.version}</div>
                    <div className="text-xs font-semibold text-[#cbd5e1]">{doc.file_name} · {doc.entity_name || doc.entity_id}</div>
                  </div>
                  <div className="text-sm font-bold text-[#cbd5e1]">{doc.mime_type || "file"}</div>
                  <div className="text-sm font-bold text-[#cbd5e1]">{doc.file_size ? `${Math.round(doc.file_size / 1024)} KB` : "size n/a"}</div>
                  <div className="flex gap-2">
                    <button onClick={() => void openDocument(doc)} className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-black"><Download className="h-4 w-4" /></button>
                    <button onClick={() => void removeDocument(doc)} className="rounded-xl bg-red-600 px-3 py-2 text-xs font-black"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              ))}
              {!documents.length && <div className="p-10 text-center font-bold text-[#cbd5e1]">No documents uploaded yet.</div>}
            </div>
          )}
        </section>
      </section>
    </main>
  )
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="grid gap-2"><span className="text-xs font-black uppercase tracking-[.14em] text-cyan-100">{label}</span><input value={value} onChange={(e) => onChange(e.target.value)} className="rounded-2xl border border-[#315474] bg-[#10223a] p-3 text-sm font-bold text-white outline-none" /></label>
}
