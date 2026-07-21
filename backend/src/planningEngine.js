const { DomainError } = require('./domain');

const round = value => Math.round((Number(value) + Number.EPSILON) * 1e6) / 1e6;
const available = lot => round(Number(lot.quantity_received) - Number(lot.quantity_reserved) - Number(lot.quantity_consumed));

/** Deterministic FIFO allocator. It never consumes safety stock and never accepts a unit mismatch. */
function buildPlan({ workOrders, requirements, parts, lots, uncertainty = [] }) {
  const partById = new Map(parts.map(part => [part.id, part]));
  const lotsByPart = new Map();
  for (const lot of lots) {
    if (lot.state !== 'RELEASED' || available(lot) <= 0) continue;
    const list = lotsByPart.get(lot.part_id) || [];
    list.push({ ...lot, remaining: available(lot) });
    lotsByPart.set(lot.part_id, list);
  }
  for (const list of lotsByPart.values()) list.sort((a, b) => new Date(a.received_at) - new Date(b.received_at) || a.lot_code.localeCompare(b.lot_code));

  const protectedRemaining = new Map(parts.map(part => [part.id, Number(part.safety_stock)]));
  const ordered = [...workOrders].sort((a, b) => Number(a.priority) - Number(b.priority)
    || new Date(a.due_at || '9999-12-31') - new Date(b.due_at || '9999-12-31')
    || a.work_order_code.localeCompare(b.work_order_code));
  const lines = [];

  for (const workOrder of ordered) {
    const workRequirements = requirements.filter(item => item.work_order_id === workOrder.id)
      .sort((a, b) => a.part_number.localeCompare(b.part_number));
    if (!workRequirements.length) throw new DomainError(409, 'APPROVED_BOM_REQUIRED', `No effective approved BOM exists for ${workOrder.work_order_code}`);
    for (const requirement of workRequirements) {
      const part = partById.get(requirement.component_part_id);
      if (!part) throw new DomainError(409, 'PART_NOT_FOUND', `Component ${requirement.component_part_id} is missing`);
      if (requirement.unit !== part.base_unit) throw new DomainError(409, 'UNIT_MISMATCH', `${part.part_number} BOM unit ${requirement.unit} does not match ${part.base_unit}`);
      let remaining = round(Number(workOrder.quantity) * Number(requirement.quantity_per));
      const partLots = lotsByPart.get(part.id) || [];
      for (const lot of partLots) {
        if (lot.unit !== part.base_unit) throw new DomainError(409, 'UNIT_MISMATCH', `${lot.lot_code} unit ${lot.unit} does not match ${part.base_unit}`);
      }
      const totalAvailable = round(partLots.reduce((sum, lot) => sum + lot.remaining, 0));
      const protectedQty = Math.min(totalAvailable, protectedRemaining.get(part.id) || 0);
      let allocatable = round(Math.max(0, totalAvailable - protectedQty));
      for (const lot of partLots) {
        if (remaining <= 0 || allocatable <= 0) break;
        const quantity = round(Math.min(remaining, lot.remaining, allocatable));
        if (quantity <= 0) continue;
        lines.push({
          workOrderId: workOrder.id, componentPartId: part.id, lotId: lot.id,
          requiredQuantity: quantity, allocatedQuantity: quantity, shortageQuantity: 0,
          unit: part.base_unit,
          rationale: `FIFO released lot; priority ${workOrder.priority}; ${part.safety_stock} ${part.base_unit} safety stock protected`,
          uncertainty: {},
        });
        lot.remaining = round(lot.remaining - quantity);
        allocatable = round(allocatable - quantity);
        remaining = round(remaining - quantity);
      }
      if (remaining > 0) lines.push({
        workOrderId: workOrder.id, componentPartId: part.id, lotId: null,
        requiredQuantity: remaining, allocatedQuantity: 0, shortageQuantity: remaining,
        unit: part.base_unit,
        rationale: `Insufficient released inventory after protecting ${part.safety_stock} ${part.base_unit} safety stock`,
        uncertainty: { inventoryConstraint: true },
      });
    }
  }
  return { lines, hasShortage: lines.some(line => line.shortageQuantity > 0), uncertainty };
}

module.exports = { available, buildPlan, round };
