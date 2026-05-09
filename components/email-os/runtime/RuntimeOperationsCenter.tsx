
"use client"

import { useEmailOSRuntimeEvents } from "@/lib/email-os/runtime/realtime-client"

export default function RuntimeOperationsCenter() {
  const { events, connected } = useEmailOSRuntimeEvents(30)

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Email-OS Runtime Operations Center</h1>
              <p className="mt-2 text-sm text-slate-500">
                Live queue execution, SLA sweeps, realtime events, mailbox access and worker maturity.
              </p>
            </div>
            <span className="rounded-full border px-3 py-1 text-xs font-semibold">
              Realtime: {connected ? "CONNECTED" : "WAITING"}
            </span>
          </div>
        </section>

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {[
            "Queue Worker",
            "SLA Sweep",
            "Runtime Events",
            "Mailbox Access"
          ].map((item) => (
            <div key={item} className="rounded-3xl border bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold">{item}</h2>
              <p className="mt-2 text-sm text-slate-500">
                Production execution layer for {item.toLowerCase()}.
              </p>
            </div>
          ))}
        </section>

        <section className="rounded-3xl border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold">Realtime Runtime Events</h2>
          <div className="mt-4 space-y-3">
            {events.length === 0 ? (
              <div className="rounded-2xl border p-4 text-sm text-slate-500">
                No runtime events yet.
              </div>
            ) : (
              events.map((event) => (
                <div key={event.id} className="rounded-2xl border p-4">
                  <div className="font-semibold">{event.type}</div>
                  <div className="mt-1 text-xs text-slate-500">{event.created_at}</div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  )
}
