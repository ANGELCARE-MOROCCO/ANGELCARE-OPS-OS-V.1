"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Archive, ArrowLeft, BadgeCheck, CheckCircle2, ClipboardCheck, Edit3, LoaderCircle, Plus, Search, Send, Sparkles, X } from "lucide-react";
import type { OnboardingChecklist, OnboardingChecklistItem } from "@/lib/hr-onboarding/types";
import { ONBOARDING_PHASES } from "@/lib/hr-onboarding/types";

type Props = {
  initialChecklists: OnboardingChecklist[];
  canManage: boolean;
};

type Envelope = { ok: boolean; message?: string; error?: string; checklists?: OnboardingChecklist[] };

const phaseLabels: Record<string, string> = {
  offer_accepted: "Offre & acceptation",
  preboarding: "Préboarding",
  documents: "Documents",
  orientation: "Orientation",
  training_setup: "Formation & accès",
  integration: "Intégration",
  probation: "Période d’essai",
  completed: "Terminé",
};

async function api(url: string, init?: RequestInit): Promise<Envelope> {
  const response = await fetch(url, {
    ...init,
    cache: "no-store",
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
  });
  const body = await response.json() as Envelope;
  if (!response.ok || body.ok === false) throw new Error(body.error || `Erreur HTTP ${response.status}`);
  return body;
}

