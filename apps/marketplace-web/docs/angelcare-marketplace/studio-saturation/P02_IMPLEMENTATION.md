# AngelCare Marketplace Studio — P02 Universal Picker Framework

## Result
P02 converts the P01 Universal Source Registry into one reusable, permission-aware, bounded resource-selection framework for Puck Studio fields.

### Runtime architecture
`Puck field → UniversalSourcePickerField → P01 protected source API → registered adapter → canonical Marketplace authority`

### Guarantees
- all 20 P01 sources are accounted for by the same framework;
- single and multi-select modes;
- searchable, browsable, hierarchical and media-grid modes;
- canonical persisted references: `sourceId + entityId`;
- existing scalar Media/Category/Collection values remain readable and migrate on next selection;
- current selections are validated against P01 and stale/deleted/unpublished/revoked references are explicit;
- cursor pagination, bounded requests, query debounce, request cancellation and stale-response sequencing;
- keyboard navigation, Escape, Tab focus trapping and visible focus;
- source-level permission and publication awareness inherited from P01;
- no raw database identifiers displayed as normal admin UX;
- admin deep-link bridge returns to existing canonical admin workspaces;
- no shadow tables, source copies, localStorage authority or business data duplication.

### Puck fields upgraded now
- Media Vault → `media.assets`
- Category → `catalog.categories`
- Collection → `homepage.collections`

The picker engine itself is generic across all 20 sources and is reusable by P03–P13 without another resource selector architecture.

## Explicit boundaries
P02 does not execute customer actions, assign templates, implement live business-field bindings, create conversion workflows or change public business authorities. Those remain P03+.

`SQL=NO · MIGRATION=NO · DATABASE_CHANGE=NO · LOCAL_BUILD=NO · GLOBAL_TYPESCRIPT=NO · P03_ACTIONS=NO`
