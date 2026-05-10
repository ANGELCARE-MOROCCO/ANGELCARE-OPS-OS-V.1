"use client";

import { useMemo, useState } from "react";
import type { AmbassadorCampaignAssignment } from "@/lib/market-os/ambassadors/phase4-types";
import { formatMad, getCampaignProgress } from "@/lib/market-os/ambassadors/phase4-intelligence";

type Props = {
  assignments: AmbassadorCampaignAssignment[];
};

export function CampaignAssignmentOrchestrator({ assignments }: Props) {
  const [status, setStatus] = useState("all");

  const filteredAssignments = useMemo(() => {
    return assignments.filter((assignment) => status === "all" || assignment.status === status);
  }, [assignments, status]);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Campaign orchestration</p>
          <h2 className="mt-1 text-2xl font-black text-slate-950">Assignment command and mission revenue tracking</h2>
        </div>

        <select
          className="min-h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none ring-slate-300 transition focus:bg-white focus:ring-2"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option value="all">All statuses</option>
          <option value="draft">Draft</option>
          <option value="assigned">Assigned</option>
          <option value="in_progress">In progress</option>
          <option value="submitted">Submitted</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        {filteredAssignments.map((assignment) => {
          const progress = getCampaignProgress(assignment);

          return (
            <article key={assignment.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-black text-slate-950">{assignment.campaignName}</h3>
                  <p className="mt-1 text-xs font-semibold text-slate-500">{assignment.ambassadorName} · {assignment.city}</p>
                </div>
                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold uppercase text-slate-600 ring-1 ring-slate-200">
                  {assignment.status.replace("_", " ")}
                </span>
              </div>

              <p className="mt-4 text-sm text-slate-600">{assignment.objective}</p>

              <div className="mt-4">
                <div className="mb-2 flex justify-between text-xs font-bold text-slate-500">
                  <span>Revenue progress</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-200">
                  <div className="h-2 rounded-full bg-slate-950" style={{ width: `${progress}%` }} />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <Mini label="Target" value={formatMad(assignment.expectedRevenueMad)} />
                <Mini label="Current" value={formatMad(assignment.currentRevenueMad)} />
                <Mini label="Deadline" value={assignment.deadline} />
                <Mini label="Owner" value={assignment.owner} />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white p-3 ring-1 ring-slate-200">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-1 font-bold text-slate-950">{value}</p>
    </div>
  );
}
