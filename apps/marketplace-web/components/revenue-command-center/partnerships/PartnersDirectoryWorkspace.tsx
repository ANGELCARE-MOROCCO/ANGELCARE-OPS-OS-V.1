"use client";

import { useMemo, useState } from "react";
import { ArrowDownToLine, CheckCircle2, ChevronRight, Mail, MapPin, MoreHorizontal, Phone, Search, Trash2, X } from "lucide-react";
import { initialPartners, partnerTypes } from "./partnership-data";
import type { PartnerRecord } from "./partnership-types";
import { Card, Kpi, PartnerIcon, icons, money } from "./partnership-ui";

export default function PartnersDirectoryWorkspace({ partners = initialPartners }: { partners?: PartnerRecord[] }) {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("All Partners");
  const [selected, setSelected] = useState<PartnerRecord>(partners[0]);

  const filtered = useMemo(() => {
    return partners.filter((partner) => {
      const matchesTab =
        activeTab === "All Partners" ||
        activeTab === partner.type ||
        activeTab.includes(partner.type) ||
        partner.type.includes(activeTab.replace("s", ""));
      const blob = [partner.name, partner.contact, partner.email, partner.phone, partner.type, partner.category, partner.city, partner.district].join(" ").toLowerCase();
      return matchesTab && blob.includes(query.toLowerCase());
    });
  }, [partners, activeTab, query]);

  const totalRevenue = partners.reduce((sum, p) => sum + p.revenueImpact, 0);
  const activePartners = partners.filter((p) => p.status === "Active").length;
  const avgEngagement = Math.round(partners.reduce((sum, p) => sum + p.engagement, 0) / Math.max(1, partners.length));
  const totalPrograms = partners.reduce((sum, p) => sum + p.programs.length, 0);

  return (
    <div className="w-full space-y-7 text-white">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <h2 className="text-4xl font-black text-white">Partners Directory</h2>
            <p className="mt-2 text-sm font-bold text-white">Browse, manage, and grow your partner network across all partner types.</p>
          </div>
          <button className="rounded-2xl border border-white/15 bg-white/[0.07] px-5 py-3 font-black text-white hover:bg-violet-600">
            <ArrowDownToLine className="mr-2 inline h-4 w-4" /> Export Directory
          </button>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-6">
        <Kpi icon={icons.FileText} label="Total Partners" value={partners.length} delta="18% vs last 30 days" />
        <Kpi icon={icons.ShieldCheck} label="Active Partners" value={activePartners} delta="12% vs last 30 days" />
        <Kpi icon={icons.CalendarDays} label="New This Month" value="23" delta="20% vs last 30 days" />
        <Kpi icon={icons.FileText} label="Revenue Impact" value={money(totalRevenue)} delta="22% vs last 30 days" />
        <Kpi icon={icons.BarChart3} label="Engagement Rate" value={`${avgEngagement}%`} delta="8% vs last 30 days" />
        <Kpi icon={icons.Activity} label="Programs" value={totalPrograms} delta="16% vs last 30 days" />
      </div>

      <div className="grid gap-7 xl:grid-cols-[1fr_390px]">
        <main className="space-y-6">
          <Card>
            <div className="grid gap-4 xl:grid-cols-[1.6fr_repeat(5,1fr)]">
              <label className="relative">
                <Search className="absolute left-4 top-3.5 h-5 w-5 text-white/80" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search partners by name, contact, or ID..."
                  className="w-full rounded-2xl border border-white/15 bg-[#070d1c] py-3 pl-12 pr-4 text-sm font-bold text-white outline-none placeholder:text-white/65"
                />
              </label>
              {["All Types", "All Categories", "All Locations", "All Statuses", "All Programs"].map((label) => (
                <select key={label} className="rounded-2xl border border-white/15 bg-[#070d1c] px-4 py-3 text-sm font-black text-white outline-none">
                  <option>{label}</option>
                </select>
              ))}
            </div>
          </Card>

          <div className="flex gap-3 overflow-x-auto pb-1">
            {partnerTypes.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`shrink-0 rounded-2xl border px-5 py-3 text-sm font-black text-white ${
                  activeTab === tab ? "border-violet-300 bg-violet-600" : "border-white/15 bg-white/[0.07] hover:bg-white/[0.14]"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <Card className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1250px] text-left">
                <thead className="border-b border-white/15 text-xs uppercase tracking-[0.18em] text-white">
                  <tr>
                    {["Partner", "Type / Category", "Location", "Status", "Programs", "Revenue Impact", "Engagement", "Joined On", "Actions"].map((header) => (
                      <th key={header} className="px-6 py-5">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((partner) => (
                    <tr
                      key={partner.id}
                      onClick={() => setSelected(partner)}
                      className={`cursor-pointer border-b border-white/10 hover:bg-white/[0.05] ${selected?.id === partner.id ? "bg-violet-600/10" : ""}`}
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <PartnerIcon type={partner.type} />
                          <div>
                            <p className="font-black text-white">{partner.name}</p>
                            <p className="text-xs font-bold text-white/80">{partner.contact}</p>
                            <p className="text-xs font-bold text-white/65">{partner.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="rounded-lg border border-violet-300/20 bg-violet-500/20 px-3 py-1 text-xs font-black text-white">{partner.type}</span>
                        <p className="mt-2 text-xs font-bold text-white/75">{partner.category}</p>
                      </td>
                      <td className="px-6 py-5">
                        <p className="font-black text-white">{partner.city}</p>
                        <p className="text-xs font-bold text-white/75">{partner.district}</p>
                      </td>
                      <td className="px-6 py-5"><span className="rounded-full bg-emerald-500/25 px-3 py-1 text-xs font-black text-white">{partner.status}</span></td>
                      <td className="px-6 py-5 text-sm font-black text-white">{partner.programs.length} Programs</td>
                      <td className="px-6 py-5 font-black text-white">{money(partner.revenueImpact)}</td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <span className="font-black text-white">{partner.engagement}%</span>
                          <div className="h-2 w-24 rounded-full bg-white/15"><div className="h-2 rounded-full bg-emerald-400" style={{ width: `${partner.engagement}%` }} /></div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-sm font-bold text-white">{partner.joinedOn}</td>
                      <td className="px-6 py-5"><MoreHorizontal className="h-5 w-5 text-white" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </main>

        <aside className="sticky top-6 h-fit rounded-[30px] border border-white/15 bg-[linear-gradient(145deg,rgba(18,30,54,.98),rgba(8,16,31,.99))] p-6 text-white shadow-2xl">
          <div className="mb-5 flex justify-end">
            <button onClick={() => setSelected(partners[0])} className="rounded-xl bg-white/[0.08] p-2 hover:bg-white/[0.14]"><X className="h-4 w-4 text-white" /></button>
          </div>
          <div className="flex items-start gap-4">
            <PartnerIcon type={selected.type} />
            <div>
              <h3 className="text-xl font-black leading-6 text-white">{selected.name}</h3>
              <p className="mt-1 text-sm font-bold text-white">{selected.type}</p>
              <span className="mt-3 inline-flex rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-black text-white">{selected.status}</span>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-5 gap-2">
            {[Mail, Phone, MapPin, ChevronRight, MoreHorizontal].map((Icon, index) => (
              <button key={index} className="rounded-2xl border border-white/15 bg-white/[0.07] p-3 hover:bg-violet-600/40">
                <Icon className="mx-auto h-5 w-5 text-white" />
              </button>
            ))}
          </div>

          <div className="mt-6 flex gap-3 border-b border-white/15 text-sm font-black text-white">
            {["Overview", "Programs", "Performance", "Documents"].map((tab, index) => (
              <button key={tab} className={`pb-3 ${index === 0 ? "border-b-2 border-violet-400" : "text-white/80"}`}>{tab}</button>
            ))}
          </div>

          <div className="mt-6 space-y-5">
            {[
              ["Contact Person", selected.contact],
              ["Email", selected.email],
              ["Phone", selected.phone],
              ["Location", `${selected.city}, ${selected.district}`],
              ["Website", selected.website],
              ["Joined On", selected.joinedOn],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-white/75">{label}</p>
                <p className="mt-1 text-sm font-bold text-white">{value}</p>
              </div>
            ))}
            <p className="rounded-2xl border border-white/15 bg-white/[0.07] p-4 text-sm font-bold leading-6 text-white">{selected.summary}</p>
            <div className="space-y-3">
              {selected.programs.map((program) => (
                <div key={program} className="rounded-2xl border border-white/15 bg-white/[0.07] p-4">
                  <p className="text-sm font-black text-white">{program}</p>
                  <p className="mt-1 text-xs font-bold text-white/75">Active program relationship</p>
                </div>
              ))}
            </div>
            <button className="w-full rounded-2xl bg-violet-600 px-5 py-4 font-black text-white">Edit Partner</button>
            <button className="w-full rounded-2xl border border-red-300/30 bg-red-500/10 px-5 py-4 font-black text-red-100">
              <Trash2 className="mr-2 inline h-5 w-5" /> Delete Partner
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
