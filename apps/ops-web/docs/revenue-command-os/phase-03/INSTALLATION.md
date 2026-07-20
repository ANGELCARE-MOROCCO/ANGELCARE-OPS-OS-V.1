# Installation

1. Apply the cumulative Mega ZIP 3 installer from the monorepo root.
2. Keep existing Revenue OS environment variables in Shadow mode.
3. Apply `supabase/migrations/20260720_revenue_command_os_phase3_doctrine_memory.sql` once to the same Supabase project already used by MZ01 and MZ02.
4. Run:

```bash
npm run revenue-os:phase3:typecheck
npm run revenue-os:phase3:verify
```

5. Start the application and open `/revenue-command-os/memory-learning`.

Do not apply `ROLLBACK.sql` during normal installation. No new external API key is required for Phase 3.
