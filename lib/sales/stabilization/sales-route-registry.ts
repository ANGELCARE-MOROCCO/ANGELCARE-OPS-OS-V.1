export const SALES_V30_CORE_ROUTES = [
  '/sales',
  '/sales/closing-room',
  '/sales/master-command',
  '/sales/orchestrator',
  '/sales/war-room',
  '/sales/playbooks',
  '/sales/objections',
  '/sales/quote-builder',
  '/sales/handoff',
]

export function isSalesV30Route(pathname: string) {
  return SALES_V30_CORE_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))
}
