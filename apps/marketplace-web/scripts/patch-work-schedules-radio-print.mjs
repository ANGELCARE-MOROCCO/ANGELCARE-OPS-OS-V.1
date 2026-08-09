import fs from 'node:fs'
import path from 'node:path'

const file = path.join(process.cwd(), 'app/(protected)/hr/work-schedules/page.tsx')
if (!fs.existsSync(file)) {
  console.error('Missing app/(protected)/hr/work-schedules/page.tsx')
  process.exit(1)
}
let s = fs.readFileSync(file, 'utf8')

// Add reusable old-radio utility classes right after ringTone if missing.
if (!s.includes('function radioPanelClasses()')) {
  const anchor = `function ringTone(tone: string) {
  const map: Record<string, string> = { green: 'bg-emerald-500', emerald: 'bg-emerald-500', blue: 'bg-blue-500', violet: 'bg-violet-500', orange: 'bg-orange-500', pink: 'bg-pink-500', indigo: 'bg-indigo-500', slate: 'bg-slate-400' }
  return map[tone] || 'bg-orange-500'
}`
  const insert = `${anchor}
function radioPanelClasses() {
  return 'rounded-[34px] border-[3px] border-[#244318] bg-[#9BE564] p-6 text-[#061807] shadow-[inset_0_0_0_2px_rgba(255,255,255,0.35),inset_0_-18px_40px_rgba(48,90,25,0.20),0_28px_80px_rgba(22,101,52,0.25)]'
}
function radioScreenClasses() {
  return 'rounded-3xl border border-[#33591e] bg-[#c8ff8b]/80 px-5 py-4 text-sm font-black text-[#071807] shadow-[inset_0_3px_14px_rgba(28,55,17,0.18)]'
}
function radioButtonClasses(kind: 'primary' | 'safe' | 'danger' | 'muted' = 'primary') {
  if (kind === 'danger') return 'rounded-3xl border-2 border-[#3b180f] bg-[#ff6d47] p-5 text-sm font-black text-black shadow-[0_12px_0_#5b2116] transition hover:-translate-y-0.5'
  if (kind === 'safe') return 'rounded-3xl border-2 border-[#254318] bg-[#d8ff91] p-5 text-sm font-black text-black shadow-[0_12px_0_#2e4d1d] transition hover:-translate-y-0.5'
  if (kind === 'muted') return 'rounded-3xl border-2 border-[#41521f] bg-[#b6dc78] p-5 text-sm font-black text-black shadow-[0_10px_0_#405326] transition hover:-translate-y-0.5'
  return 'rounded-3xl border-2 border-[#142f17] bg-[#8ff243] p-5 text-sm font-black text-black shadow-[0_12px_0_#265719] transition hover:-translate-y-0.5'
}`
  s = s.replace(anchor, insert)
}

// Convert specific dark side panels to old green radio display style.
s = s.replaceAll('className="rounded-[34px] bg-slate-950 p-6 text-white shadow-2xl"', 'className={radioPanelClasses()}')
s = s.replaceAll('className="text-3xl font-black"', 'className="text-3xl font-black text-black"')
s = s.replaceAll('className="mt-2 text-sm font-bold leading-6 text-slate-300"', 'className="mt-2 text-sm font-black leading-6 text-black/80"')
s = s.replaceAll('className="rounded-2xl bg-white/10 p-4 text-sm font-bold"', 'className={radioScreenClasses()}')
s = s.replaceAll('className="rounded-3xl bg-white/10 p-5 text-sm font-black"', 'className={radioButtonClasses(\'muted\')}')
s = s.replaceAll('className="rounded-3xl bg-white/10 p-5 text-center text-sm font-black"', 'className={radioButtonClasses(\'muted\') + " text-center"}')
s = s.replaceAll('className="rounded-3xl bg-rose-500 p-5 text-sm font-black"', 'className={radioButtonClasses(\'danger\')}')
s = s.replaceAll('className="rounded-3xl bg-gradient-to-r from-violet-600 to-cyan-500 p-5 text-sm font-black text-white"', 'className={radioButtonClasses(\'primary\')}')
s = s.replaceAll('className="mt-6 rounded-3xl bg-white/10 p-4 text-xs font-bold leading-6 text-slate-200"', 'className={radioScreenClasses() + " mt-6 text-xs leading-6"}')
s = s.replaceAll('className="mt-6 w-full rounded-3xl bg-gradient-to-r from-violet-600 to-cyan-500 p-5 text-sm font-black text-white shadow-xl"', 'className={radioButtonClasses(\'primary\') + " mt-6 w-full"}')
s = s.replaceAll('className="mt-6 w-full rounded-3xl bg-gradient-to-r from-violet-700 via-fuchsia-600 to-cyan-500 p-5 text-sm font-black text-white shadow-xl"', 'className={radioButtonClasses(\'primary\') + " mt-6 w-full"}')
s = s.replaceAll('className="rounded-3xl bg-white/10 p-4 text-sm font-bold text-slate-200"', 'className={radioScreenClasses()}')
s = s.replaceAll('className="rounded-3xl bg-white/10 p-4 text-sm font-bold leading-6 text-slate-200"', 'className={radioScreenClasses() + " leading-6"}')

// Improve readability of any residual text inside green panels.
s = s.replaceAll('text-slate-300', 'text-black/75')
s = s.replaceAll('text-slate-200', 'text-black/75')
s = s.replaceAll('text-violet-200', 'text-black/70')

// Replace print modal title/subtitle if present.
s = s.replaceAll('Print intelligence', 'Roster print command')
s = s.replaceAll('Preflight checks before generating the PDF-ready roster.', 'Old-radio print console with A4 landscape daily, weekly and monthly board templates.')
s = s.replaceAll('Generate PDF-ready roster now', 'Generate office-board roster PDF')

fs.writeFileSync(file, s)
console.log('Patched work-schedules radio panels and print modal styling.')
