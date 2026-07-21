# SemiChain traceability control tower

SemiChain implements one supported operational workflow: **receive a semiconductor lot → inspect it → review exceptions → allocate released inventory to work orders → rollback and replan after disruption**.

It is intentionally not an AI recommendation demo. Allocation is deterministic, source data is traceable and idempotent, safety stock and units are hard constraints, and human decisions include a rationale and immutable transition history.

## Authoritative inputs

Seven domains enter through `POST /api/traceability/events`: BOM, supplier, inventory, quality, schedule, telemetry, and work order. `AUTHORITATIVE_SOURCE_BINDINGS` controls which named system may write each domain. Source adapters must send a stable `sourceRecordId`, source timestamp, typed event, and payload. See [docs/source-contract.md](docs/source-contract.md).

The API persists rejected events as evidence, rejects conflicting replays, accepts exact replays idempotently, and exposes bounded reconciliation. It does not poll an ERP implicitly or pretend a mock response is authoritative.

## Run locally

Prerequisites: Node 20+, PostgreSQL 16+, and npm.

1. Copy `.env.example` to `.env`, replace every secret/default, and create the configured empty database.
2. Run `cd backend && npm ci && npm run migrate`.
3. Provision an account without putting its password on the command line:
   `SEMICHAIN_INITIAL_PASSWORD='<12+ character password>' npm run user:create -- admin@example.com admin 'Administrator'`.
4. Run `npm start` in `backend/`, then `npm ci && npm run dev -- --port 5175` in `frontend/`.

`./start.sh` validates configuration, installs with lockfiles, migrates explicitly, and starts both processes. It never creates or seeds a database, kills unrelated processes, copies secrets, or installs demo credentials.

For containers, supply the required secrets and run `docker compose up --build`. The migration job must succeed before the API starts.

## Planning policy

`fifo-safety-v1` sorts work orders by priority and due date, uses only an effective approved BOM, allocates quality-released lots FIFO, validates all base units, and protects part safety stock. Stale inputs and open exceptions appear as uncertainty. A shortage cannot be approved unless a planner explicitly accepts it with a reason. Lot disruption marks approved plans `NEEDS_REPLAN`; rollback releases reservations and restores prior work-order state.

## Verification

Run `npm test` in `backend/` against a migrated disposable test database, and `npm run build` in `frontend/`. CI additionally proves migration up/down/up, unit/integration/API tests, dependency audits, secret scanning, and container builds.

See [docs/operations.md](docs/operations.md) for failure recovery and [SECURITY.md](SECURITY.md) for secret and AI boundaries.
