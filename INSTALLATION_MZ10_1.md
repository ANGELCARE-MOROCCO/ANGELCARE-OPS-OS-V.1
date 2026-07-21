# Installation
Run `apply_revenue_os_mz10_1.sh <monorepo-root> <zip>`. The installer verifies MZ10, creates a timestamped backup, copies manifest-authorized files, checks `@google/genai`, runs static acceptance, and never applies SQL automatically. Apply SQL with `apply_revenue_os_mz10_1_database.sh` after setting `DATABASE_URL`.
