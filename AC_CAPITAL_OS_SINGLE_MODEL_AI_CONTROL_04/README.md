# AC CAPITAL OS — Single Model AI Control 04

This patch locks AC CAPITAL OS to one model only: `gemini-2.5-flash`.

It does not mix models and does not add a fallback model.

## Runtime changes

- Capital Radar Google Search grounding uses `gemini-2.5-flash`.
- AC Capital report composition uses the same `gemini-2.5-flash` model.
- Radar writes a real provider execution log for every running/completed/failed live request.
- AI Provider Control gains a dedicated `AC Capital AI` tab.
- The tab shows assignment, credential, model, routing, provider-declared quota, internal quota, governed requests, provider errors and Radar execution logs.
- A single button applies the complete AC Capital model profile to the database through the existing authenticated AI Provider Control backend.
- Internal source/opportunity/report-draft writes remain enabled.
- External communication, submission and publication remain locked.

## Install

From `/Users/user/Desktop/angelcare-platform`:

```bash
node ./AC_CAPITAL_OS_SINGLE_MODEL_AI_CONTROL_04/scripts/apply_ac_capital_single_model_ai_control_04.mjs
```

The installer only copies files and creates a backup. It does not run TypeScript, a build, SQL, Git, or deployment.

## Activate through the product

1. Restart `npm run dev` from `apps/ops-web`.
2. Open `/ai-provider-control`.
3. Open the `AC Capital AI` tab.
4. Click `Appliquer et activer le profil unique` once.
5. Confirm the profile shows `ALIGNÉ`.
6. Return to AC Capital Radar and run one live grounded scan.
