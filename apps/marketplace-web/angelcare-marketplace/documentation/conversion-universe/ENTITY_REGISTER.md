# Entity register

| Entity | Purpose | Canonical relationship |
|---|---|---|
| conversion_sessions | One governed public conversion attempt | Catalog item, territory, tenant, family/account and basket references |
| conversion_price_snapshots | Time-bound revalidation evidence | Finance price book/rule or truthful catalog/quote fallback |
| conversion_availability_holds | Temporary capacity protection | Catalog availability, Academy cohort, inventory or manual authority |
| conversion_consents | Versioned acceptance evidence | Session, locale, text hash and evidence |
| conversion_outcomes | Idempotent canonical handover | Family request, Academy enrollment, Partner subscription or CRM lead |
| conversion_events | Immutable event trail | Session lifecycle |
| conversion_exceptions | Recoverable failures and intervention queue | Session and severity |
| conversion_policies | Operational TTL and confirmation rules | Backoffice configuration authority |
| existing quote baskets/items | Transactional and quotation selection | Reused and extended; not duplicated |
