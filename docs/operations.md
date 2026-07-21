# Operations and recovery

## Deployment order

1. Back up PostgreSQL and confirm recovery objectives.
2. Run `npm run migrate` as a one-shot release job.
3. Start the API and require `/api/ready` before routing traffic.
4. Start the static UI.
5. Verify each configured source appears in the control tower and reconcile a bounded window.

Migration execution is separate from application startup. Migrations use a PostgreSQL advisory lock and a transaction. `npm run migrate:down` rolls back only the latest migration; run it only after stopping writers and confirming no traceability data must be retained.

## Supply disruption

A failed inspection quarantines its lot, opens a critical exception, and marks any approved plan reserving the lot `NEEDS_REPLAN`. A planner must:

1. inspect the lot, inspection, exception, and transition evidence;
2. roll back the affected plan, releasing active reservations and restoring prior work-order states;
3. ingest replacement inventory/quality evidence or accept a documented shortage;
4. generate a new plan with a new planning key and approve it.

Never edit quantities or states directly. Work-order attribute changes use approved change orders and include a rollback snapshot.

## Alerts

Alert on readiness failure, rejected source events, source freshness over policy, open critical exceptions, `NEEDS_REPLAN` plans, repeated duplicate conflicts, login rate limits, and database capacity. Logs intentionally omit payloads, tokens, passwords, and raw internal errors.

## Backup/restore acceptance

Restore exercises must prove source events, inspections, approvals, plan lines, and transitions remain append-only; reservations agree with lot reserved quantities; the latest source record window reconciles; and a previously approved plan can be inspected and rolled back.
