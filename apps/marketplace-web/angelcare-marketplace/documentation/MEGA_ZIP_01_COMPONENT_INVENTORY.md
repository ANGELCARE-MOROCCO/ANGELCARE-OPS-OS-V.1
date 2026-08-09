# Mega ZIP 01 — Component Inventory

## Shells

- `PublicShell`: brand header, public navigation, locale readiness and footer.
- `WorkspaceShell`: authenticated identity, role-aware navigation and scope indicators.
- `AdminShell`: secure command navigation, identity, permission count and governed content area.
- `AdminNavigation`: active-route aware control-plane navigation.

## Foundation primitives

- `Button`, `ButtonLink`
- `PageHeader`
- `Card`
- `MetricCard`
- `StatusChip`
- `StatePanel`
- `FoundationUnavailable`
- input, select, textarea and helper/error patterns
- table and row-action patterns
- modal confirmation pattern
- notice patterns
- progress bar
- loading skeleton
- scope and identity badges

## Purpose-built feature components

- `PublicHome`
- `WorkspaceHome`
- `AccountAccess`
- `FoundationCockpit`
- `ModuleRegistryClient`
- `FeatureFlagsClient`
- `ConfigurationClient`
- `AuditViewerClient`
- `ReadinessClient`
- `FoundationGallery`

The primitives share tokens and state law, while feature screens retain different operational purposes and hierarchy.
