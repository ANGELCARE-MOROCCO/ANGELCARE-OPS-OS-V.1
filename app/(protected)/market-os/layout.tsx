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

            /* =========================================================
               MARKET OS PREMIUM POLISH — SAFE STATIC CSS ONLY
               ========================================================= */

            [data-market-os-white-shell] {
              background:
                radial-gradient(circle at 18% 0%, rgba(14, 165, 233, 0.10), transparent 26%),
                radial-gradient(circle at 88% 8%, rgba(124, 58, 237, 0.10), transparent 28%),
                linear-gradient(135deg, #ffffff 0%, #f8fafc 55%, #eef6ff 100%) !important;
            }

            [data-market-os-white-shell] main,
            [data-market-os-white-shell] section,
            [data-market-os-white-shell] article {
              color: #0f172a;
            }

            /* Kill remaining dark search/header surfaces without hiding content */
            [data-market-os-white-shell] [style*="#040b16"],
            [data-market-os-white-shell] [style*="#040816"],
            [data-market-os-white-shell] [style*="#0b1320"],
            [data-market-os-white-shell] [style*="#0d1726"],
            [data-market-os-white-shell] [style*="#09111e"],
            [data-market-os-white-shell] [style*="#101827"],
            [data-market-os-white-shell] [style*="rgba(2,6,23"],
            [data-market-os-white-shell] [style*="rgba(2, 6, 23"],
            [data-market-os-white-shell] [style*="rgba(15,23,42"],
            [data-market-os-white-shell] [style*="rgba(15, 23, 42"] {
              background: rgba(255, 255, 255, 0.92) !important;
              background-color: rgba(255, 255, 255, 0.92) !important;
              color: #0f172a !important;
              border-color: #e2e8f0 !important;
            }

            /* Search bar premium conversion */
            [data-market-os-white-shell] [style*="Search across Market-OS"],
            [data-market-os-white-shell] input,
            [data-market-os-white-shell] textarea,
            [data-market-os-white-shell] select {
              background: rgba(255, 255, 255, 0.92) !important;
              color: #0f172a !important;
              border: 1px solid #e2e8f0 !important;
              box-shadow: 0 18px 42px rgba(15, 23, 42, 0.07) !important;
            }

            /* Premium card rhythm */
            [data-market-os-white-shell] a[style],
            [data-market-os-white-shell] article[style],
            [data-market-os-white-shell] aside[style],
            [data-market-os-white-shell] section[style],
            [data-market-os-white-shell] div[style] {
              transition:
                transform 180ms ease,
                box-shadow 180ms ease,
                border-color 180ms ease,
                background 180ms ease;
            }

            [data-market-os-white-shell] a[style]:hover,
            [data-market-os-white-shell] article[style]:hover {
              transform: translateY(-2px);
              box-shadow: 0 22px 52px rgba(15, 23, 42, 0.10) !important;
              border-color: #c7d2fe !important;
            }

            /* Top action links */
            [data-market-os-white-shell] a[href*="campaign-lifecycle"],
            [data-market-os-white-shell] a[href="/market-os"] {
              font-weight: 800;
            }

            /* Sidebar refinement */
            [data-market-os-white-shell] nav a,
            [data-market-os-white-shell] aside a {
              border-radius: 16px;
            }

            /* KPI and panel visual lift */
            [data-market-os-white-shell] [style*="min-height: 142px"],
            [data-market-os-white-shell] [style*="minHeight: 142"] {
              background:
                linear-gradient(180deg, rgba(255,255,255,0.96), rgba(248,250,252,0.96)) !important;
              border: 1px solid #e2e8f0 !important;
              box-shadow: 0 18px 46px rgba(15,23,42,.07) !important;
            }

            /* Make the hero feel intentional, not empty */
            [data-market-os-white-shell] [style*="grid-template-columns: 1fr 350px"],
            [data-market-os-white-shell] [style*="gridTemplateColumns: 1fr 350px"] {
              background:
                radial-gradient(circle at 48% 0%, rgba(124,58,237,.10), transparent 44%),
                radial-gradient(circle at 8% 10%, rgba(14,165,233,.10), transparent 30%),
                linear-gradient(135deg, #ffffff, #f8fafc) !important;
              border: 1px solid #dbeafe !important;
              box-shadow: 0 28px 80px rgba(15,23,42,.08) !important;
            }

          `,
        }}
      />

      {children}
    </section>
  )
}
