# Architecture MZ12

`Strategy Studio UI → authenticated API → authority/state-machine service → versioned strategy/council repositories → approval and memo persistence → immutable audit`.

The studio reads MZ10/MZ10.1 strategy records and MZ11 Council records. It writes only executive review, approval, condition, amendment, combination, memo, archive, reopening and audit records.
