'use client'
import { MissionWorkbench } from '../../product-experience/MissionWorkbench'
export function TimelineCanvas({ scenarioId }: { scenarioId?: string }) {
  return scenarioId ? <MissionWorkbench scenarioId={scenarioId} /> : <div className="rounded-[28px] border border-dashed border-slate-300 bg-white p-10 text-center"><h2 className="text-xl font-black text-slate-950">Aucun scénario chargé</h2><p className="mt-2 text-sm font-semibold text-slate-500">Ouvrez un scénario réel pour créer, déplacer, redimensionner, dupliquer et supprimer ses blocs.</p></div>
}
