
export default function AIComposeAssistant() {
  return (
    <div className="rounded-3xl border bg-white p-5">
      <div className="flex items-center justify-between"><h2 className="text-lg font-semibold">AI Compose Assistant</h2><span className="rounded-full bg-slate-100 px-3 py-1 text-xs">Enterprise AI</span></div>
      <div className="mt-5 space-y-3">
        {["Generate executive response", "Rewrite professionally", "Generate escalation summary", "Draft HR disciplinary notice", "Generate customer recovery email"].map((item) => (
          <button key={item} className="w-full rounded-xl border p-3 text-left">{item}</button>
        ))}
      </div>
    </div>
  )
}
