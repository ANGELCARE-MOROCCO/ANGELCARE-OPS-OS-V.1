import 'leaflet/dist/leaflet.css'
import { CareLinkOpsApprovedSidebar } from '@/components/carelink/ops/CareLinkOpsApprovedSidebar'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function CareLinkOpsLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#f7f9fc] text-slate-950">
      <CareLinkOpsApprovedSidebar />

      <section className="min-h-screen pl-[220px]">
        <div className="carelink-ops-page-host min-h-screen w-full">
          {children}
        </div>
      </section>

      <style
        dangerouslySetInnerHTML={{
          __html: `
            .carelink-ops-page-host > aside,
            .carelink-ops-page-host > main > aside,
            .carelink-ops-page-host > div > aside {
              display: none !important;
            }

            .carelink-ops-page-host > main,
            .carelink-ops-page-host > div {
              margin-left: 0 !important;
              padding-left: 0 !important;
              width: 100% !important;
              max-width: none !important;
            }

            .carelink-ops-page-host .pl-72,
            .carelink-ops-page-host .pl-\\[220px\\],
            .carelink-ops-page-host .pl-\\[240px\\],
            .carelink-ops-page-host .pl-\\[260px\\],
            .carelink-ops-page-host .pl-\\[280px\\],
            .carelink-ops-page-host .pl-\\[300px\\],
            .carelink-ops-page-host .ml-72,
            .carelink-ops-page-host .ml-\\[220px\\],
            .carelink-ops-page-host .ml-\\[240px\\],
            .carelink-ops-page-host .ml-\\[260px\\],
            .carelink-ops-page-host .ml-\\[280px\\],
            .carelink-ops-page-host .ml-\\[300px\\] {
              padding-left: 0 !important;
              margin-left: 0 !important;
            }

            .carelink-ops-page-host [class*="max-w-"] {
              max-width: none;
            }
          `,
        }}
      />
    </main>
  )
}
