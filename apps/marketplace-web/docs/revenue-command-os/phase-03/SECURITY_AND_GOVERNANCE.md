# Security and governance

- Least privilege: `revenue_os.knowledge.manage` and `revenue_os.knowledge.approve` are separate authorities.
- Server boundary: Supabase access is located in a `server-only` repository.
- Data exposure: RLS is enabled and direct `anon`/`authenticated` table privileges are revoked.
- Audit: every mutation, approval, conflict resolution, index request and validation run creates an audit event.
- Version integrity: doctrine snapshots carry hashes and human provenance.
- AI safety: future models may retrieve only effective/approved, scope-compatible and non-conflicted knowledge.
- Phase boundary: no OpenAI invocation and no external communication are included in MZ03.
- Rollback: application files and database objects can be reversed separately.
