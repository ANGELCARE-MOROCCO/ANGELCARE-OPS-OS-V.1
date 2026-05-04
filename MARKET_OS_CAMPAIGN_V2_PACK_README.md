# Market-OS Campaign Lifecycle V2 Pack

Inject this pack on top of your current app. It upgrades `/market-os/campaign-lifecycle` into a mature campaign command workspace.

## Adds
- Campaign V2 dashboard
- Campaign war-room detail route: `/market-os/campaign-lifecycle/[id]`
- Operational subpages: tasks, budget, approvals, analytics, automation, links, calendar, new
- Supabase CRUD APIs
- Campaign health, ROI, CPL, budget burn and playbook logic
- SQL migration for campaigns, tasks, approvals and events

## After injection
Run:

```bash
npm run build
```

Run this SQL in Supabase:

```txt
supabase/migrations/20260504_market_os_campaign_lifecycle_v2.sql
```

Then test:

```txt
/market-os/campaign-lifecycle
/market-os/campaign-lifecycle/camp-v2-rabat-childcare
/market-os/campaign-lifecycle/tasks
/market-os/campaign-lifecycle/budget
/market-os/campaign-lifecycle/approvals
/market-os/campaign-lifecycle/analytics
/market-os/campaign-lifecycle/automation
/market-os/campaign-lifecycle/links
/market-os/campaign-lifecycle/calendar
```
