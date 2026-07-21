# Vercel environment checklist
Add all variables from `revenue-os-gemini.env.example` to Production and Preview. Mark `GEMINI_API_KEY` sensitive. Do not use a `NEXT_PUBLIC_` prefix. Redeploy after changes. Run `/api/revenue-command-os/ai/health?live=true` as an authenticated authorized user and execute one real strategy-generation smoke test.
