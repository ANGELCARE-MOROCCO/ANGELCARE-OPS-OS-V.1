# Lifecycle matrix

`draft → configuring → identity_pending → eligibility_pending/availability_pending → consent_pending → review → ready → submitted/confirmed/handover_pending`

Terminal states: `expired`, `cancelled`, `failed`.

Price snapshots: `valid`, `quote_required`, `expired`, `rejected`. Holds: `held`, `confirmed`, `released`, `expired`, `rejected`. Outcomes: `created`, `submitted`, `handover_pending`, `failed`.

Modification is blocked after confirmed, cancelled or expired status. Confirmation requires a current price/quote snapshot, non-unavailable availability and all mandatory consent records.
