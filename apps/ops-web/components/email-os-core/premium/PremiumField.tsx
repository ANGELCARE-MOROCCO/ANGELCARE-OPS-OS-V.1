"use client"

export function PremiumField({
  label,
  helper,
  children
}: {
  label: string
  helper?: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <div className="mb-2 flex items-end justify-between gap-3">
        <div className="text-sm font-black text-slate-900">{label}</div>
        {helper ? <div className="text-xs font-bold text-slate-400">{helper}</div> : null}
      </div>
      {children}
    </label>
  )
}

export function PremiumInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={[
        "h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none",
        "placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100",
        props.className || ""
      ].join(" ")}
    />
  )
}

export function PremiumSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={[
        "h-11 w-full cursor-pointer rounded-2xl border border-slate-200 bg-white px-3 text-sm font-black text-slate-900 outline-none",
        "focus:border-slate-400 focus:ring-4 focus:ring-slate-100",
        props.className || ""
      ].join(" ")}
    />
  )
}

export function PremiumToggle({
  checked,
  onChange,
  label,
  description
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  description?: string
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full cursor-pointer items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left hover:bg-slate-50"
    >
      <span>
        <span className="block text-sm font-black text-slate-950">{label}</span>
        {description ? <span className="mt-1 block text-xs font-semibold leading-5 text-slate-500">{description}</span> : null}
      </span>
      <span className={checked ? "rounded-full bg-slate-950 px-3 py-1 text-xs font-black text-white" : "rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-500"}>
        {checked ? "ON" : "OFF"}
      </span>
    </button>
  )
}
