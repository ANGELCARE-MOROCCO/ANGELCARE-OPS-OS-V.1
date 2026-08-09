# Migration review

- Forward migration bytes: 34174965
- Forward migration SHA-256: `c36fa1cb1a66eb0d0e49e80018146a8b578ffeac477d3c0b323c94142b216d72`
- Transaction wrapper: present
- Additive tables: 3
- Operational security-invoker view: present
- Immutable command-version conflicts: `DO NOTHING`
- Trigger, schedule and graph columns: aligned with MZ05 schema
- RLS: enabled on new tables
- Client access: revoked
- Service-role access: granted
- Forward `DROP TABLE`: none
- Automatic application by installer: prohibited
- Rollback: removes only MZ07 resources and restores MZ06 release identity
