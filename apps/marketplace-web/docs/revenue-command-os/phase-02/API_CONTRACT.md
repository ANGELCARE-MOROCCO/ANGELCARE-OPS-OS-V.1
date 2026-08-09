# Digital Twin API Contract

## Endpoint

`/api/revenue-command-os/digital-twin`

## GET

Returns the current `RevenueTwinBootstrap`, deterministic completeness, validation issues and non-fatal storage warnings. Requires Revenue OS view authority.

## POST actions

### `run_validation`

Recalculates model completeness and contradictions, persists a model version, and writes an audit event.

### `update_validation_status`

Allows `open`, `acknowledged`, `resolved`, or `waived` for an existing validation issue.

### `mutate_entity`

Accepts a governed mutation object:

```json
{
  "action": "mutate_entity",
  "input": {
    "entity": "offer",
    "operation": "create",
    "payload": {
      "code": "OFF-EXAMPLE",
      "name": "Example",
      "business_unit_code": "BU-ACADEMY"
    }
  }
}
```

Allowed operations are `create`, `update`, and `retire`. Allowed entities and fields are defined in the server repository. Arbitrary database operations are rejected.

## Explicitly unavailable

- external WhatsApp/email sending;
- strategy execution;
- pricing authorization;
- contract commitments;
- direct SQL;
- hard deletion;
- unrestricted table access.
