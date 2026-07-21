# Rollback Procedure

Activate a release or capability kill switch, preserve evidence, change pilot/stable channel to the last known-good version, revoke known-bad versions, validate device adoption, then apply database rollback only when the schema change itself must be removed. Confirm commands are denied for revoked devices and audit the rollback.
