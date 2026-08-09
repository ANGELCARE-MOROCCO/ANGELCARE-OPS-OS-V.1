# Backend binding matrix

| Visible signal/action | Authority |
|---|---|
| Catalog item | Catalog Discovery view |
| Price | Active Finance price rule/book; catalog fallback only when published; otherwise quote-required |
| Basket total | Recalculated from every line; mixed quote baskets remain quote-required |
| Availability | Catalog availability, Academy cohort capacity, inventory or manual qualification |
| Cohort seat | Academy cohort capacity minus enrolled count |
| Family booking request | Existing Family quote request, when canonical family identity exists |
| Academy enrollment | Existing Academy enrollment, only with canonical learner identity and cohort |
| Partner request | Existing Partner subscription only with canonical tenant and plan |
| B2B/Quality/Product fallback | Existing CRM lead handover |
| Consent | Versioned conversion consent table |
| Audit/recovery | Marketplace audit writer and event trail |

| Territory selector | Territory OS live/soft-launch records linked to published item availability |
