import type { ReactNode } from "react"

export default function MarketOSLayout({ children }: { children: ReactNode }) {
  return (
    <section data-market-os-white-shell className="min-h-screen bg-white text-slate-950">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            [data-market-os-white-shell] {
              min-height: 100vh;
              background: #ffffff !important;
              color: #020617;
              color-scheme: light;
            }

            [data-market-os-white-shell] > * {
              position: relative;
            }

            [data-market-os-white-shell] a {
              text-decoration: none;
            }

            [data-market-os-white-shell] .bg-slate-950,
            [data-market-os-white-shell] .bg-slate-900,
            [data-market-os-white-shell] .bg-gray-950,
            [data-market-os-white-shell] .bg-gray-900,
            [data-market-os-white-shell] .bg-zinc-950,
            [data-market-os-white-shell] .bg-zinc-900,
            [data-market-os-white-shell] .bg-neutral-950,
            [data-market-os-white-shell] .bg-neutral-900,
            [data-market-os-white-shell] .bg-black {
              background-color: #ffffff !important;
            }

            [data-market-os-white-shell] .text-white,
            [data-market-os-white-shell] .text-slate-50,
            [data-market-os-white-shell] .text-slate-100 {
              color: #020617 !important;
            }

            [data-market-os-white-shell] .text-slate-300,
            [data-market-os-white-shell] .text-slate-400 {
              color: #64748b !important;
            }

            [data-market-os-white-shell] .border-white\\/10,
            [data-market-os-white-shell] .border-white\\/20,
            [data-market-os-white-shell] .border-slate-800,
            [data-market-os-white-shell] .border-slate-700 {
              border-color: #e2e8f0 !important;
            }
          `,
        }}
      />

      {children}
    </section>
  )
}
