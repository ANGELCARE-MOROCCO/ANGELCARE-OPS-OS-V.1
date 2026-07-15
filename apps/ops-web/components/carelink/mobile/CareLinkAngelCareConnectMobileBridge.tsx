'use client'

import AngelCareConnect from '@/app/components/connect/AngelCareConnect'
import { MessageCircle, Phone, Radio, ShieldCheck, Video } from 'lucide-react'

export default function CareLinkAngelCareConnectMobileBridge() {
  return (
    <section
      data-carelink-connect-mobile-bridge="true"
      className="relative overflow-hidden rounded-[2.35rem] border border-violet-100 bg-white p-3 shadow-[0_28px_80px_rgba(76,29,149,0.13)]"
    >
      <style>{`
        [data-carelink-connect-mobile-bridge="true"] {
          width: 100%;
          max-width: 100%;
          overflow: hidden;
        }

        [data-carelink-connect-mobile-bridge="true"] * {
          box-sizing: border-box;
        }

        [data-carelink-connect-mobile-bridge="true"] [data-connect-shell] {
          position: relative !important;
          inset: auto !important;
          left: auto !important;
          right: auto !important;
          top: auto !important;
          bottom: auto !important;
          z-index: 1 !important;
          width: 100% !important;
          min-width: 0 !important;
          max-width: 100% !important;
          height: calc(100dvh - 185px) !important;
          min-height: 650px !important;
          max-height: calc(100dvh - 185px) !important;
          border-radius: 28px !important;
          box-shadow: none !important;
          overflow: hidden !important;
        }

        [data-carelink-connect-mobile-bridge="true"] [data-connect-mobile-embedded="true"] {
          display: flex !important;
        }

        [data-carelink-connect-mobile-bridge="true"] [data-connect-mobile-pane="list"] > aside {
          display: flex !important;
          width: 100% !important;
          max-width: 100% !important;
          border-right: 0 !important;
        }

        [data-carelink-connect-mobile-bridge="true"] [data-connect-mobile-pane="list"] > main {
          display: none !important;
        }

        [data-carelink-connect-mobile-bridge="true"] [data-connect-mobile-pane="thread"] > aside {
          display: none !important;
        }

        [data-carelink-connect-mobile-bridge="true"] [data-connect-mobile-pane="thread"] > main {
          display: flex !important;
          width: 100% !important;
          max-width: 100% !important;
        }

        [data-carelink-connect-mobile-bridge="true"] [data-connect-shell] input,
        [data-carelink-connect-mobile-bridge="true"] [data-connect-shell] textarea,
        [data-carelink-connect-mobile-bridge="true"] [data-connect-shell] select {
          font-size: 16px !important;
        }

        [data-carelink-connect-mobile-bridge="true"] [data-connect-staff-directory-disabled="true"] [data-connect-staff-directory-item="true"],
        [data-carelink-connect-mobile-bridge="true"] [data-connect-staff-directory-disabled="true"] [data-connect-staff-directory-label="true"] {
          display: none !important;
        }

        [data-carelink-connect-mobile-bridge="true"] [data-connect-shell] button {
          touch-action: manipulation;
        }

        [data-carelink-connect-mobile-bridge="true"] [data-connect-shell] .truncate,
        [data-carelink-connect-mobile-bridge="true"] [data-connect-shell] [class*="truncate"] {
          min-width: 0 !important;
        }

        @media (max-width: 720px) {
          [data-carelink-connect-mobile-bridge="true"] {
            margin-left: -0.25rem;
            margin-right: -0.25rem;
            border-radius: 30px;
          }

          [data-carelink-connect-mobile-bridge="true"] [data-connect-shell] {
            height: calc(100dvh - 170px) !important;
            min-height: 640px !important;
            max-height: calc(100dvh - 170px) !important;
          }
        }
      `}</style>

      <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-violet-100 blur-3xl" />
      <div className="absolute -bottom-16 left-0 h-44 w-44 rounded-full bg-cyan-100 blur-3xl" />

      <div className="relative mb-4 px-2 pt-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.34em] text-violet-600">
              ANGELCARE CONNECT MOBILE
            </p>
            <h2 className="mt-2 text-2xl font-black leading-tight tracking-tight text-slate-950">
              Centre mobile voix, vidéo & messages
            </h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
              Version mobile adaptée du Connect existant: conversations, rooms, staff, messages, fichiers, audio, vidéo, appels entrants, appels actifs et LiveKit.
            </p>
          </div>

          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-slate-950 text-white shadow-lg" style={{ color: '#ffffff' }}>
            <MessageCircle size={24} />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-2">
          <div className="rounded-2xl bg-violet-50 p-3 text-center ring-1 ring-violet-100">
            <MessageCircle className="mx-auto h-4 w-4 text-violet-700" />
            <p className="mt-1 text-[9px] font-black uppercase tracking-[0.14em] text-violet-700">Chat</p>
          </div>
          <div className="rounded-2xl bg-blue-50 p-3 text-center ring-1 ring-blue-100">
            <Phone className="mx-auto h-4 w-4 text-blue-700" />
            <p className="mt-1 text-[9px] font-black uppercase tracking-[0.14em] text-blue-700">Voice</p>
          </div>
          <div className="rounded-2xl bg-cyan-50 p-3 text-center ring-1 ring-cyan-100">
            <Video className="mx-auto h-4 w-4 text-cyan-700" />
            <p className="mt-1 text-[9px] font-black uppercase tracking-[0.14em] text-cyan-700">Video</p>
          </div>
          <div className="rounded-2xl bg-emerald-50 p-3 text-center ring-1 ring-emerald-100">
            <ShieldCheck className="mx-auto h-4 w-4 text-emerald-700" />
            <p className="mt-1 text-[9px] font-black uppercase tracking-[0.14em] text-emerald-700">Live</p>
          </div>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-[1.9rem] border border-slate-200 bg-slate-50">
        <AngelCareConnect embedded defaultOpen mobileEmbedded hideContactDetails disableStaffDirectory />
      </div>

      <div className="relative mt-3 flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-white" style={{ color: '#ffffff' }}>
        <Radio size={16} />
        <p className="text-xs font-black uppercase tracking-[0.16em] text-white">
          Connect réel intégré · Appels et rooms via module existant
        </p>
      </div>
    </section>
  )
}
