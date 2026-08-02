# Permission matrix

| Permission | View | Manage | Sensitive |
|---|---:|---:|---:|
| marketplace.conversion.view | ✓ |  | No |
| marketplace.conversion.manage |  | ✓ | Yes |
| marketplace.conversion.recover |  | ✓ | Yes |
| marketplace.conversion.configuration.manage |  | ✓ | Yes |
| marketplace.conversion.analytics.view | ✓ |  | No |
| marketplace.conversion.export |  | ✓ | Yes |

Admin APIs resolve server context and enforce permissions. Public sessions are isolated by a hashed visitor reference plus an unguessable session key.
