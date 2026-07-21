# Troubleshooting Handbook

- `EXTENSION_NOT_PAIRED`: pair again from ANGELCARE SaaS.
- `ACCESS_CHANGED`: refresh session after administrator changes.
- `DEVICE_REVOKED`: administrator must review the device.
- `PRODUCTION_KILL_SWITCH`: do not bypass; consult Incident Command.
- `KNOWN_BAD_EXTENSION_VERSION`: move device to rollback/stable channel.
- Adapter degraded: retry once, capture timestamp and adapter key, then disable adapter if selector failures repeat.
- Partial hydration: use successful sections, identify stale/failed sections and retry only the failed domain.
