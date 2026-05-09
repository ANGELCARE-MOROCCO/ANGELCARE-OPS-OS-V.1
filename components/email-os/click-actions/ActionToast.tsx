"use client"

export default function ActionToast({
  toast,
  onClose
}: {
  toast: { type: "success" | "error"; message: string } | null
  onClose?: () => void
}) {
  if (!toast) return null

  return (
    <div className="fixed bottom-6 left-1/2 z-[80] -translate-x-1/2">
      <div
        className={[
          "flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold shadow-2xl",
          toast.type === "success"
            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
            : "border-rose-200 bg-rose-50 text-rose-800"
        ].join(" ")}
      >
        <span>{toast.message}</span>
        <button onClick={onClose} className="text-xs opacity-70 hover:opacity-100">
          Close
        </button>
      </div>
    </div>
  )
}
