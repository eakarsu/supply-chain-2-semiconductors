const db = require('../../db');
const service = require('../../src/workflowService');

let user;
let planId; let lotId; let workOrderId; let exceptionId;
const now = () => new Date().toISOString();
const event = (sourceSystem, sourceRecordId, eventType, payload, sourceTimestamp = now()) => service.ingest({ sourceSystem, sourceRecordId, eventType, sourceTimestamp, payload });

beforeAll(async () => {
  await db.query(`TRUNCATE sc_state_transitions,sc_reservations,sc_human_overrides,sc_plan_lines,sc_plans,sc_change_orders,sc_approvals,sc_exceptions,sc_telemetry_readings,sc_work_orders,sc_inspections,sc_lots,sc_bom_lines,sc_bom_revisions,sc_supplier_parts,sc_suppliers,sc_parts,sc_source_events,users RESTART IDENTITY CASCADE`);
  user = (await db.query(`INSERT INTO users (email,password_hash,name,role) VALUES ('integration@test.invalid','unused','Integration','admin') ON CONFLICT (email) DO UPDATE SET role='admin' RETURNING id,role`)).rows[0];
});
afterAll(() => db.end());

test('ingests all authoritative master and demand domains', async () => {
  await event('plm', 'part-assembly-1', 'PART_UPSERT', { partNumber: 'ASSEMBLY-1', description: 'Controller assembly', baseUnit: 'EA', safetyStock: 0 });
  await event('plm', 'part-chip-1', 'PART_UPSERT', { partNumber: 'CHIP-1', description: 'Qualified controller die', baseUnit: 'EA', safetyStock: 10 });
  await event('mdm', 'supplier-1', 'SUPPLIER_UPSERT', { externalSupplierKey: 'SUP-1', name: 'Qualified Semiconductor Supplier', country: 'US', qualificationState: 'APPROVED', parts: [{ partNumber: 'CHIP-1', approved: true, leadTimeDays: 14 }] });
  await event('plm', 'bom-1', 'BOM_REVISION_UPSERT', { assemblyPartNumber: 'ASSEMBLY-1', revision: 'A', state: 'APPROVED', effectiveAt: '2026-01-01T00:00:00Z', lines: [{ componentPartNumber: 'CHIP-1', quantityPer: 1, unit: 'EA' }] });
  const wo = await event('erp', 'wo-1', 'WORK_ORDER_UPSERT', { workOrderCode: 'WO-1', assemblyPartNumber: 'ASSEMBLY-1', quantity: 80, unit: 'EA', dueAt: '2026-08-01T00:00:00Z', priority: 2 }); workOrderId = wo.result.entityId;
  await event('schedule', 'schedule-1', 'SCHEDULE_COMMIT', { workOrderCode: 'WO-1', dueAt: '2026-07-30T00:00:00Z', priority: 1 });
  const receipt = await event('erp', 'lot-1', 'INVENTORY_RECEIPT', { lotCode: 'LOT-1', partNumber: 'CHIP-1', externalSupplierKey: 'SUP-1', quantity: 100, unit: 'EA', receivedAt: '2026-07-18T00:00:00Z' }); lotId = receipt.result.entityId;
  await event('qms', 'inspection-pass-1', 'QUALITY_INSPECTION', { inspectionCode: 'INSP-PASS-1', lotCode: 'LOT-1', result: 'PASSED', inspectedAt: now(), inspector: 'Quality Station 1', measurements: { defectRate: 0.001 }, specification: { maxDefectRate: 0.01 } });
  const dashboard = await service.dashboard(); expect(dashboard.counts).toMatchObject({ parts: 2, suppliers: 1, lots: 1, work_orders: 1 });
});

test('replays identical source events and rejects conflicting duplicates', async () => {
  const payload = { assetKey: 'FAB-1', metric: 'temperature', value: 20, unit: 'C' }; const stamp = now();
  const first = await event('iot', 'telemetry-duplicate-1', 'TELEMETRY_READING', payload, stamp); const replay = await event('iot', 'telemetry-duplicate-1', 'TELEMETRY_READING', payload, stamp);
  expect(first.replayed).toBe(false); expect(replay.replayed).toBe(true);
  await expect(event('iot', 'telemetry-duplicate-1', 'TELEMETRY_READING', { ...payload, value: 21 }, stamp)).rejects.toMatchObject({ code: 'DUPLICATE_EVENT_CONFLICT', status: 409 });
});

test('persists unit-mismatch rejection without changing inventory', async () => {
  await expect(event('erp', 'lot-unit-bad-1', 'INVENTORY_RECEIPT', { lotCode: 'LOT-BAD', partNumber: 'CHIP-1', externalSupplierKey: 'SUP-1', quantity: 20, unit: 'KG' })).rejects.toMatchObject({ code: 'UNIT_MISMATCH' });
  const rejected = (await db.query(`SELECT status,error_code FROM sc_source_events WHERE source_record_id='lot-unit-bad-1'`)).rows[0];
  expect(rejected).toEqual({ status: 'REJECTED', error_code: 'UNIT_MISMATCH' });
  expect((await db.query(`SELECT count(*)::int count FROM sc_lots WHERE lot_code='LOT-BAD'`)).rows[0].count).toBe(0);
});

