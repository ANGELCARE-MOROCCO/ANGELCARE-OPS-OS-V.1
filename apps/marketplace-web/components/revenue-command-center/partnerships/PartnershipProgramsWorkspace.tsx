"use client";

import { useState } from "react";
import { ArrowRight, FileText, MoreHorizontal, Plus, Search, X } from "lucide-react";
import { initialPrograms } from "./partnership-data";
import type { ProgramRecord } from "./partnership-types";
import { Card, money } from "./partnership-ui";

function ProgramEditorModal({
  program,
  onClose,
  onSave,
}: {
  program: ProgramRecord | null;
  onClose: () => void;
  onSave: (program: ProgramRecord) => void;
}) {
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<ProgramRecord>(
    program || {
      id: `program-${Date.now()}`,
      name: "New Partnership Program",
      subtitle: "New enterprise partnership program",
      partnerType: "Preschools & Kindergarten",
      category: "Education Partnership",
      status: "Draft",
      partners: 0,
      revenueImpact: 0,
      engagement: 0,
      owner: "Partnership Programs Owner",
      city: "Rabat–Temara",
      offers: ["New offer"],
      pricingRules: ["New pricing rule"],
      contractTerms: ["New contract term"],
      eligibilityRequirements: ["New eligibility requirement"],
      publishReview: {
        publishStatus: "Draft",
        launchOwner: "Partnership Programs Owner",
        approvalRoute: "Program Owner → Finance → Legal → Executive Approval",
        executiveSummary: "Draft program pending enterprise review.",
        goLiveConditions: "All mandatory requirements and pricing approvals must be validated.",
        reportingCadence: "Weekly for first 30 days, then monthly.",
      },
    }
  );

  const steps = ["Program Information", "Services & Offers", "Pricing & Revenue", "Contracts & Terms", "Eligibility & Requirements", "Review & Publish"];
  const listKey = step === 2 ? "offers" : step === 3 ? "pricingRules" : step === 4 ? "contractTerms" : "eligibilityRequirements";

  function updateList(index: number, value: string) {
    const current = draft[listKey as keyof ProgramRecord] as string[];
    setDraft({ ...draft, [listKey]: current.map((item, i) => (i === index ? value : item)) });
  }

  function addItem() {
    const current = draft[listKey as keyof ProgramRecord] as string[];
    setDraft({ ...draft, [listKey]: [...current, `New item ${current.length + 1}`] });
  }

  return (
    <div className="fixed inset-0 z-[5000] overflow-y-auto bg-black/80 p-6 backdrop-blur-xl">
      <div className="mx-auto w-full max-w-[1750px] rounded-[36px] border border-white/15 bg-[#081224] p-8 text-white shadow-2xl">
        <div className="mb-8 flex items-start justify-between gap-6">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-violet-100">AngelCare Program Engine</p>
            <h2 className="mt-2 text-4xl font-black text-white">{program ? "Edit Partnership Program" : "Create New Partnership Program"}</h2>
            <p className="mt-2 text-sm font-bold text-white">Same 6-step enterprise modal for creation and edition. Save updates preview and PDF source.</p>
          </div>
          <button onClick={onClose} className="rounded-2xl bg-white/[0.08] p-3"><X className="h-5 w-5 text-white" /></button>
        </div>

        <div className="grid gap-8 xl:grid-cols-[310px_1fr]">
          <aside className="space-y-4">
            {steps.map((label, index) => (
              <button
                key={label}
                onClick={() => setStep(index + 1)}
                className={`flex w-full items-center gap-4 rounded-2xl border p-5 text-left font-black text-white ${
                  step === index + 1 ? "border-violet-300 bg-violet-600/35" : "border-white/15 bg-white/[0.07]"
                }`}
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15">{index + 1}</span>
                {label}
              </button>
            ))}
          </aside>

          <main className="space-y-6">
            {step === 1 ? (
              <Card>
                <h3 className="text-3xl font-black text-white">Program Information</h3>
                <div className="mt-6 grid gap-5 md:grid-cols-2">
                  {([
                    ["Program Name", "name"],
                    ["Subtitle", "subtitle"],
                    ["Partner Type", "partnerType"],
                    ["Category", "category"],
                    ["Owner", "owner"],
                    ["City Scope", "city"],
                    ["Status", "status"],
                    ["Partners", "partners"],
                    ["Revenue Impact", "revenueImpact"],
                    ["Engagement", "engagement"],
                  ] as const).map(([label, key]) => (
                    <label key={key} className="grid gap-2 text-sm font-black text-white">
                      {label}
                      <input
                        value={String(draft[key] as any)}
                        onChange={(event) =>
                          setDraft({
                            ...draft,
                            [key]: ["partners", "revenueImpact", "engagement"].includes(key)
                              ? Number(event.target.value.replace(/[^\d]/g, ""))
                              : event.target.value,
                          })
                        }
                        className="rounded-2xl border border-white/15 bg-[#070d1c] px-4 py-3 text-white outline-none"
                      />
                    </label>
                  ))}
                </div>
              </Card>
            ) : null}

            {step >= 2 && step <= 5 ? (
              <Card>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <h3 className="text-3xl font-black text-white">{steps[step - 1]}</h3>
                  <button onClick={addItem} className="rounded-2xl bg-violet-600 px-5 py-3 font-black text-white">
                    <Plus className="mr-2 inline h-4 w-4" /> Add Item
                  </button>
                </div>
                <div className="mt-6 grid gap-4">
                  {(draft[listKey as keyof ProgramRecord] as string[]).map((item, index) => (
                    <input
                      key={`${listKey}-${index}`}
                      value={item}
                      onChange={(event) => updateList(index, event.target.value)}
                      className="rounded-2xl border border-white/15 bg-[#070d1c] px-4 py-4 font-bold text-white outline-none"
                    />
                  ))}
                </div>
              </Card>
            ) : null}

            {step === 6 ? (
              <Card>
                <h3 className="text-3xl font-black text-white">Review & Publish</h3>
                <div className="mt-6 grid gap-5 md:grid-cols-2">
                  {([
                    ["Publish Status", "publishStatus"],
                    ["Launch Owner", "launchOwner"],
                    ["Approval Route", "approvalRoute"],
                    ["Executive Summary", "executiveSummary"],
                    ["Go-Live Conditions", "goLiveConditions"],
                    ["Reporting Cadence", "reportingCadence"],
                  ] as const).map(([label, key]) => (
                    <label key={key} className="grid gap-2 text-sm font-black text-white">
                      {label}
                      <textarea
                        value={draft.publishReview[key]}
                        onChange={(event) => setDraft({ ...draft, publishReview: { ...draft.publishReview, [key]: event.target.value } })}
                        className="min-h-[86px] rounded-2xl border border-white/15 bg-[#070d1c] px-4 py-3 text-white outline-none"
                      />
                    </label>
                  ))}
                </div>
                <div className="mt-6 grid gap-4 md:grid-cols-5">
                  {[
                    ["Offers", draft.offers.length],
                    ["Pricing", draft.pricingRules.length],
                    ["Contracts", draft.contractTerms.length],
                    ["Requirements", draft.eligibilityRequirements.length],
                    ["Revenue", money(draft.revenueImpact)],
                  ].map(([label, value]) => (
                    <div key={String(label)} className="rounded-2xl border border-white/15 bg-white/[0.07] p-5">
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-white">{label}</p>
                      <p className="mt-2 text-xl font-black text-white">{value}</p>
                    </div>
                  ))}
                </div>
              </Card>
            ) : null}

            <div className="flex justify-end gap-4">
              <button onClick={onClose} className="rounded-2xl border border-white/15 bg-white/[0.07] px-6 py-4 font-black text-white">Cancel</button>
              <button
                onClick={() => (step < 6 ? setStep(step + 1) : onSave(draft))}
                className="rounded-2xl bg-gradient-to-r from-violet-600 to-blue-600 px-6 py-4 font-black text-white"
              >
                {step < 6 ? "Next Step" : "Save & Close"} <ArrowRight className="ml-2 inline h-5 w-5" />
              </button>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

function ProgramPreviewModal({ program, onClose, onEdit }: { program: ProgramRecord; onClose: () => void; onEdit: () => void }) {
  function generatePdf() {
    const ref = `AC-PROG-${program.id.toUpperCase()}-${new Date().getFullYear()}`;
    const rows = (title: string, arr: string[]) => `<h2>${title}</h2><table>${arr.map((x) => `<tr><td>${x}</td></tr>`).join("")}</table>`;
    const html = `<!doctype html><html><head><title>${ref}</title><style>@page{size:A4;margin:14mm}body{font-family:Arial;color:#111}h1{font-size:30px}h2{border-left:5px solid #6d28d9;padding-left:10px}table{width:100%;border-collapse:collapse;margin:14px 0}td,th{border:1px solid #ddd;padding:8px;text-align:left}th{background:#111827;color:white}.page{min-height:267mm;page-break-after:always;position:relative}.footer{position:absolute;bottom:0;left:0;right:0;border-top:1px solid #ddd;padding-top:8px;font-size:10px;display:flex;justify-content:space-between}</style></head><body><section class="page"><h1>${program.name}</h1><p>${program.subtitle}</p><table><tr><th>Partner Type</th><td>${program.partnerType}</td></tr><tr><th>Status</th><td>${program.status}</td></tr><tr><th>Owner</th><td>${program.owner}</td></tr><tr><th>Revenue</th><td>${money(program.revenueImpact)}</td></tr></table>${rows("Offers", program.offers)}${rows("Pricing", program.pricingRules)}<div class="footer"><span>${ref}</span><span>Page 1/2</span></div></section><section class="page">${rows("Contracts", program.contractTerms)}${rows("Requirements", program.eligibilityRequirements)}<h2>Review & Publish</h2><p>${program.publishReview.executiveSummary}</p><p>${program.publishReview.goLiveConditions}</p><div class="footer"><span>${ref}</span><span>Page 2/2</span></div></section><script>window.onload=()=>window.print()</script></body></html>`;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(html);
    w.document.close();
  }

  return (
    <div className="fixed inset-0 z-[4800] overflow-y-auto bg-black/70 p-6 backdrop-blur-xl">
      <div className="mx-auto w-full max-w-6xl rounded-[34px] border border-white/15 bg-[#081224] p-8 text-white">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-4xl font-black text-white">{program.name}</h2>
            <p className="mt-2 font-bold text-white">{program.subtitle}</p>
          </div>
          <button onClick={onClose} className="rounded-2xl bg-white/[0.08] p-3"><X className="h-5 w-5 text-white" /></button>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          {[
            ["Type", program.partnerType],
            ["Partners", program.partners],
            ["Revenue", money(program.revenueImpact)],
            ["Engagement", `${program.engagement}%`],
          ].map(([label, value]) => (
            <Card key={String(label)}>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-white">{label}</p>
              <p className="mt-2 text-xl font-black text-white">{value}</p>
            </Card>
          ))}
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {[
            ["Offers", program.offers],
            ["Pricing", program.pricingRules],
            ["Contracts", program.contractTerms],
            ["Requirements", program.eligibilityRequirements],
          ].map(([title, list]) => (
            <Card key={String(title)}>
              <h3 className="text-xl font-black text-white">{title}</h3>
              <div className="mt-3 space-y-2">{(list as string[]).map((x) => <p key={x} className="rounded-xl bg-white/[0.07] px-4 py-3 font-bold text-white">{x}</p>)}</div>
            </Card>
          ))}
        </div>
        <div className="mt-6 flex justify-end gap-4">
          <button onClick={onEdit} className="rounded-2xl bg-violet-600 px-6 py-4 font-black text-white">Edit Full Program</button>
          <button onClick={generatePdf} className="rounded-2xl bg-emerald-600 px-6 py-4 font-black text-white"><FileText className="mr-2 inline h-5 w-5" />Generate PDF</button>
        </div>
      </div>
    </div>
  );
}

export default function PartnershipProgramsWorkspace() {
  const [programs, setPrograms] = useState<ProgramRecord[]>(initialPrograms);
  const [query, setQuery] = useState("");
  const [editor, setEditor] = useState<ProgramRecord | null | "new">(null);
  const [preview, setPreview] = useState<ProgramRecord | null>(null);

  const filtered = programs.filter((program) => [program.name, program.subtitle, program.partnerType, program.category].join(" ").toLowerCase().includes(query.toLowerCase()));

  function saveProgram(program: ProgramRecord) {
    setPrograms((prev) => (prev.some((item) => item.id === program.id) ? prev.map((item) => (item.id === program.id ? program : item)) : [program, ...prev]));
    setPreview(program);
    setEditor(null);
  }

  return (
    <div className="space-y-6 text-white">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div>
            <h2 className="text-3xl font-black text-white">AngelCare Partnership Programs</h2>
            <p className="mt-2 text-sm font-bold text-white">Manage, create, edit, save and publish partnership programs by partner type.</p>
          </div>
          <button onClick={() => setEditor("new")} className="rounded-2xl bg-violet-600 px-6 py-4 font-black text-white"><Plus className="mr-2 inline h-5 w-5" />New Program</button>
        </div>
      </Card>

      <Card>
        <label className="relative block max-w-xl">
          <Search className="absolute left-4 top-3.5 h-5 w-5 text-white/80" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search programs..." className="w-full rounded-2xl border border-white/15 bg-[#070d1c] py-3 pl-12 pr-4 text-white outline-none" />
        </label>
      </Card>

      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] text-left">
            <thead className="border-b border-white/15 text-xs uppercase tracking-[0.18em] text-white">
              <tr>{["Program", "Partner Type", "Partners", "Status", "Revenue Impact", "Engagement", "Actions"].map((header) => <th key={header} className="px-6 py-5">{header}</th>)}</tr>
            </thead>
            <tbody>
              {filtered.map((program) => (
                <tr key={program.id} onClick={() => setPreview(program)} className="cursor-pointer border-b border-white/10 hover:bg-white/[0.05]">
                  <td className="px-6 py-5"><p className="font-black text-white">{program.name}</p><p className="text-xs font-bold text-white/75">{program.subtitle}</p></td>
                  <td className="px-6 py-5"><span className="rounded-lg bg-violet-500/25 px-3 py-1 text-xs font-black text-white">{program.partnerType}</span></td>
                  <td className="px-6 py-5 font-black text-white">{program.partners}</td>
                  <td className="px-6 py-5"><span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-black text-white">{program.status}</span></td>
                  <td className="px-6 py-5 font-black text-white">{money(program.revenueImpact)}</td>
                  <td className="px-6 py-5 font-black text-white">{program.engagement}%</td>
                  <td className="px-6 py-5"><MoreHorizontal className="h-5 w-5 text-white" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {editor !== null ? <ProgramEditorModal program={editor === "new" ? null : editor} onClose={() => setEditor(null)} onSave={saveProgram} /> : null}
      {preview ? <ProgramPreviewModal program={preview} onClose={() => setPreview(null)} onEdit={() => setEditor(preview)} /> : null}
    </div>
  );
}
