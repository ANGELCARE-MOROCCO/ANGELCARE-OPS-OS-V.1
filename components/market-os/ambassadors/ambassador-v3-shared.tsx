// STORAGE KEYS
export const AMBASSADOR_STORAGE_KEY = "ambassadors_v3"
export const MISSION_STORAGE_KEY = "missions_v3"
export const PROGRAM_STORAGE_KEY = "programs_v3"
export const REWARD_STORAGE_KEY = "rewards_v3"

// TYPES
export type AmbassadorRecord = {
  id: string
  name: string
  phone?: string
  email?: string
  city?: string
  territory?: string
  status?: string
  program?: string
  tier?: string
  commission?: string
  source?: string
  owner?: string
  notes?: string
  createdAt?: string
  updatedAt?: string
}

export type MissionRecord = {
  id: string
  title: string
  ambassadorId?: string
  missionType?: string
  status?: string
  dueDate?: string
  reward?: string
  proofRequired?: string
  instructions?: string
  owner?: string
  notes?: string
  createdAt?: string
  updatedAt?: string
}

export type ProgramRecord = {
  id: string
  name: string
  tier?: string
  commission?: string
  eligibility?: string
  regions?: string
  training?: string
  bonusRules?: string
  notes?: string
  status?: string
  createdAt?: string
  updatedAt?: string
}

export type RewardRecord = {
  id: string
  title?: string
  ambassadorId?: string
  amount?: string
  reason?: string
  payoutDate?: string
  status?: string
  notes?: string
  createdAt?: string
  updatedAt?: string
}

// UI HELPERS
export const statusOptions = ["active", "onboarding", "paused", "watchlist", "pending", "approved", "rejected", "candidate", "planned", "draft", "open"]
export const tierOptions = ["starter", "bronze", "silver", "gold", "platinum"]
export const programOptions = ["default", "Mothers Circle", "Community Mothers Program", "Clinic Referral Program", "Academy Advocate Program"]
export const territoryOptions = ["Rabat", "Temara", "Sale", "Casablanca", "Marrakech", "Rabat-Sale-Kenitra", "Grand Casablanca"]

// UTILITIES
export function uid(prefix = "id") {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).substring(2, 10)

  return `${prefix}-${random}`
}

export function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback
  try {
    const data = localStorage.getItem(key)
    return data ? (JSON.parse(data) as T) : fallback
  } catch {
    return fallback
  }
}

export function writeJson<T>(key: string, value: T) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Ignore storage write failures so UI does not crash.
  }
}

// BASIC UI COMPONENTS
type FieldProps = {
  label?: string
  children?: React.ReactNode
  className?: string
}

export const Field = ({ label, children, className = "" }: FieldProps) => (
  <label className={className || "block"}>
    {label ? <span className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-slate-500">{label}</span> : null}
    {children}
  </label>
)

export const TextInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    className={
      props.className ||
      "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-950 outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100"
    }
  />
)

export const SelectInput = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select
    {...props}
    className={
      props.className ||
      "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-950 outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100"
    }
  />
)

export const TextArea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea
    {...props}
    className={
      props.className ||
      "w-full min-h-[120px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-950 outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100"
    }
  />
)

export const PrimaryButton = (props: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    {...props}
    className={
      props.className ||
      "rounded-xl bg-emerald-700 px-4 py-2 text-sm font-black text-white shadow-sm transition hover:bg-emerald-800"
    }
  />
)

export const SoftButton = (props: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    {...props}
    className={
      props.className ||
      "rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
    }
  />
)

export const DangerButton = (props: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    {...props}
    className={
      props.className ||
      "rounded-xl bg-rose-600 px-4 py-2 text-sm font-black text-white shadow-sm transition hover:bg-rose-700"
    }
  />
)

type PanelProps = {
  title?: string
  subtitle?: string
  children?: React.ReactNode
  className?: string
}

export const Panel = ({ title, subtitle, children, className = "" }: PanelProps) => (
  <section className={className || "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"}>
    {title || subtitle ? (
      <div className="mb-4">
        {title ? <h2 className="text-lg font-black text-slate-950">{title}</h2> : null}
        {subtitle ? <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">{subtitle}</p> : null}
      </div>
    ) : null}
    {children}
  </section>
)

type MetricCardProps = {
  label?: string
  value?: string | number
  note?: string
  children?: React.ReactNode
  className?: string
}

export const MetricCard = ({ label, value, note, children, className = "" }: MetricCardProps) => (
  <div className={className || "rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm"}>
    {label ? <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">{label}</p> : null}
    {value !== undefined ? <p className="mt-2 text-2xl font-black text-slate-950">{value}</p> : null}
    {note ? <p className="mt-1 text-xs font-bold text-slate-500">{note}</p> : null}
    {children}
  </div>
)

type PageShellProps = {
  children?: React.ReactNode
  className?: string
  title?: string
  subtitle?: string
}

export const PageShell = ({ children, className = "", title, subtitle }: PageShellProps) => (
  <main className={className || "min-h-screen bg-slate-50 p-4 text-slate-950 lg:p-8"}>
    {title || subtitle ? (
      <section className="mb-6 rounded-3xl bg-slate-950 p-6 text-white">
        {title ? <h1 className="text-3xl font-black text-white">{title}</h1> : null}
        {subtitle ? <p className="mt-2 text-sm font-semibold text-white/75">{subtitle}</p> : null}
      </section>
    ) : null}
    {children}
  </main>
)