test('flags late telemetry as uncertainty requiring review', async () => {
  await event('iot', 'telemetry-late-1', 'TELEMETRY_READING', { assetKey: 'FAB-1', metric: 'pressure', value: 4, unit: 'bar' }, '2026-01-01T00:00:00Z');
  const exception = (await db.query(`SELECT * FROM sc_exceptions WHERE exception_type='LATE_TELEMETRY' ORDER BY created_at DESC LIMIT 1`)).rows[0];
  expect(exception.state).toBe('OPEN'); exceptionId = exception.id;
});

test('records an idempotent human exception decision', async () => {
  const body = { clientDecisionId: 'late-review-1', decision: 'APPROVE', rationale: 'Historical packet retained; not used for machine control' };
  expect((await service.decideException(user, exceptionId, body)).replayed).toBe(false);
  expect((await service.decideException(user, exceptionId, body)).replayed).toBe(true);
});

test('creates and approves a constraint-aware plan', async () => {
  const created = await service.createPlan(user, { planningKey: 'plan-before-disruption' }); planId = created.plan.id;
  expect(created.plan).toMatchObject({ status: 'DRAFT', policyVersion: 'fifo-safety-v1', hasShortage: false });
  expect(created.plan.lines.reduce((sum, line) => sum + line.allocatedQuantity, 0)).toBe(80);
  const approved = await service.approvePlan(user, planId, { clientDecisionId: 'approval-1', reason: 'Reviewed released lot and safety-stock policy', acceptShortage: false, excludePlanLineIds: [] });
  expect(approved.status).toBe('APPROVED');
  expect(Number((await db.query('SELECT quantity_reserved FROM sc_lots WHERE id=$1', [lotId])).rows[0].quantity_reserved)).toBe(80);
  expect((await service.createPlan(user, { planningKey: 'plan-before-disruption' })).replayed).toBe(true);
});

test('marks the approved plan for replan when supply is disrupted', async () => {
  await event('qms', 'inspection-fail-1', 'QUALITY_INSPECTION', { inspectionCode: 'INSP-FAIL-1', lotCode: 'LOT-1', result: 'FAILED', inspectedAt: now(), inspector: 'Quality Station 2', measurements: { defectRate: 0.2 }, specification: { maxDefectRate: 0.01 } });
  expect((await db.query('SELECT status FROM sc_plans WHERE id=$1', [planId])).rows[0].status).toBe('NEEDS_REPLAN');
});

test('rolls back reservations and safely replans the disrupted work order', async () => {
  const rolledBack = await service.rollbackPlan(user, planId, { reason: 'Lot quarantined after failed inspection' });
  expect(rolledBack.releasedReservations).toBe(1);
  expect(Number((await db.query('SELECT quantity_reserved FROM sc_lots WHERE id=$1', [lotId])).rows[0].quantity_reserved)).toBe(0);
  const replanned = await service.createPlan(user, { planningKey: 'plan-after-disruption' }); expect(replanned.plan.hasShortage).toBe(true);
  const accepted = await service.approvePlan(user, replanned.plan.id, { clientDecisionId: 'approval-shortage-1', reason: 'Production owner accepts block while replacement lot is sourced', acceptShortage: true, excludePlanLineIds: [] });
  expect(accepted.acceptedShortage).toBe(true);
  expect((await db.query('SELECT state FROM sc_work_orders WHERE id=$1', [workOrderId])).rows[0].state).toBe('BLOCKED');
});

test('reconciles missing and unexpected source records', async () => {
  const result = await service.reconcile({ sourceSystem: 'erp', domain: 'INVENTORY', sourceRecordIds: ['lot-1', 'lot-missing'], from: '2025-01-01T00:00:00Z', to: '2027-01-01T00:00:00Z' });
  expect(result.present).toContain('lot-1'); expect(result.missing).toEqual(['lot-missing']); expect(result.unexpected).toContain('lot-unit-bad-1');
});

test('applies and rolls back an approved change order', async () => {
  const change = await service.createChangeOrder(user, { changeOrderCode: 'CO-1', targetType: 'WORK_ORDER', targetId: workOrderId, proposedChanges: { quantity: 75, priority: 2 }, rationale: 'Approved demand correction' });
  await service.decideChangeOrder(user, change.id, { decision: 'APPROVE', reason: 'Demand evidence verified' }); await service.applyChangeOrder(user, change.id);
  expect(Number((await db.query('SELECT quantity FROM sc_work_orders WHERE id=$1', [workOrderId])).rows[0].quantity)).toBe(75);
  await service.rollbackChangeOrder(user, change.id, { reason: 'Customer restored prior demand' });
  expect(Number((await db.query('SELECT quantity FROM sc_work_orders WHERE id=$1', [workOrderId])).rows[0].quantity)).toBe(80);
});

test('retains ordered lot, inspection, exception, approval, plan and change transitions', async () => {
  expect((await service.transitions('LOT', lotId)).map(item => item.to_state)).toEqual(['RECEIVED', 'RELEASED', 'QUARANTINED']);
  expect((await db.query(`SELECT count(*)::int count FROM sc_state_transitions WHERE entity_type IN ('INSPECTION','EXCEPTION','PLAN','CHANGE_ORDER')`)).rows[0].count).toBeGreaterThanOrEqual(10);
});

test('enforces append-only evidence at the database boundary', async () => {
  await expect(db.query(`UPDATE sc_inspections SET inspector='tampered' WHERE inspection_code='INSP-PASS-1'`)).rejects.toThrow(/append-only/);
  await expect(db.query(`DELETE FROM sc_state_transitions WHERE entity_type='LOT' AND entity_id=$1`, [lotId])).rejects.toThrow(/append-only/);
});
