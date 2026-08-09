'use client'
import { ScenarioComparisonTheatre } from '../../product-experience/ScenarioComparisonTheatre'
export function ScenarioComparisonWorkspace({ requestId }: { requestId?: string }) {
  return requestId ? <ScenarioComparisonTheatre requestId={requestId} /> : <div className="rounded-[28px] border border-dashed border-slate-300 bg-white p-10 text-center"><h2 className="text-xl font-black text-slate-950">Sélectionnez une demande réelle</h2><p className="mt-2 text-sm font-semibold text-slate-500">Le Comparison Theatre ne fabrique aucun scénario lorsqu’aucune demande n’est fournie.</p></div>
}
