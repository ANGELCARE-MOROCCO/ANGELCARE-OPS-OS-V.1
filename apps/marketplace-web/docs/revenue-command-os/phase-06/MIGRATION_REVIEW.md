# Migration review

Migration: `20260720_revenue_command_os_phase6_golden_300.sql`

- Transaction wrapped: yes
- Additive tables: 4
- Existing command-kernel tables reused: yes
- 300 command definitions seeded idempotently: yes
- Normalized eligibility, context and tool contracts populated: yes
- 300 versions and triggers populated: yes
- 85 schedules populated: yes
- 24 graphs populated: yes
- 3,600 contract test cases populated: yes
- RLS enabled on new tables: yes
- `anon` and `authenticated` access revoked: yes
- `service_role` access granted: yes
- External actions enabled: no
- Destructive `DROP TABLE` in forward migration: no
- Rollback SQL supplied: yes
- SQL applied automatically: no
