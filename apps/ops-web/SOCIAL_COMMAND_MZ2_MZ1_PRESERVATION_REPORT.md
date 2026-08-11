# Social Command MZ2 — MZ1 Preservation

The package intentionally does not replace:
- `BulkOrchestrator.tsx`
- `TemporalCommand.tsx`
- `ActionPulse.tsx`
- `SovereignModal.tsx`
- MZ1 Windows Media Gateway runtime
- MZ1 publishing adapter/state machine
- MZ1 Meta OAuth/token encryption service

Only the shared shell/client, shared CSS, API dispatcher and type contract are extended where MZ2 must mount its new canonical surfaces.
