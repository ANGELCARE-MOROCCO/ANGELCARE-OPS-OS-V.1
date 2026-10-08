import type { ReactNode, SVGProps } from 'react'

export type ZoneCIconName =
  | 'finance' | 'invoice' | 'payment' | 'balance' | 'fee' | 'discount' | 'reminder'
  | 'receipt' | 'statement' | 'expense' | 'audit' | 'report' | 'template' | 'request'
  | 'history' | 'shield' | 'search' | 'command' | 'arrow' | 'lock' | 'check' | 'warning'

const paths: Record<ZoneCIconName, ReactNode> = {
  finance: <><path d="M4 20h16"/><path d="M6 16V8"/><path d="M10 16V8"/><path d="M14 16V8"/><path d="M18 16V8"/><path d="M3 8h18L12 3 3 8Z"/></>,
  invoice: <><path d="M6 3h9l3 3v15H6z"/><path d="M15 3v4h4"/><path d="M9 11h6M9 15h6"/></>,
  payment: <><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18M7 15h4"/></>,
  balance: <><path d="M5 7h14M7 4h10"/><path d="M12 7v12"/><path d="m7 11-3 5h6l-3-5Zm10 0-3 5h6l-3-5Z"/></>,
  fee: <><path d="M4 5h16v14H4z"/><path d="M8 9h8M8 13h5"/><circle cx="17" cy="15" r="1"/></>,
  discount: <><path d="m4 12 8-8h6l2 2v6l-8 8-8-8Z"/><circle cx="15" cy="9" r="1.2"/></>,
  reminder: <><path d="M18 8a6 6 0 1 0 1.2 3.6"/><path d="M18 4v4h-4M12 9v4l3 2"/></>,
  receipt: <><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6M9 16h4"/></>,
  statement: <><path d="M5 4h14v16H5z"/><path d="M8 8h8M8 12h8M8 16h5"/></>,
  expense: <><circle cx="12" cy="12" r="9"/><path d="M8 12h8M12 8v8"/></>,
  audit: <><circle cx="10" cy="10" r="6"/><path d="m14.5 14.5 5 5M8 10h4M10 8v4"/></>,
  report: <><path d="M5 20V7h14v13"/><path d="M8 16v-4M12 16V9M16 16v-7"/><path d="M4 20h16"/></>,
  template: <><path d="M4 4h16v16H4z"/><path d="M4 9h16M9 9v11"/></>,
  request: <><path d="M6 3h12v18H6z"/><path d="M9 8h6M9 12h4"/><circle cx="15" cy="16" r="2"/></>,
  history: <><path d="M4 12a8 8 0 1 0 2-5"/><path d="M4 4v5h5M12 8v5l3 2"/></>,
  shield: <><path d="M12 3 5 6v5c0 4.5 2.8 7.6 7 10 4.2-2.4 7-5.5 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-5"/></>,
  search: <><circle cx="10" cy="10" r="6"/><path d="m14.5 14.5 5 5"/></>,
  command: <><path d="M9 7H6a3 3 0 1 0 3 3V7Zm6 0h3a3 3 0 1 1-3 3V7ZM9 17H6a3 3 0 1 1 3-3v3Zm6 0h3a3 3 0 1 0-3-3v3Z"/><path d="M9 7h6v10H9z"/></>,
  arrow: <><path d="M5 12h14M14 7l5 5-5 5"/></>,
  lock: <><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>,
  check: <path d="m5 12 4 4L19 6"/>,
  warning: <><path d="M12 3 2.8 20h18.4L12 3Z"/><path d="M12 9v5M12 17h.01"/></>,
}

export default function ZoneCIcon({ name, ...props }: { name: ZoneCIconName } & SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name]}</svg>
}
