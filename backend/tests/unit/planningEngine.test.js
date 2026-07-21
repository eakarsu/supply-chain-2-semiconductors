const { buildPlan } = require('../../src/planningEngine');

const part = { id: 'component', part_number: 'CHIP-A', base_unit: 'EA', safety_stock: 10 };
const workOrder = (id, priority, quantity = 50) => ({ id, work_order_code: id, quantity, priority, due_at: '2026-08-01T00:00:00Z' });
const requirement = id => ({ work_order_id: id, component_part_id: 'component', part_number: 'CHIP-A', quantity_per: 1, unit: 'EA' });
const lot = (id, code, qty, receivedAt = '2026-07-01T00:00:00Z') => ({ id, lot_code: code, part_id: 'component', quantity_received: qty, quantity_reserved: 0, quantity_consumed: 0, unit: 'EA', state: 'RELEASED', received_at: receivedAt });

test('allocates released lots FIFO while preserving safety stock', () => {
  const result = buildPlan({ workOrders: [workOrder('WO-1', 1, 120)], requirements: [requirement('WO-1')], parts: [part], lots: [lot('L2', 'LOT-2', 60, '2026-07-02T00:00:00Z'), lot('L1', 'LOT-1', 60)] });
  expect(result.lines.map(line => [line.lotId, line.allocatedQuantity, line.shortageQuantity])).toEqual([['L1', 60, 0], ['L2', 50, 0], [null, 0, 10]]);
  expect(result.hasShortage).toBe(true);
});

test('allocates higher-priority work orders first', () => {
  const result = buildPlan({ workOrders: [workOrder('LOW', 9, 70), workOrder('HIGH', 1, 70)], requirements: [requirement('LOW'), requirement('HIGH')], parts: [part], lots: [lot('L1', 'LOT-1', 100)] });
  expect(result.lines.find(line => line.workOrderId === 'HIGH' && line.lotId)?.allocatedQuantity).toBe(70);
  expect(result.lines.find(line => line.workOrderId === 'LOW' && line.lotId)?.allocatedQuantity).toBe(20);
});

test('never allocates quarantined inventory', () => {
  const quarantined = { ...lot('L1', 'LOT-1', 100), state: 'QUARANTINED' };
  const result = buildPlan({ workOrders: [workOrder('WO-1', 1, 5)], requirements: [requirement('WO-1')], parts: [part], lots: [quarantined] });
  expect(result.lines).toHaveLength(1); expect(result.lines[0].shortageQuantity).toBe(5);
});

test('rejects a BOM unit mismatch deterministically', () => {
  expect(() => buildPlan({ workOrders: [workOrder('WO-1', 1)], requirements: [{ ...requirement('WO-1'), unit: 'KG' }], parts: [part], lots: [] })).toThrow(/does not match/);
});

test('reports a missing approved BOM', () => {
  expect(() => buildPlan({ workOrders: [workOrder('WO-1', 1)], requirements: [], parts: [part], lots: [] })).toThrow(/No effective approved BOM/);
});
