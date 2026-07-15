'use client'

import { useEffect, useState } from 'react'
import { Loader2, Save, Trash2, X } from 'lucide-react'
import { type PacojacoClient, type PacojacoClientDraft } from '@/lib/pacojaco-ops/types'

type Props = {
  open: boolean
  mode: 'create' | 'edit'
  client: PacojacoClient | null
  saving?: boolean
  onClose: () => void
  onSave: (draft: PacojacoClientDraft) => Promise<void>
  onDelete?: (client: PacojacoClient) => Promise<void>
}

function emptyDraft(client?: PacojacoClient | null): PacojacoClientDraft {
  return {
    id: client?.id || null,
    client_name: client?.client_name || '',
    client_company: client?.client_company || '',
    client_ice: client?.client_ice || '',
    client_email: client?.client_email || '',
    client_phone: client?.client_phone || '',
    client_address: client?.client_address || '',
    contact_name: client?.contact_name || '',
    child_name: client?.child_name || '',
    region: client?.region || '',
    zone: client?.zone || '',
    default_intervention_address: client?.default_intervention_address || '',
    default_imm: client?.default_imm || '',
    notes: client?.notes || '',
  }
}

function fieldClass() {
  return 'w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100'
}

function sectionCard(children: React.ReactNode) {
  return <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">{children}</div>
}

function labelBlock(label: string, children: React.ReactNode, helper?: string) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-500">{label}</span>
      {children}
      {helper ? <span className="mt-1 block text-[11px] font-medium text-slate-400">{helper}</span> : null}
    </label>
  )
}

export default function PacoJacoClientModal({ open, mode, client, saving = false, onClose, onSave, onDelete }: Props) {
  const [draft, setDraft] = useState<PacojacoClientDraft>(() => emptyDraft(client))

  useEffect(() => {
    if (!open) return
    setDraft(emptyDraft(client))
  }, [client, open])

  if (!open) return null

  const isEditing = mode === 'edit' && Boolean(client?.id)

  return (
    <div className="fixed inset-0 z-[60] bg-slate-950/30 backdrop-blur-sm">
      <div className="flex h-full w-full flex-col bg-[linear-gradient(180deg,#f8fbff_0%,#f5f7fb_100%)]">
        <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[11px] font-extrabold uppercase tracking-[0.24em] text-slate-500">
                {isEditing ? 'Edit client' : 'New client'}
              </div>
              <div className="mt-1 text-lg font-black text-slate-900">
                {draft.client_name.trim() || 'Client profile'}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              <X className="h-4 w-4" />
              Close
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4">
          <div className="mx-auto grid max-w-5xl gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
            <div className="grid gap-4">
              {sectionCard(
                <div className="grid gap-4 sm:grid-cols-2">
                  {labelBlock('Client name', <input value={draft.client_name} onChange={(event) => setDraft((current) => ({ ...current, client_name: event.target.value }))} className={fieldClass()} placeholder="Company or parent name" />)}
                  {labelBlock('Company', <input value={draft.client_company} onChange={(event) => setDraft((current) => ({ ...current, client_company: event.target.value }))} className={fieldClass()} />)}
                  {labelBlock('ICE', <input value={draft.client_ice} onChange={(event) => setDraft((current) => ({ ...current, client_ice: event.target.value }))} className={fieldClass()} />)}
                  {labelBlock('Email', <input type="email" value={draft.client_email} onChange={(event) => setDraft((current) => ({ ...current, client_email: event.target.value }))} className={fieldClass()} />)}
                  {labelBlock('Phone', <input value={draft.client_phone} onChange={(event) => setDraft((current) => ({ ...current, client_phone: event.target.value }))} className={fieldClass()} />)}
                  {labelBlock('Contact person', <input value={draft.contact_name} onChange={(event) => setDraft((current) => ({ ...current, contact_name: event.target.value }))} className={fieldClass()} />)}
                  <div className="sm:col-span-2">
                    {labelBlock('Address', <textarea value={draft.client_address} onChange={(event) => setDraft((current) => ({ ...current, client_address: event.target.value }))} className={`${fieldClass()} min-h-[100px]`} />)}
                  </div>
                </div>
              )}

              {sectionCard(
                <div className="grid gap-4 sm:grid-cols-2">
                  {labelBlock('Child name', <input value={draft.child_name} onChange={(event) => setDraft((current) => ({ ...current, child_name: event.target.value }))} className={fieldClass()} />)}
                  {labelBlock('Region', <input value={draft.region} onChange={(event) => setDraft((current) => ({ ...current, region: event.target.value }))} className={fieldClass()} />)}
                  {labelBlock('Zone', <input value={draft.zone} onChange={(event) => setDraft((current) => ({ ...current, zone: event.target.value }))} className={fieldClass()} />)}
                  {labelBlock('Default IMM', <input value={draft.default_imm} onChange={(event) => setDraft((current) => ({ ...current, default_imm: event.target.value }))} className={fieldClass()} />)}
                  <div className="sm:col-span-2">
                    {labelBlock('Default intervention address', <textarea value={draft.default_intervention_address} onChange={(event) => setDraft((current) => ({ ...current, default_intervention_address: event.target.value }))} className={`${fieldClass()} min-h-[100px]`} />)}
                  </div>
                </div>
              )}
            </div>

            <div className="grid gap-4">
              {sectionCard(
                <div className="grid gap-4">
                  {labelBlock('Notes', <textarea value={draft.notes} onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))} className={`${fieldClass()} min-h-[180px]`} placeholder="Internal context, billing notes, delivery notes" />)}
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                    Use this profile to auto-fill client and intervention details when creating invoices or devis.
                  </div>
                </div>
              )}

              {sectionCard(
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void onSave(draft)}
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-2xl border border-blue-200 bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {isEditing ? 'Save changes' : 'Create client'}
                  </button>
                  {isEditing && onDelete ? (
                    <button
                      type="button"
                      onClick={() => void onDelete(client!)}
                      disabled={saving}
                      className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-bold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete client
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
