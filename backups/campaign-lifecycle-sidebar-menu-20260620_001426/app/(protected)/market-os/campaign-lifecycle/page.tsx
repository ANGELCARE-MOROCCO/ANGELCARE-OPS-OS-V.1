import CampaignExecutionV2 from "@/components/market-os/campaign-lifecycle/campaign-execution-v2"

export const dynamic = "force-dynamic"

export default function Page() {
  return (
    <section data-campaign-lifecycle-shell className="min-h-screen bg-white text-slate-950">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            [data-campaign-lifecycle-shell] {
              min-height: 100vh;
              background:
                radial-gradient(circle at 12% 0%, rgba(14,165,233,.08), transparent 28%),
                radial-gradient(circle at 88% 0%, rgba(124,58,237,.08), transparent 30%),
                linear-gradient(135deg,#ffffff 0%,#f8fafc 56%,#eef6ff 100%);
              color: #020617;
              color-scheme: light;
            }

            [data-campaign-lifecycle-shell] main,
            [data-campaign-lifecycle-shell] section,
            [data-campaign-lifecycle-shell] article,
            [data-campaign-lifecycle-shell] aside {
              color: #020617;
            }

            [data-campaign-lifecycle-shell] .bg-white {
              background-color: rgba(255,255,255,.96);
            }

            [data-campaign-lifecycle-shell] .border-slate-100,
            [data-campaign-lifecycle-shell] .border-slate-200,
            [data-campaign-lifecycle-shell] .border-white\\/10,
            [data-campaign-lifecycle-shell] .border-white\\/20 {
              border-color: #e2e8f0 !important;
            }

            [data-campaign-lifecycle-shell] .shadow-sm,
            [data-campaign-lifecycle-shell] .shadow,
            [data-campaign-lifecycle-shell] .shadow-lg,
            [data-campaign-lifecycle-shell] .shadow-xl {
              box-shadow: 0 18px 46px rgba(15,23,42,.07) !important;
            }

            [data-campaign-lifecycle-shell] input,
            [data-campaign-lifecycle-shell] textarea,
            [data-campaign-lifecycle-shell] select {
              background: #ffffff !important;
              color: #020617 !important;
              border-color: #e2e8f0 !important;
            }

            [data-campaign-lifecycle-shell] input::placeholder,
            [data-campaign-lifecycle-shell] textarea::placeholder {
              color: #94a3b8 !important;
            }

            [data-campaign-lifecycle-shell] a,
            [data-campaign-lifecycle-shell] button {
              transition:
                transform 180ms ease,
                box-shadow 180ms ease,
                border-color 180ms ease,
                background 180ms ease;
            }

            [data-campaign-lifecycle-shell] a:hover,
            [data-campaign-lifecycle-shell] button:hover {
              transform: translateY(-1px);
            }
          `,
        }}
      />

      <CampaignExecutionV2 />
    </section>
  )
}
