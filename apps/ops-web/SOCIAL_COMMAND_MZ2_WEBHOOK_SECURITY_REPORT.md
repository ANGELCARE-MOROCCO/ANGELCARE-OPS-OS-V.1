# Social Command MZ2 — Webhook Security

- Verification challenge is handled before authenticated application routing because Meta calls the endpoint externally.
- Incoming POST bodies are read raw before JSON parsing.
- `X-Hub-Signature-256` is verified with HMAC SHA-256 and the existing Meta App Secret.
- Invalid signatures are rejected and recorded without reflecting secrets.
- Provider deliveries are deduplicated by stable payload key before domain normalization.
- Raw events and normalized domain entities are separate evidence layers.
- Normal browser users never receive App Secret or encrypted provider tokens.
