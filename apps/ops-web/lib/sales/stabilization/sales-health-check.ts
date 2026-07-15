export type SalesHealthStatus = 'ok' | 'warning' | 'blocked'

export interface SalesHealthItem {
  key: string
  label: string
  status: SalesHealthStatus
  note: string
}

export function getStaticSalesHealth(): SalesHealthItem[] {
  return [
    {
      key: 'routes',
      label: 'Sales routes',
      status: 'ok',
      note: 'Core V30 route registry is available.',
    },
    {
      key: 'sql',
      label: 'SQL migrations',
      status: 'warning',
      note: 'Confirm all Pack 1–21 SQL files were run in Supabase SQL Editor, not terminal.',
    },
    {
      key: 'shared_api',
      label: 'Shared APIs',
      status: 'warning',
      note: 'Do not overwrite non-sales APIs such as global objective owners.',
    },
    {
      key: 'runtime',
      label: 'Runtime',
      status: 'warning',
      note: 'Run npm run dev and send the first real error if any appears.',
    },
  ]
}
