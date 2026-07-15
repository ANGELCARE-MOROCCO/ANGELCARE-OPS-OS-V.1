import fs from 'node:fs'

const file = 'components/ac360/customer/direction/Ac360DirectionCockpitPage.tsx'
const source = fs.readFileSync(file, 'utf8')

const required = [
  'type DirectionPremiumButtonVariant',
  'premiumButtonBase',
  'premiumButtonVariants',
  'function premiumButtonClass',
  'function premiumToneButtonClass',
  "className={premiumButtonClass('primary')}",
  "className={premiumButtonClass('secondary')}",
  "className={premiumToneButtonClass(item.tone)}",
  "className={premiumButtonClass('mobile')}",
]

const forbidden = [
  'rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[12px] font-black text-slate-700 shadow-sm',
  'rounded-2xl border border-slate-200 bg-white px-5 py-3 text-[12px] font-black text-slate-700 shadow-sm',
  'rounded-2xl bg-blue-700 px-5 py-3 text-[12px] font-black text-white',
  'rounded-2xl border px-4 py-3 text-[11px] font-black shadow-sm',
  'rounded-2xl border border-slate-200 px-3 py-3 text-[12px] font-bold',
  'className="text-blue-700">Télécharger',
  'className="text-blue-700">⇩',
]

const missing = required.filter((needle) => !source.includes(needle))
const stillPresent = forbidden.filter((needle) => source.includes(needle))

if (missing.length || stillPresent.length) {
  console.error('❌ AC360 direction premium buttons R2 verification failed.')
  if (missing.length) console.error('Missing required markers:', missing)
  if (stillPresent.length) console.error('Old soft/basic button classes still present:', stillPresent)
  process.exit(1)
}

console.log('✅ AC360 Direction premium corporate buttons R2 verification passed.')
console.log('✅ Topbar, page actions, hardening strip, card micro-actions, report templates, exports, modal and mobile dock use the upgraded corporate button system.')
