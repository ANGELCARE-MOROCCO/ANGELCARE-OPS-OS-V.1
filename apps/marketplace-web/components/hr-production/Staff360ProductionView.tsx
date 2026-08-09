"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Employee360DossierModal from "@/app/(protected)/hr/employees/_components/Employee360DossierModal";

type EmployeeRecord = Record<string, unknown>;

export default function Staff360ProductionView({ employeeId }: { employeeId: string }) {
  const router = useRouter();
  const [employee, setEmployee] = useState<EmployeeRecord | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      try {
        const response = await fetch(`/api/hr/employees?id=${encodeURIComponent(employeeId)}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const payload = await response.json() as { ok?: boolean; employee?: EmployeeRecord; error?: string };
        if (!response.ok || !payload.ok || !payload.employee) throw new Error(payload.error || "Collaborateur introuvable.");
        setEmployee(payload.employee);
      } catch (caught) {
        if (!controller.signal.aborted) setError(caught instanceof Error ? caught.message : "Chargement impossible.");
      }
    })();
    return () => controller.abort();
  }, [employeeId]);

  if (error) {
    return <div className="min-h-screen bg-slate-50 p-8"><div className="mx-auto max-w-3xl rounded-3xl border border-rose-200 bg-white p-8 text-center shadow-xl"><h1 className="text-2xl font-black text-slate-950">Dossier collaborateur indisponible</h1><p className="mt-3 font-bold text-rose-700">{error}</p><button onClick={() => router.push("/hr/employees")} className="mt-6 rounded-2xl bg-slate-950 px-5 py-3 font-black text-white">Retour aux collaborateurs</button></div></div>;
  }

  if (!employee) {
    return <div className="grid min-h-screen place-items-center bg-slate-50"><div className="rounded-3xl border border-slate-200 bg-white px-8 py-6 font-black text-slate-700 shadow-xl">Chargement du dossier Employee 360…</div></div>;
  }

  return (
    <Employee360DossierModal
      employee={employee}
      open
      onClose={() => router.push("/hr/employees")}
      onSaved={(updated) => {
        if (updated) setEmployee((current) => current ? { ...current, ...updated } : updated);
        router.refresh();
      }}
    />
  );
}
