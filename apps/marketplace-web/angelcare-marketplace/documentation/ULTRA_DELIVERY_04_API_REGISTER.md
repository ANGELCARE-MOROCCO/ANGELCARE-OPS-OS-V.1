# API Register

Protected API families exist under `/api/angelcare-marketplace/academy`, `/providers`, and `/operations`. Thin route adapters delegate to server handlers. Mutations resolve actor and permission, validate payloads, call repositories/RPCs, return the Marketplace response envelope and write audit evidence.
