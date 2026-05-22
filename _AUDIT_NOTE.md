# SemiChain Supply — Audit Note

## Status
Working. Login: `admin@demo.com / demo123`. Backend port 3015, frontend 5175, DB `semicon_supply_db`.

## 2026-05-07 — Feature add (apply3)
Added 8 new features (5 AI + 3 utility), fully wired backend + frontend.

### 5 New AI features (under /api/ai/*)
- `POST /foundry-allocator` — Foundry capacity / wafer-start optimizer
- `POST /lead-time-forecast` — Lead-time forecaster across scenarios
- `POST /geopolitical-analyzer` — Geopolitical disruption cascade analyzer
- `POST /yield-loss-predictor` — D0-based yield loss + capacity impact
- `POST /export-compliance` — EAR/FDPR/Entity-List compliance flagger

All AI routes use Bearer JWT and emit HTTP 503 with `{error}` when the AI provider is unset / unreachable / non-2xx (`callAI()` throws AI_UNAVAILABLE; `aiError()` maps to 503).

### 3 New utility features
- `GET /api/export/:entity` — CSV export for suppliers/components/allocations/risk-alerts/fabs/intelligence/audit-log; logs to audit_log
- `GET /api/search` — Cross-entity search & filter (q, types, country, tier, status, severity, criticality)
- `GET|POST /api/audit-log` — Filterable audit trail (q, entity_type, action, user_email)

### Schema change
New table `audit_log(id, user_email, action, entity_type, entity_id, details, ip_address, created_at)` + 2 indexes — already migrated in dev DB.

### Frontend
- `pages/ExportPage.tsx`, `pages/SearchPage.tsx`, `pages/AuditLogPage.tsx`
- `components/AICenter.tsx` extended with 5 new tabs (Foundry, Lead-Time, Geo, Yield, Export Compliance) and 503 error surface
- `api.ts` extended with new AI methods, `auditLog`, `exportCsv`, `search`, `apiDownload`
- Nav links added in `Layout.tsx`: Search, Export, Audit Log

### Verification
- `node --check` passes on all modified/new backend files
- Module-load shim test: `server.js loads OK`
- No new TypeScript errors (pre-existing module-resolution + Layout TS7031 only)

### Untouched
- All existing CRUD routes (suppliers, components, allocations, risk_alerts, fabs, intelligence) and their pages
- Original 4 AI endpoints unchanged
- Existing schema tables intact

### Log
`/Users/erolakarsu/projects/_AUDIT/apply3_logs/feature_add_supply-chain-2-semiconductors.md`

## 2026-05-07 — Sample Data page (apply3)
Added a Sample Data admin page that seeds each main entity with 5-10 domain-realistic rows.

### Backend
- New `backend/routes/sample_data.js` mounted at `/api/admin` in `server.js`
- `POST /api/admin/sample-data/:entity` (JWT, allowlist: suppliers, components, allocations, risk-alerts, fabs, intelligence) → `{inserted, entity}`
- Allocations auto-bind to first existing `components.id` (FK); 409 if components empty
- Domain content: TSMC/Samsung/Intel/GlobalFoundries/UMC/SMIC/ASML, Apple/NVIDIA/AMD/Qualcomm/MediaTek, 2nm/3nm/4nm/7nm wafer-starts, HBM3e/HBM4, CoWoS-L/SoIC-X, real fabs (Hsinchu, Phoenix, Pyeongtaek, Magdeburg, Malta, Kumamoto, Veldhoven)

### Frontend
- New `pages/SampleDataPage.tsx` — one button per entity, JWT bearer, per-entity insert counter, success/error toast
- Route `/sample-data` wired in `App.tsx`; sidebar entry "Sample Data" added in `Layout.tsx`

### Verification
- `node --check` passes on `sample_data.js` and `server.js`
- `tsc --noEmit` adds no new TS errors (only pre-existing lucide-react / react-router-dom module-resolution errors)
- Smoke-tested against running backend on port 3015 with `admin@demo.com / demo123`: all 6 entities returned 200 with realistic insert counts (47 rows total); 401 without token; 400 on unknown entity. Test rows cleaned up — DB restored to seed counts.

### Untouched
All existing routes, pages, and schema. Only `server.js`, `App.tsx`, `Layout.tsx` modified (single-line additions).

### Log
`/Users/erolakarsu/projects/_AUDIT/apply3_logs/sample_data_supply-chain-2-semiconductors.md`

## 2026-05-07 — Sample-prefill buttons on AI pages (apply3)
Added 2-3 sample-prefill buttons to every input-driven AI feature in `AICenter.tsx`.

### Approach
All AI features (`POST /api/ai/*`) live in one shared component (`frontend/src/components/AICenter.tsx`, 9 tabs). Added a single `<SamplesBar/>` helper + 8 named sample arrays, inserted into the 8 input-driven tabs. The Resilience tab takes no user inputs (synthesized from live snapshot), so no samples apply.

### Coverage (24 buttons / 8 tabs, 3 each)
Risk Assessment, Allocation Optimization, Market Forecast, Foundry Allocator, Lead-Time Forecast, Geopolitical Analyzer, Yield-Loss Predictor, Export Compliance.

Real-world content: TSMC/Samsung/Intel/SMIC/GlobalFoundries/UMC, Apple/NVIDIA/AMD/Qualcomm/MediaTek/Google/Tesla/AWS, N2/N3E/SF2/18A, Hsinchu Fab 18 / Phoenix / Pyeongtaek S5 / Arizona Fab 52 / Magdeburg / Kumamoto, CoWoS-L / SoIC-X / HBM3e 8-Hi, BIS FDPR / Entity List / ECCN 3A090 / OFAC.

