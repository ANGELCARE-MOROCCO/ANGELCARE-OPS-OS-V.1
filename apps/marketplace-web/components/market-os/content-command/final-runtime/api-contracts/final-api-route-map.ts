export const finalApiRouteMap = [
  {
    method: 'GET',
    path: '/api/market-os/content-command/assets',
    purpose: 'List content assets.',
    safeFirst: true,
  },
  {
    method: 'POST',
    path: '/api/market-os/content-command/assets',
    purpose: 'Create content asset through server validation.',
    safeFirst: false,
  },
  {
    method: 'POST',
    path: '/api/market-os/content-command/ai/run',
    purpose: 'Run protected AI task server-side.',
    safeFirst: false,
  },
];