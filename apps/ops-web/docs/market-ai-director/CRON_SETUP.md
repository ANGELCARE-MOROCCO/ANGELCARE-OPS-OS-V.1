# Marketing Director AI — Scheduler

Call the secured endpoint at the frequency appropriate to your host. The endpoint itself loads only due schedules and respects `MARKETING_AI_MAX_DUE_RUNS_PER_BATCH`.

```bash
curl -X POST \
  -H "Authorization: Bearer $MARKETING_AI_CRON_SECRET" \
  https://YOUR_SANILA_DOMAIN/api/market-os/content-command/marketing-ai/cron
```

Recommended trigger: every hour. Individual commands remain configurable as manual, hourly, every four hours, daily, weekdays, weekly, biweekly, monthly, or quarterly.

The scheduler can prepare and orchestrate internal records only. It cannot send email, WhatsApp, publish externally, activate ads, submit external forms, or issue public statements.
