"use client"

import AmbassadorProductionWorkspace from "./ambassador-production-workspace"

export default function AmbassadorAddLiveProductionModal({ onClose }: { onClose?: () => void }) {
  return (
    <div className="fixed inset-0 z-[90] bg-white">
      <button
        type="button"
        onClick={onClose}
        className="fixed right-5 top-5 z-[100] rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black shadow-sm"
      >
        Close
      </button>
      <AmbassadorProductionWorkspace mode="create" />
    </div>
  )
}
