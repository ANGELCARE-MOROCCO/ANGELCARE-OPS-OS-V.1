"use client";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Building2, CalendarClock, CircleUserRound, ContactRound, Edit3, Filter, MapPin, MessageCircleMore, Phone, Plus, Search, Sparkles, Tags, Target, UserRoundSearch, } from "lucide-react";
import type { AcWhatsAppContact } from "@/lib/ac-whatsapp/types";
import { cx, EmptyState, LoadingPanel, ModalFrame, NoticeBanner, SectionTitle, StatusPill, Surface, SurfaceHeader, WorkspaceTabs, } from "./ACWhatsAppUI";
import { acApi, formatRelative, friendlyAcError, initials, useAcWhatsApp } from "./useAcWhatsApp";
type Notice = ReturnType<typeof friendlyAcError> & {
    tone?: "success" | "danger" | "warning" | "info";
};
export default function ContactsIntelligenceWorkspace() {
    const searchParams = useSearchParams();
    const { data, loading, error, refresh } = useAcWhatsApp(20000);
    const [query, setQuery] = useState("");
    const [segment, setSegment] = useState("all");
    const [tab, setTab] = useState("profile");
    const [selectedId, setSelectedId] = useState<string | null>(searchParams.get("contact"));
    const [editorOpen, setEditorOpen] = useState(false);
    const [notice, setNotice] = useState<Notice | null>(null);
    const contacts = data?.contacts || [];
    const conversations = data?.conversations || [];
    const selected = contacts.find((row) => row.id === selectedId) || contacts[0] || null;
    const selectedConversations = selected ? conversations.filter((row) => row.contact_id === selected.id) : [];
    const filtered = useMemo(() => {
        const needle = query.trim().toLowerCase();
        return contacts.filter((contact) => {
            const segmentMatch = segment === "all" || contact.contact_type === segment || contact.lead_stage === segment || contact.priority === segment;
            if (!segmentMatch)
                return false;
            return !needle || [contact.display_name, contact.organization_name, contact.phone_number_e164, contact.city, ...(contact.tags || [])].some((value) => String(value || "").toLowerCase().includes(needle));
        });
    }, [contacts, query, segment]);
    if (loading && !data)
        return <LoadingPanel label="Ouverture de Contacts & Intelligence"/>;
    const organizations = new Set(contacts.map((row) => row.organization_name).filter(Boolean)).size;
    const highPriority = contacts.filter((row) => row.priority === "high" || row.priority === "critical").length;
    const activeRelationships = contacts.filter((row) => row.last_contact_at).length;
    return <div className="space-y-5">
    <SectionTitle eyebrow="Master Workspace 03 · Contacts & Intelligence" title="Chaque numéro devient un dossier relationnel vivant." description="Identité, organisation, contexte commercial, historique et prochaine action — pour répondre avec mémoire et cohérence." action={<button type="button" onClick={() => setEditorOpen(true)} className="inline-flex items-center gap-2 rounded-2xl bg-rose-600 px-4 py-3 text-[10px] font-black text-white shadow-lg shadow-rose-600/20"><Plus className="h-4 w-4"/>Nouveau contact</button>}/>
    {error ? <NoticeBanner tone="danger" {...friendlyAcError(error)}/> : null}
    {notice ? <NoticeBanner tone={notice.tone || "info"} title={notice.title} description={notice.description} reference={notice.reference} onClose={() => setNotice(null)}/> : null}

    <div className="grid gap-3 md:grid-cols-3">
      <SummaryCard label="Contacts connus" value={contacts.length} detail="Identités WhatsApp consolidées" icon={ContactRound}/>
      <SummaryCard label="Organisations" value={organizations} detail="Contextes B2B reliés" icon={Building2}/>
      <SummaryCard label="Priorité haute" value={highPriority} detail={`${activeRelationships} relations déjà actives`} icon={Target}/>
    </div>

    <section className="grid min-h-[690px] overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_22px_70px_rgba(15,23,42,.07)] xl:grid-cols-[330px_1fr]">
      <aside className="border-b border-slate-200 bg-slate-50/70 xl:border-b-0 xl:border-r"><div className="border-b border-slate-200 p-4"><div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nom, entreprise, téléphone…" className="w-full rounded-2xl border border-slate-300 bg-white py-3 pl-10 pr-3 text-[11px] font-bold text-slate-950 outline-none placeholder:text-slate-500 focus:border-slate-600"/></div><div className="mt-3 flex gap-1.5 overflow-x-auto">{[{ id: "all", label: "Tous" }, { id: "prospect", label: "Prospects" }, { id: "customer", label: "Clients" }, { id: "high", label: "Priorité haute" }].map((item) => <button key={item.id} type="button" onClick={() => setSegment(item.id)} className={cx("shrink-0 rounded-xl px-2.5 py-2 text-[8px] font-black", segment === item.id ? "border border-slate-950 bg-slate-950 text-white" : "border border-slate-300 bg-white text-slate-900 hover:border-slate-500")}>{item.label}</button>)}</div></div><div className="max-h-[590px] overflow-y-auto p-2">{filtered.length ? filtered.map((contact) => <ContactRow key={contact.id} contact={contact} active={selected?.id === contact.id} onClick={() => setSelectedId(contact.id)}/>) : <EmptyState compact title="Aucun contact" description="Aucune identité ne correspond aux critères sélectionnés." icon={Filter}/>}</div></aside>
      <main className="min-w-0 p-4 lg:p-5">{selected ? <>
        <div className="relative overflow-hidden rounded-[28px] bg-slate-950 p-5 text-white"><div className="absolute -right-16 -top-20 h-56 w-56 rounded-full border border-white/10 bg-white/[.03]"/><div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between"><div className="flex min-w-0 items-center gap-4"><div className="grid h-16 w-16 shrink-0 place-items-center rounded-[24px] bg-white text-lg font-black text-slate-950">{initials(selected.display_name)}</div><div className="min-w-0"><p className="text-[8px] font-black uppercase tracking-[.18em] text-rose-300">Relationship dossier 360</p><h2 className="mt-2 truncate text-2xl font-black tracking-[-.04em]">{selected.display_name || selected.phone_number_e164}</h2><p className="mt-1 truncate text-[10px] font-semibold text-slate-200">{[selected.organization_name, selected.city, selected.phone_number_e164].filter(Boolean).join(" · ")}</p><div className="mt-3 flex flex-wrap gap-2"><StatusPill status={selected.lead_stage || "new"}/><StatusPill status={selected.priority === "high" ? "warning" : "active"} label={`Priorité ${selected.priority}`}/></div></div></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => setEditorOpen(true)} className="inline-flex items-center gap-2 rounded-xl border border-white bg-white px-3 py-2.5 text-[9px] font-black text-slate-950 shadow-lg"><Edit3 className="h-4 w-4"/>Modifier</button><a href={`/ac-whatsapp/live?conversation=${encodeURIComponent(selectedConversations[0]?.id || "")}`} className="inline-flex items-center gap-2 rounded-xl border border-rose-500 bg-rose-600 px-3 py-2.5 text-[9px] font-black text-white shadow-lg shadow-rose-950/20"><MessageCircleMore className="h-4 w-4"/>Ouvrir le live</a></div></div></div>
        <div className="mt-5"><WorkspaceTabs active={tab} onChange={setTab} tabs={[{ id: "profile", label: "Profil 360", icon: CircleUserRound }, { id: "timeline", label: "Chronologie", icon: CalendarClock, count: selectedConversations.length }, { id: "intelligence", label: "Intelligence", icon: Sparkles }, { id: "organization", label: "Organisation", icon: Building2 }]}/></div>
        {tab === "profile" ? <div className="mt-5 grid gap-4 lg:grid-cols-2"><Surface><SurfaceHeader eyebrow="Identity" title="Informations relationnelles" icon={CircleUserRound}/><div className="mt-4"><Detail label="Numéro" value={selected.phone_number_e164} icon={Phone}/><Detail label="Ville" value={selected.city} icon={MapPin}/><Detail label="Langue" value={selected.preferred_language} icon={UserRoundSearch}/><Detail label="Type" value={humanValue(selected.contact_type, "Contact non qualifié")} icon={ContactRound}/><Detail label="Dernier contact" value={formatRelative(selected.last_contact_at)} icon={CalendarClock}/></div></Surface><Surface><SurfaceHeader eyebrow="Commercial context" title="Qualification actuelle" icon={Target}/><div className="mt-4"><Detail label="Étape" value={humanValue(selected.lead_stage, "Non définie")} icon={Target}/><Detail label="Sentiment" value={selected.sentiment || "Non analysé"} icon={Sparkles}/><Detail label="Priorité" value={humanValue(selected.priority, "Normale")} icon={Target}/><Detail label="Organisation" value={selected.organization_name || "Particulier"} icon={Building2}/></div><div className="mt-4 flex flex-wrap gap-2">{(selected.tags || []).length ? selected.tags.map((tag) => <span key={tag} className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[8px] font-black text-slate-600">#{tag}</span>) : <p className="text-[9px] font-semibold text-slate-600">Aucune étiquette enregistrée.</p>}</div></Surface></div> : null}
        {tab === "timeline" ? <Timeline conversations={selectedConversations}/> : null}
        {tab === "intelligence" ? <Intelligence contact={selected} conversations={selectedConversations}/> : null}
        {tab === "organization" ? <Organization contact={selected} all={contacts}/> : null}
      </> : <EmptyState title="Aucun dossier sélectionné" description="Choisissez un contact dans la liste ou créez une nouvelle identité relationnelle." icon={ContactRound}/>}</main>
    </section>

    {editorOpen && data ? <ContactEditor contact={selectedId ? selected : null} onClose={() => setEditorOpen(false)} onSaved={async (saved) => { setEditorOpen(false); setSelectedId(saved.id); await refresh(); setNotice({ tone: "success", title: "Dossier contact enregistré", description: "L’identité relationnelle est immédiatement disponible dans Live Command." }); }}/> : null}
  </div>;
}

function humanValue(value: unknown, fallback: string) {
    const raw = String(value || "").trim();
    if (!raw || ["unknown", "undefined", "null", "n/a"].includes(raw.toLowerCase())) return fallback;
    const labels: Record<string, string> = { normal: "Normale", low: "Basse", high: "Élevée", urgent: "Urgente", vip: "VIP", new: "Nouveau", prospect: "Prospect", customer: "Client", client: "Client", partner: "Partenaire", family: "Famille", organization: "Organisation", unqualified: "Contact non qualifié" };
    return labels[raw.toLowerCase()] || raw.replaceAll("_", " ");
}
function SummaryCard({ label, value, detail, icon: Icon }: {
    label: string;
    value: number;
    detail: string;
    icon: typeof ContactRound;
}) { return <div className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-start justify-between"><div><p className="text-[8px] font-black uppercase tracking-[.15em] text-slate-400">{label}</p><p className="mt-2 text-2xl font-black text-slate-950">{value}</p><p className="mt-1 text-[9px] font-semibold text-slate-500">{detail}</p></div><div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-950 text-white"><Icon className="h-4 w-4"/></div></div></div>; }
function ContactRow({ contact, active, onClick }: {
    contact: AcWhatsAppContact;
    active: boolean;
    onClick: () => void;
}) { return <button type="button" onClick={onClick} className={cx("mb-1.5 flex w-full items-center gap-3 rounded-[18px] border p-3 text-left", active ? "border-slate-950 bg-slate-950 text-white" : "border-transparent bg-white hover:border-slate-200")}><div className={cx("grid h-10 w-10 shrink-0 place-items-center rounded-2xl text-[10px] font-black", active ? "bg-white/10" : "bg-slate-100 text-slate-600")}>{initials(contact.display_name)}</div><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><p className="truncate text-[10px] font-black">{contact.display_name || contact.phone_number_e164}</p><StatusPill status={contact.priority === "high" ? "warning" : "active"} compact label={humanValue(contact.priority, "Normale")}/></div><p className={cx("mt-1 truncate text-[8px] font-semibold", active ? "text-slate-200" : "text-slate-600")}>{contact.organization_name || contact.city || humanValue(contact.contact_type, "Contact non qualifié")}</p><p className={cx("mt-2 text-[8px] font-bold", active ? "text-rose-200" : "text-slate-700")}>{humanValue(contact.lead_stage, "Nouveau")} · {formatRelative(contact.last_contact_at)}</p></div></button>; }
function Detail({ label, value, icon: Icon }: {
    label: string;
    value?: string | null;
    icon: typeof Phone;
}) { return <div className="flex items-center gap-3 border-b border-slate-100 py-3 last:border-0"><div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-500"><Icon className="h-3.5 w-3.5"/></div><div className="min-w-0 flex-1"><p className="text-[8px] font-black uppercase tracking-[.12em] text-slate-600">{label}</p><p className="mt-1 truncate text-[10px] font-black text-slate-950">{value || "—"}</p></div></div>; }
function Timeline({ conversations }: {
    conversations: any[];
}) { return <Surface className="mt-5"><SurfaceHeader eyebrow="Relationship timeline" title="Interactions WhatsApp reliées" icon={CalendarClock}/><div className="mt-5 space-y-3">{conversations.length ? conversations.sort((a, b) => new Date(b.last_message_at || 0).getTime() - new Date(a.last_message_at || 0).getTime()).map((row) => <div key={row.id} className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white text-slate-600 shadow-sm"><MessageCircleMore className="h-4 w-4"/></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-[10px] font-black text-slate-800">{row.account?.name || "Compte WhatsApp"}</p><StatusPill status={row.status} compact/></div><p className="mt-2 line-clamp-2 text-[10px] font-semibold leading-5 text-slate-600">{row.last_message_preview || row.summary || "Conversation sans aperçu"}</p><p className="mt-2 text-[8px] font-bold text-slate-600">{row.last_message_sender_display_name_snapshot ? `Dernier message par ${row.last_message_sender_display_name_snapshot} · ` : ""}{formatRelative(row.last_message_at)} · {row.message_count || 0} messages</p></div></div>) : <EmptyState compact title="Aucune interaction reliée" description="Les conversations associées à ce contact constitueront automatiquement sa chronologie." icon={CalendarClock}/>}</div></Surface>; }
function Intelligence({ contact, conversations }: {
    contact: AcWhatsAppContact;
    conversations: any[];
}) { const unread = conversations.reduce((sum, row) => sum + (row.unread_count || 0), 0); const open = conversations.filter((row) => !["resolved", "closed", "archived"].includes(row.status)).length; return <div className="mt-5 grid gap-4 lg:grid-cols-2"><Surface><SurfaceHeader eyebrow="Signals" title="Lecture opérationnelle" icon={Sparkles}/><div className="mt-4 grid grid-cols-2 gap-3"><IntelligenceCard label="Conversations ouvertes" value={open}/><IntelligenceCard label="Messages non lus" value={unread}/><IntelligenceCard label="Priorité" value={contact.priority}/><IntelligenceCard label="Sentiment" value={contact.sentiment || "Non analysé"}/></div></Surface><Surface><SurfaceHeader eyebrow="Next best action" title="Recommandation explicable" icon={Target}/><div className="mt-4 rounded-2xl border border-violet-100 bg-violet-50 p-4"><p className="text-[10px] font-black text-violet-900">{open ? "Reprendre la conversation ouverte" : contact.lead_stage === "new" ? "Qualifier le besoin et le décideur" : "Planifier une relance relationnelle"}</p><p className="mt-2 text-[9px] font-semibold leading-5 text-violet-700">Cette recommandation est déduite des états visibles du dossier. Elle ne déclenche aucune action automatique.</p></div></Surface></div>; }
function IntelligenceCard({ label, value }: {
    label: string;
    value: React.ReactNode;
}) { return <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-[8px] font-black uppercase tracking-[.12em] text-slate-600">{label}</p><p className="mt-2 text-base font-black text-slate-800">{value}</p></div>; }
function Organization({ contact, all }: {
    contact: AcWhatsAppContact;
    all: AcWhatsAppContact[];
}) { const peers = contact.organization_name ? all.filter((row) => row.organization_name === contact.organization_name) : []; return <Surface className="mt-5"><SurfaceHeader eyebrow="Organization intelligence" title={contact.organization_name || "Aucune organisation associée"} icon={Building2}/><div className="mt-5 grid gap-4 md:grid-cols-2"><div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-[8px] font-black uppercase tracking-[.14em] text-slate-400">Relation connue</p><p className="mt-2 text-3xl font-black text-slate-950">{peers.length || 1}</p><p className="mt-1 text-[9px] font-semibold text-slate-500">contact(s) portant la même organisation</p></div><div className="rounded-2xl border border-slate-200 p-4"><p className="text-[8px] font-black uppercase tracking-[.14em] text-slate-400">Carte relationnelle</p><div className="mt-3 flex flex-wrap gap-2">{peers.map((peer) => <span key={peer.id} className="rounded-xl bg-slate-100 px-3 py-2 text-[9px] font-black text-slate-700">{peer.display_name || peer.phone_number_e164}</span>)}</div></div></div></Surface>; }
function ContactEditor({ contact, onClose, onSaved }: {
    contact: AcWhatsAppContact | null;
    onClose: () => void;
    onSaved: (contact: AcWhatsAppContact) => void;
}) {
    const [form, setForm] = useState({ phone_number_e164: contact?.phone_number_e164 || "", display_name: contact?.display_name || "", organization_name: contact?.organization_name || "", contact_type: contact?.contact_type || "prospect", preferred_language: contact?.preferred_language || "fr", city: contact?.city || "", lead_stage: contact?.lead_stage || "new", priority: contact?.priority || "normal", tags: (contact?.tags || []).join(", ") });
    const [busy, setBusy] = useState(false);
    const [notice, setNotice] = useState<Notice | null>(null);
    async function submit() { setBusy(true); try {
        const rows = await acApi<AcWhatsAppContact[]>("/api/ac-whatsapp/contacts", { method: "POST", body: JSON.stringify({ ...form, tags: form.tags.split(",").map((item) => item.trim()).filter(Boolean), whatsapp_id: contact?.whatsapp_id }) });
        onSaved(rows[0]);
    }
    catch (cause) {
        setNotice({ ...friendlyAcError(cause), tone: "danger" });
    }
    finally {
        setBusy(false);
    } }
    return <ModalFrame title={contact ? "Mettre à jour le dossier" : "Créer un contact 360"} eyebrow="Identity governance" description="Les informations deviennent disponibles aux opérateurs autorisés et restent auditables." onClose={onClose} footer={<div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2.5 text-[9px] font-black text-slate-600">Annuler</button><button type="button" onClick={() => void submit()} disabled={busy || !form.phone_number_e164} className="rounded-xl bg-rose-600 px-4 py-2.5 text-[9px] font-black text-white disabled:opacity-40">{busy ? "Enregistrement…" : "Enregistrer"}</button></div>}>{notice ? <NoticeBanner tone="danger" title={notice.title} description={notice.description}/> : null}<div className="contact-editor mt-4 grid gap-4 md:grid-cols-2"><EditorField label="Numéro E.164"><input value={form.phone_number_e164} onChange={(e) => setForm({ ...form, phone_number_e164: e.target.value })}/></EditorField><EditorField label="Nom affiché"><input value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })}/></EditorField><EditorField label="Organisation"><input value={form.organization_name} onChange={(e) => setForm({ ...form, organization_name: e.target.value })}/></EditorField><EditorField label="Ville"><input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}/></EditorField><EditorField label="Type"><select value={form.contact_type} onChange={(e) => setForm({ ...form, contact_type: e.target.value })}><option value="prospect">Prospect</option><option value="customer">Client</option><option value="partner">Partenaire</option><option value="family">Famille</option><option value="organization">Organisation</option></select></EditorField><EditorField label="Étape"><select value={form.lead_stage} onChange={(e) => setForm({ ...form, lead_stage: e.target.value })}><option value="new">Nouveau</option><option value="qualification">Qualification</option><option value="interested">Intéressé</option><option value="proposal">Proposition</option><option value="negotiation">Négociation</option><option value="customer">Client</option></select></EditorField><EditorField label="Priorité"><select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}><option value="normal">Normale</option><option value="high">Haute</option><option value="critical">Critique</option><option value="low">Basse</option></select></EditorField><EditorField label="Tags"><input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="b2b, rabat, vip"/></EditorField></div><style jsx global>{`.contact-editor input,.contact-editor select{width:100%;border:1px solid #e2e8f0;border-radius:14px;background:#fff;padding:11px 12px;font-size:11px;font-weight:700;color:#0f172a;outline:none}.contact-editor input:focus,.contact-editor select:focus{border-color:#94a3b8;box-shadow:0 0 0 3px rgba(148,163,184,.13)}`}</style></ModalFrame>;
}
function EditorField({ label, children }: {
    label: string;
    children: React.ReactNode;
}) { return <label><span className="mb-2 block text-[8px] font-black uppercase tracking-[.14em] text-slate-400">{label}</span>{children}</label>; }
