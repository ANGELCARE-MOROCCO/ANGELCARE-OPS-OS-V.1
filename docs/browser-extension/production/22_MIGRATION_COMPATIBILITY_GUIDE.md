# Migration and Schema Compatibility Guide

Apply migrations in chronological order through Mega ZIP 7. Record checksum, schema version, preflight, postflight and rollback rehearsal. Extension 0.7.0 requires Gateway 0.7.0 and schema `mega7`. Do not promote stable when schema drift, RLS failure or missing indexes remain unresolved.
