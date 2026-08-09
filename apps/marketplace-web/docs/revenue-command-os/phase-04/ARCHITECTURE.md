# Architecture

```text
AngelCare source tables / internal events
  -> allow-listed source adapter
  -> payload minimization + secret redaction
  -> append-only raw event
  -> SHA-256 deduplication
  -> deterministic classification
  -> normalized revenue signal
  -> source health + freshness
  -> Digital Twin + effective doctrine retrieval
  -> permission-filtered context snapshot
  -> internal subscription / future command eligibility
```

The model is never given database credentials or a generic SQL tool. Source adapters are code-owned, table allow-listed and server-only. MZ04 performs no OpenAI request and no external action.
