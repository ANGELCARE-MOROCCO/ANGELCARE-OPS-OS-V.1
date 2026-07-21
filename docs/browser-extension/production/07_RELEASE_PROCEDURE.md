# Release Procedure

1. Freeze scope and assign version.
2. Verify 45/45 traceability.
3. Run TypeScript, production verifier, security verifier and extension build.
4. Scan secrets and package integrity.
5. Apply migration in controlled environment and run postflight.
6. Create release version and deployment gates.
7. Promote internal, then pilot with capped rollout.
8. Monitor health, failures, adapters and incidents.
9. Record stable-promotion decision.
