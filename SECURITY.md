# Security policy

Report vulnerabilities privately to the repository owner. Do not include production payloads, tokens, credentials, supplier terms, telemetry, or semiconductor quality evidence in an issue.

## Required controls

- Keep `.env` files untracked and use a managed secret store in deployment. Rotate any real value that was ever shared or committed. Repository history checks currently show no tracked `.env` file; this does not prove externally copied values are safe.
- Use a random JWT secret of at least 32 characters, explicit production CORS origins, TLS at the ingress, short-lived tokens, and least-privilege roles.
- Give source adapters the `integration` role, planners `planner`, inspectors/reviewers `quality`, and reserve `admin` for provisioning and change-order approval.
- Restrict the database role, encrypt backups, set retention for source/quality records, and audit privileged access.
- Do not send BOM, supplier, quality, telemetry, or work-order data to an LLM. AI/demo routes are absent, and startup fails if `ENABLE_AI` or `ENABLE_DEMO_ROUTES` is true.
- Preserve input size limits and source bindings. Treat event payload strings as untrusted data; they are evidence, never instructions.

The service cannot rotate credentials on behalf of an operator. Production rollout remains blocked until owners verify and rotate deployed database/JWT credentials and complete their privacy, retention, access-control, and disaster-recovery reviews.
