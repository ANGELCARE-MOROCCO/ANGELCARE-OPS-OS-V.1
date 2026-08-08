"use client"


import { useEffect } from "react"
/**
 * MZ7.1 — Deterministic Contrast & Floating Surface Integrity
 * React-rendered style contract scoped to AC WhatsApp Live only.
 * No MutationObserver, DOM scanning, runtime class mutation, or backend behavior.
 */
export function ACWhatsAppContrastGuard() {
  useEffect(() => {
    const root = document.documentElement
    const previous = root.getAttribute("data-acw-live")
    root.setAttribute("data-acw-live", "true")
    return () => {
      if (previous === null) root.removeAttribute("data-acw-live")
      else root.setAttribute("data-acw-live", previous)
    }
  }, [])
  return (
    <style>{`
      [data-acw-live="true"] {
        --acw-ink:#0f172a; --acw-muted:#475569; --acw-line:#dbe3ee;
        --acw-surface:#ffffff; --acw-surface-soft:#f8fafc; --acw-navy:#020817;
        --acw-amber-bg:#fef3c7; --acw-amber-line:#f5c542; --acw-amber-ink:#713f12;
        --acw-green-bg:#dcfce7; --acw-green-line:#86efac; --acw-green-ink:#14532d;
        --acw-rose-bg:#ffe4e6; --acw-rose-line:#fda4af; --acw-rose-ink:#881337;
        --acw-blue-bg:#dbeafe; --acw-blue-line:#93c5fd; --acw-blue-ink:#1e3a8a;
      }

      [data-acw-live="true"] .acw-floating-surface {
        color:var(--acw-ink)!important; background:rgba(255,255,255,.985)!important;
        border-color:var(--acw-line)!important;
        box-shadow:0 26px 70px rgba(15,23,42,.18),0 7px 18px rgba(15,23,42,.08)!important;
        isolation:isolate; z-index:120!important; -webkit-font-smoothing:antialiased;
      }
      [data-acw-live="true"] .acw-floating-surface h1,
      [data-acw-live="true"] .acw-floating-surface h2,
      [data-acw-live="true"] .acw-floating-surface h3,
      [data-acw-live="true"] .acw-floating-surface h4,
      [data-acw-live="true"] .acw-floating-surface p,
      [data-acw-live="true"] .acw-floating-surface label,
      [data-acw-live="true"] .acw-floating-surface button,
      [data-acw-live="true"] .acw-floating-surface [role="menuitem"] { color:var(--acw-ink); }
      [data-acw-live="true"] .acw-floating-surface button:not(:disabled):hover,
      [data-acw-live="true"] .acw-floating-surface [role="menuitem"]:hover { background-color:#f1f5f9; }
      [data-acw-live="true"] .acw-floating-surface button:disabled {
        color:#94a3b8!important; background-color:#f8fafc!important; cursor:not-allowed;
      }

      [data-acw-live="true"] .acw-status-warning { color:var(--acw-amber-ink)!important; background:var(--acw-amber-bg)!important; border-color:var(--acw-amber-line)!important; font-weight:900!important; }
      [data-acw-live="true"] .acw-status-success { color:var(--acw-green-ink)!important; background:var(--acw-green-bg)!important; border-color:var(--acw-green-line)!important; font-weight:900!important; }
      [data-acw-live="true"] .acw-status-danger { color:var(--acw-rose-ink)!important; background:var(--acw-rose-bg)!important; border-color:var(--acw-rose-line)!important; font-weight:900!important; }
      [data-acw-live="true"] .acw-status-info { color:var(--acw-blue-ink)!important; background:var(--acw-blue-bg)!important; border-color:var(--acw-blue-line)!important; font-weight:900!important; }
      [data-acw-live="true"] .acw-status-neutral { color:#1e293b!important; background:#f1f5f9!important; border-color:#cbd5e1!important; font-weight:900!important; }

      [data-acw-live="true"] .acw-message-menu {
        min-width:260px; max-width:min(340px,calc(100vw - 32px)); padding:10px!important;
        border-radius:20px!important; overflow:hidden;
      }
      [data-acw-live="true"] .acw-message-menu button,
      [data-acw-live="true"] .acw-message-menu [role="menuitem"] {
        width:100%; min-height:42px; border-radius:12px; padding:10px 12px;
        text-align:left; font-weight:750; line-height:1.2;
      }
      [data-acw-live="true"] .acw-message-menu svg { color:#475569; }

      [data-acw-live="true"] .acw-command-modal {
        color:var(--acw-ink)!important; background:#fff!important; border:1px solid #dbe3ee!important;
        border-radius:28px!important; box-shadow:0 42px 110px rgba(15,23,42,.28)!important;
      }
      [data-acw-live="true"] .acw-command-modal h1,
      [data-acw-live="true"] .acw-command-modal h2,
      [data-acw-live="true"] .acw-command-modal h3 { color:#020617!important; }
      [data-acw-live="true"] .acw-command-modal p { color:#475569; }

      [data-acw-live="true"] .acw-attachment-action {
        color:#0f172a!important; background:#fff!important; border:1px solid #cbd5e1!important;
        box-shadow:0 2px 5px rgba(15,23,42,.10); font-weight:850!important;
      }
      [data-acw-live="true"] .acw-attachment-action:hover:not(:disabled) {
        color:#020617!important; background:#f8fafc!important; border-color:#94a3b8!important;
      }
      [data-acw-live="true"] .acw-attachment-action:disabled {
        color:#64748b!important; background:#e2e8f0!important; border-color:#cbd5e1!important;
        opacity:.78;
      }
      [data-acw-live="true"] .acw-light-surface { color:var(--acw-ink)!important; background:var(--acw-surface)!important; }
    `}</style>
  )
}
