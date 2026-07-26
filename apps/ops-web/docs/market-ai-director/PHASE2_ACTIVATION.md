# SANILA Marketing Director AI — Phase 2 activation

1. Confirm that Content Command 360 Phase 1 is installed and its TypeScript gate passes.
2. Add the required values from `configuration/market-ai-director/ENVIRONMENT.example` to `.env.local`; never commit secrets.
3. Back up Supabase.
4. Run the read-only preflight:
   `supabase/market-ai-director/preflight/20260725_market_ai_phase2_preflight.sql`
5. Continue only when `cutover_gate = READY` or after a reviewed compatible existing schema.
6. Apply:
   `supabase/migrations/20260725_2300_market_ai_director_phase2.sql`
7. Run:
   `supabase/market-ai-director/verification/20260725_market_ai_phase2_verification.sql`
8. Verify exactly 60 core skills and 3,000 unique commands.
9. Open `/market-os/content-command-center/ai-director/settings` and run the live Gemini and Bridge health checks.
10. Configure an hourly call to the secured cron endpoint.

External actions remain unavailable by design. A human operator retains final conception, approval, communication, advertising, and publication authority.
