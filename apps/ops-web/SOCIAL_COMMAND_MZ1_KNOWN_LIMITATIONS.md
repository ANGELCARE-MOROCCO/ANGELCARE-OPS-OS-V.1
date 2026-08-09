# MZ1 Known Limitations — Explicit, Non-Hidden

- Facebook Page Story publishing is not claimed by the verified MZ1 adapter. Story UI prevents silently pretending it is supported. Instagram Story remains supported when the connected Instagram account/provider permits it.
- ENGAGE and AUTOMATE are architecturally reserved but intentionally not implemented until MZ2; there are no fake inbox/webhook/AI results in MZ1.
- Historical engagement-based “best time” recommendations are MZ2. MZ1 cadence/time strategies are clearly operator templates, not fabricated analytics.
- MZ1 media gateway does not manufacture image/video thumbnails with a heavyweight imaging dependency. Browser previews use signed delivery URLs; a dedicated thumbnail processor can be added without changing storage ownership.
