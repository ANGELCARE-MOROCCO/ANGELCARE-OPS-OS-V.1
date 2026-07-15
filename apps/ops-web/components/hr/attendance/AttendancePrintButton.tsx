'use client'

export default function AttendancePrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-violet-100 print:hidden"
    >
      Print / Save PDF
    </button>
  )
}
