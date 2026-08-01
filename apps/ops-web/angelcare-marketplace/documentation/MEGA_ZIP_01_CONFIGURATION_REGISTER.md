# Mega ZIP 01 — Configuration Register

| Key | Category | Editable | Sensitive | Purpose |
|---|---|---:|---:|---|
| `marketplace.default_locale` | Localization | Yes | No | Default FR locale. |
| `marketplace.supported_locales` | Localization | No | No | FR/EN/AR foundation. |
| `marketplace.route_prefix` | Architecture | No | No | Enforced product boundary. |
| `marketplace.audit_enabled` | Security | No | No | Audit obligation indicator. |
| `marketplace.release_version` | Release | No | No | Mega ZIP 01 release identity. |
| `marketplace.operator_support_note` | Support | Yes | No | Operator escalation guidance. |
| `marketplace.server_secret_status` | Security | No | Yes | Redacted server-only status; no secret value. |

Runtime environment values remain outside code and are separated from editable business configuration.
