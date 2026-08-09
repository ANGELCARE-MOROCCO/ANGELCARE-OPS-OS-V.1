# Safe rollback

Rollback file: `20260802090000_angelcare_marketplace_conversion_universe_SAFE_ROLLBACK.sql`.

It disables the feature/module, pauses conversion policies and releases active holds. It intentionally preserves all sessions, consent evidence, snapshots, outcomes and event history. It does not drop or truncate data.
