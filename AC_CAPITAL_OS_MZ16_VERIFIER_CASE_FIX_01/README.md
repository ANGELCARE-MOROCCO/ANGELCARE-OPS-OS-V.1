# AC CAPITAL OS MZ16 — Verifier Case-Sensitivity Fix

The MZ16 source was installed correctly. The verifier stopped because it expected the exact text:

```text
Linked skills
```

while the installed AI Command page contains:

```text
linked skills.
```

That is a verifier false positive caused by capitalization only.

This patch changes only:

```text
AC_CAPITAL_OS_MZ16_FINAL_INSTITUTIONAL_COMMAND_EXPERIENCE/scripts/verify_ac_capital_os_mz16.mjs
```

It makes the AI hydration check case-insensitive. It does not alter any AC CAPITAL OS UI, API, SQL, Gemini integration, provider assignment, or business workflow.