### Verification
- esbuild parse on `AICenter.tsx`: OK
- `tsc --noEmit` on the modified file: no new errors (only pre-existing module-resolution warnings already noted above)
- `node --check backend/server.js`: OK (untouched)
- 8 `SamplesBar` insertions confirmed via grep
- Build artifact `frontend/dist/` cleaned up

### Untouched
All form submission handlers, state setters, API client (`api.ts`), backend routes, and all other pages/components. Only `frontend/src/components/AICenter.tsx` was modified.

### Log
`/Users/erolakarsu/projects/_AUDIT/apply3_logs/samples_supply-chain-2-semiconductors.md`

## 2026-05-07 — Dashboard page (apply3)
Added a domain-appropriate Dashboard as first sidebar item and post-login landing.

### Backend
- New `backend/routes/dashboard.js` mounted at `/api/dashboard` in `server.js`
- `GET /api/dashboard/stats` (JWT) → `{ kpis: { foundries_tracked, components, allocations_active, fabs, risk_alerts_open }, recent_activity: [audit_log top 10] }`

### Frontend
- New `pages/Dashboard.tsx`: 5 KPI cards, Recent Activity from `audit_log`, Quick Actions (AI Center, Suppliers, Allocations, Sample Data)
- `Layout.tsx`: prepended `{ to:'/dashboard', icon: LayoutDashboard, label:'Dashboard' }` as first nav item
- `App.tsx`: `<Route path="dashboard">` added; index redirect now `/dashboard` (was `/suppliers`)

### Verification
- `node --check` passes on `dashboard.js` and `server.js`
- `tsc --noEmit` adds no new TS errors (pre-existing module-resolution warnings only)
- Smoke test on port 3015 with `admin@demo.com / demo123`: 401 without bearer, 200 with bearer; payload `{foundries_tracked:12, components:15, allocations_active:15, fabs:10, risk_alerts_open:6}`. Backend stopped, port freed.

### Untouched
All existing routes, pages, components, schema, and `api.ts`. Only `server.js`, `Layout.tsx`, `App.tsx` modified (additive changes).

### Log
`/Users/erolakarsu/projects/_AUDIT/apply3_logs/dashboard_supply-chain-2-semiconductors.md`

## Apply pass 7 (full backlog implementation)

### Unaddressed backlog identified
The 16 gap/cf feature pages under `frontend/src/pages/{Gap*,Cf*}.tsx` existed on disk and had backend routes mounted in `server.js` (`/api/gap-*`, `/api/cf-*`), but were **invisible to users** — neither routed in `App.tsx` nor linked from `Layout.tsx`. Wired them all up.

### Items implemented (16)
Gap features (11):
- `/gap/cowos-tracker` → GapCowosTracker (POST /api/gap-ai-cowos-tracker)
- `/gap/hbm-booking-monitor` → GapHbmBookingMonitor
- `/gap/ear-eccn-classifier` → GapEarEccnClassifier
- `/gap/tier-n-discovery` → GapTierNDiscovery
- `/gap/wafer-yield-ml` → GapWaferYieldMl
- `/gap/edi-sap-connector` → GapEdiSapConnector
- `/gap/realtime-allocation` → GapRealtimeAllocation
- `/gap/hts-eccn-lookup` → GapHtsEccnLookup
- `/gap/factory-weather-feed` → GapFactoryWeatherFeed
- `/gap/po-generation` → GapPoGeneration
- `/gap/multiparty-dataroom` → GapMultipartyDataroom

Custom (cf) features (5):
- `/cf/tier-n-graph`, `/cf/cowos-calendar`, `/cf/eccn-live-update`, `/cf/disaster-risk-overlay`, `/cf/auto-reshuffle-agent`

### Frontend changes
- `App.tsx`: 16 imports added; 16 child routes added under the existing private Layout route (still BEFORE the catch-all on the Login route).
- `Layout.tsx`: added two collapsible `<details>` nav groups ("Gap Features", "Custom Features") under the AI Center link, each rendered from a typed `gapNavItems` / `cfNavItems` array with `lucide-react` icons (Cloud, FileText, Activity, Globe, Workflow, Truck, Radar, CalendarClock, GitBranch, FlaskConical, Map, Bot, Layers, MemoryStick, ShieldCheck, Network) — all confirmed present in installed `lucide-react`.

### Backend / DB
- No backend file modified; all `/api/gap-*` and `/api/cf-*` mounts already exist in `server.js` BEFORE the `/api` 404 handler.
- No schema migration needed; tables (`packaging_capacity`, `packaging_bookings`, `audit_log`, etc.) already exist with `CREATE TABLE IF NOT EXISTS`.

### Verification
- esbuild parse: `App.tsx OK`, `Layout.tsx OK` (stdin loader=tsx).
- No `node --check` needed — no `.js` files modified this pass.
- No new npm deps; no breaking changes; no existing route/page touched.

### Untouched
All existing backend routes, all 16 Gap*/Cf* page bodies (per "don't modify feature pages" memory), schema, seed, `api.ts`, AICenter, and all previously-wired pages.

### Skipped per spec
- AI route fallbacks (NEEDS-CREDS) — already correctly emit 503 via `aiError()`.
- Server.js mount-order reshuffle (mounts appear after `app.listen` but work correctly in Node) — TOO-RISKY ordering change, advisory only.

### Status
PASS — all 16 previously-orphaned pages are now reachable from the sidebar and routable under `/gap/*` and `/cf/*`.
