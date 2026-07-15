export const apiRouteImplementationGuide = [
  {
    route: 'app/api/market-os/content-command/assets/route.ts',
    methods: ['GET', 'POST'],
    notes: 'Create only after repository wiring is live and RLS is validated.',
  },
  {
    route: 'app/api/market-os/content-command/assets/[id]/route.ts',
    methods: ['GET', 'PATCH', 'DELETE'],
    notes: 'Use server-side validation, permission checks, and audit.',
  },
  {
    route: 'app/api/market-os/content-command/ai/run/route.ts',
    methods: ['POST'],
    notes: 'Server-only AI provider execution. Never expose provider keys.',
  },
];