export default function ChecklistLibraryClient({ initialChecklists, canManage }: Props) {
  const [checklists, setChecklists] = useState(initialChecklists);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<OnboardingChecklist | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState("Bibliothèque synchronisée");

  const filtered = useMemo(() => checklists.filter((item) => `${item.name} ${item.roleKey ?? ""} ${item.departmentKey ?? ""}`.toLowerCase().includes(query.toLowerCase())), [checklists, query]);

  async function refresh(): Promise<void> {
    const result = await api("/api/hr/onboarding/checklists");
    setChecklists(result.checklists ?? []);
  }

  async function save(form: FormData): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      const titles = String(form.get("items") ?? "").split("\n").map((item) => item.trim()).filter(Boolean);
      const items: OnboardingChecklistItem[] = titles.map((title, index) => ({
        key: editing?.items[index]?.key ?? crypto.randomUUID(),
        title,
        groupName: String(form.get("groupName") ?? "Général"),
        phase: String(form.get("phase") ?? "preboarding") as OnboardingChecklistItem["phase"],
        ownerRole: String(form.get("ownerRole") ?? "") || null,
        priority: "normal",
        required: true,
        dueOffsetDays: index + 1,
        documentRequirement: false,
        documentType: null,
      }));
      const result = await api("/api/hr/onboarding/checklists", {
        method: "POST",
        body: JSON.stringify({
          checklistKey: editing?.checklistKey,
          version: editing?.version,
          name: form.get("name"),
          roleKey: form.get("roleKey"),
          departmentKey: form.get("departmentKey"),
          notes: form.get("notes"),
          items,
        }),
      });
      setChecklists(result.checklists ?? []);
      setToast(result.message || "Checklist enregistrée");
      setOpen(false);
      setEditing(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Échec de l’enregistrement.");
    } finally {
      setBusy(false);
    }
  }

  async function action(checklist: OnboardingChecklist, actionName: string): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      const result = await api(`/api/hr/onboarding/checklists/${encodeURIComponent(checklist.checklistKey)}/actions`, {
        method: "POST",
        body: JSON.stringify({ action: actionName, version: checklist.version, reason: `${actionName} depuis la bibliothèque Onboarding` }),
      });
      setChecklists(result.checklists ?? []);
      setToast(result.message || "Checklist synchronisée");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Action impossible.");
    } finally {
      setBusy(false);
    }
  }

  return <div className="min-h-screen bg-[#f4f7fb] p-4 text-slate-950 md:p-8">
    <div className="mx-auto max-w-7xl">
      <header className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_18px_70px_rgba(15,23,42,0.08)]">
        <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-violet-900 p-7 text-white md:p-9">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div><p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-200"><Sparkles className="h-4 w-4" /> Gouvernance Onboarding</p><h1 className="mt-2 text-3xl font-black">Bibliothèque de checklists</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Modèles versionnés, publiés et instanciés dans les parcours sans tâche fictive ni dépendance au stockage navigateur.</p></div>
            <div className="flex gap-2"><Link href="/hr/onboarding" className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-black"><ArrowLeft className="h-4 w-4" /> Onboarding</Link>{canManage && <button onClick={() => { setEditing(null); setOpen(true); }} className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-black text-indigo-950"><Plus className="h-4 w-4" /> Nouvelle checklist</button>}</div>
          </div>
        </div>
      </header>

      <div className="mt-5 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm"><div className="relative"><Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(event: React.ChangeEvent<HTMLInputElement>) => setQuery(event.target.value)} placeholder="Rechercher par nom, rôle ou département…" className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-semibold outline-none focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-100" /></div></div>
      {error && <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700">{error}</div>}
      <div className="mt-5 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">{filtered.map((checklist) => <article key={checklist.checklistKey} className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-50 text-violet-700"><ClipboardCheck className="h-5 w-5" /></div><span className={`rounded-xl border px-2.5 py-1 text-[10px] font-black ${checklist.isPublished ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}>{checklist.status.toUpperCase()}</span></div><h2 className="mt-4 text-lg font-black">{checklist.name}</h2><p className="mt-1 text-xs font-semibold text-slate-500">v{checklist.version} · {checklist.items.length} exigences · {checklist.roleKey || "tous rôles"}</p><div className="mt-4 space-y-2">{checklist.items.slice(0, 5).map((item) => <div key={item.key} className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600"><CheckCircle2 className="h-3.5 w-3.5 text-violet-500" /><span className="truncate">{item.title}</span></div>)}{checklist.items.length > 5 && <p className="text-center text-[10px] font-black text-slate-400">+ {checklist.items.length - 5} autres exigences</p>}</div>{canManage && <div className="mt-5 flex flex-wrap gap-2"><button onClick={() => { setEditing(checklist); setOpen(true); }} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-black"><Edit3 className="h-3.5 w-3.5" /> Modifier</button>{!checklist.isPublished && <button onClick={() => void action(checklist, "publish")} className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-black text-white"><Send className="h-3.5 w-3.5" /> Publier</button>}<button onClick={() => void action(checklist, "archive")} className="grid h-9 w-9 place-items-center rounded-xl text-rose-500 hover:bg-rose-50"><Archive className="h-4 w-4" /></button></div>}</article>)}</div>
      {!filtered.length && <div className="mt-5 rounded-[26px] border border-dashed border-slate-300 bg-white p-10 text-center"><ClipboardCheck className="mx-auto h-8 w-8 text-violet-600" /><h2 className="mt-4 font-black">Aucune checklist</h2><p className="mt-2 text-sm text-slate-500">La bibliothèque est vide ou aucun résultat ne correspond à la recherche.</p></div>}
      <footer className="mt-5 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-xs font-semibold text-slate-500">{busy ? "Opération en cours…" : toast}</footer>
    </div>

    {open && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-3 backdrop-blur-sm"><div className="max-h-[92vh] w-full max-w-2xl overflow-hidden rounded-[30px] bg-white shadow-2xl"><div className="flex items-center justify-between bg-gradient-to-r from-slate-950 via-indigo-950 to-violet-900 px-6 py-5 text-white"><div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-cyan-200">Checklist versionnée</p><h2 className="mt-1 text-xl font-black">{editing ? "Modifier le brouillon" : "Créer une checklist"}</h2></div><button disabled={busy} onClick={() => { setOpen(false); setEditing(null); }} className="grid h-10 w-10 place-items-center rounded-2xl border border-white/15 bg-white/10"><X className="h-5 w-5" /></button></div><form action={(form: FormData) => void save(form)} className="max-h-[calc(92vh-80px)] space-y-4 overflow-y-auto p-6"><label className="block"><span className="mb-1.5 block text-xs font-black">Nom</span><input name="name" required defaultValue={editing?.name ?? ""} className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 font-semibold" /></label><div className="grid gap-4 md:grid-cols-2"><label className="block"><span className="mb-1.5 block text-xs font-black">Rôle cible</span><input name="roleKey" defaultValue={editing?.roleKey ?? ""} className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 font-semibold" /></label><label className="block"><span className="mb-1.5 block text-xs font-black">Département</span><input name="departmentKey" defaultValue={editing?.departmentKey ?? ""} className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 font-semibold" /></label><label className="block"><span className="mb-1.5 block text-xs font-black">Phase par défaut</span><select name="phase" defaultValue={editing?.items[0]?.phase ?? "preboarding"} className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 font-semibold">{ONBOARDING_PHASES.map((phase) => <option key={phase} value={phase}>{phaseLabels[phase]}</option>)}</select></label><label className="block"><span className="mb-1.5 block text-xs font-black">Groupe par défaut</span><input name="groupName" defaultValue={editing?.items[0]?.groupName ?? "Général"} className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 font-semibold" /></label></div><label className="block"><span className="mb-1.5 block text-xs font-black">Exigences — une ligne par étape</span><textarea name="items" required rows={10} defaultValue={editing?.items.map((item) => item.title).join("\n") ?? ""} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-semibold" /></label><label className="block"><span className="mb-1.5 block text-xs font-black">Notes</span><textarea name="notes" rows={4} defaultValue={editing?.notes ?? ""} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-semibold" /></label>{error && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700">{error}</div>}<div className="flex justify-end border-t border-slate-200 pt-5"><button disabled={busy} className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white disabled:opacity-50">{busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <BadgeCheck className="h-4 w-4" />} Enregistrer</button></div></form></div></div>}
  </div>;
}
