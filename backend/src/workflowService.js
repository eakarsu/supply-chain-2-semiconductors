const db = require('../db');
const { DomainError, checksum, id, integer, number, oneOf, text, timestamp, uuid } = require('./domain');
const runtime = require('./runtime');
const { buildPlan, round } = require('./planningEngine');

const DOMAIN_BY_EVENT = Object.freeze({
  PART_UPSERT: 'BOM', BOM_REVISION_UPSERT: 'BOM', SUPPLIER_UPSERT: 'SUPPLIER',
  INVENTORY_RECEIPT: 'INVENTORY', QUALITY_INSPECTION: 'QUALITY', SCHEDULE_COMMIT: 'SCHEDULE',
  TELEMETRY_READING: 'TELEMETRY', WORK_ORDER_UPSERT: 'WORK_ORDER',
});
const UNITS = ['EA', 'WAFER', 'DIE', 'TRAY', 'KG', 'L'];

const queryOne = async (client, sql, values, code, message) => {
  const row = (await client.query(sql, values)).rows[0];
  if (!row) throw new DomainError(409, code, message);
  return row;
};
const transition = (client, { entityType, entityId, fromState, toState, reason, actorUserId = null, sourceEventId = null, correlationId = null, version = 1 }) =>
  client.query(`INSERT INTO sc_state_transitions
    (id, entity_type, entity_id, from_state, to_state, reason, actor_user_id, source_event_id, correlation_id, entity_version)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
  [id(), entityType, entityId, fromState, toState, reason, actorUserId, sourceEventId, correlationId, version]);

function normalizeEnvelope(input) {
  const eventType = oneOf(input.eventType, 'eventType', Object.keys(DOMAIN_BY_EVENT));
  const domain = DOMAIN_BY_EVENT[eventType];
  const sourceSystem = text(input.sourceSystem, 'sourceSystem', 80);
  const sourceRecordId = text(input.sourceRecordId, 'sourceRecordId', 180);
  const sourceTimestamp = timestamp(input.sourceTimestamp, 'sourceTimestamp');
  if (sourceTimestamp.getTime() > Date.now() + runtime.maxSourceFutureSeconds() * 1000) {
    throw new DomainError(400, 'SOURCE_TIMESTAMP_IN_FUTURE', 'sourceTimestamp exceeds the configured clock-skew allowance');
  }
  if (!input.payload || typeof input.payload !== 'object' || Array.isArray(input.payload)) throw new DomainError(400, 'VALIDATION_ERROR', 'payload must be an object');
  const correctionOfId = input.correctionOfId == null ? null : uuid(input.correctionOfId, 'correctionOfId');
  const digest = checksum({ eventType, domain, sourceTimestamp: sourceTimestamp.toISOString(), correctionOfId, payload: input.payload });
  return { eventType, domain, sourceSystem, sourceRecordId, sourceTimestamp, correctionOfId, payload: input.payload, digest };
}

async function ingest(input) {
  const event = normalizeEnvelope(input);
  runtime.assertSourceDomain(event.sourceSystem, event.domain);
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`${event.sourceSystem}:${event.sourceRecordId}`]);
    const existing = (await client.query('SELECT * FROM sc_source_events WHERE source_system=$1 AND source_record_id=$2', [event.sourceSystem, event.sourceRecordId])).rows[0];
    if (existing) {
      await client.query('COMMIT');
      if (existing.payload_checksum === event.digest) return { replayed: true, event: existing };
      throw new DomainError(409, 'DUPLICATE_EVENT_CONFLICT', 'The source record id was already accepted with different content');
    }
    if (event.correctionOfId) {
      const original = await queryOne(client, 'SELECT * FROM sc_source_events WHERE id=$1', [event.correctionOfId], 'CORRECTION_TARGET_NOT_FOUND', 'Correction target does not exist');
      if (original.source_system !== event.sourceSystem || original.domain !== event.domain) throw new DomainError(409, 'INVALID_CORRECTION_CHAIN', 'Corrections must remain in the same source system and domain');
    }
    const eventId = id();
    await client.query(`INSERT INTO sc_source_events
      (id,source_system,source_record_id,domain,event_type,source_timestamp,payload_checksum,payload,correction_of_id,status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'RECEIVED')`,
    [eventId, event.sourceSystem, event.sourceRecordId, event.domain, event.eventType, event.sourceTimestamp, event.digest, event.payload, event.correctionOfId]);
    await client.query('SAVEPOINT process_event');
    try {
      const result = await HANDLERS[event.eventType](client, eventId, event);
      await client.query(`UPDATE sc_source_events SET status='PROCESSED',entity_type=$2,entity_id=$3 WHERE id=$1`, [eventId, result.entityType, result.entityId]);
      await client.query('RELEASE SAVEPOINT process_event');
      await client.query('COMMIT');
      return { replayed: false, event: { id: eventId, status: 'PROCESSED', domain: event.domain, event_type: event.eventType }, result };
    } catch (error) {
      await client.query('ROLLBACK TO SAVEPOINT process_event');
      const domainError = error instanceof DomainError ? error : new DomainError(500, 'EVENT_PROCESSING_ERROR', 'Source event could not be processed');
      await client.query(`UPDATE sc_source_events SET status=$2,error_code=$3,error_message=$4 WHERE id=$1`, [eventId, error instanceof DomainError ? 'REJECTED' : 'ERROR', domainError.code, domainError.message]);
      await client.query('COMMIT');
      domainError.eventId = eventId;
      throw domainError;
    }
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch { /* transaction may already be closed */ }
    throw error;
  } finally { client.release(); }
}

const HANDLERS = {
  async PART_UPSERT(client, eventId, { payload, sourceTimestamp }) {
    const partNumber = text(payload.partNumber, 'partNumber', 80);
    const description = text(payload.description, 'description', 300);
    const baseUnit = oneOf(payload.baseUnit, 'baseUnit', UNITS);
    const safetyStock = number(payload.safetyStock ?? 0, 'safetyStock', { min: 0 });
    const state = oneOf(payload.lifecycleState || 'ACTIVE', 'lifecycleState', ['ACTIVE', 'HOLD', 'OBSOLETE']);
    const current = (await client.query('SELECT * FROM sc_parts WHERE part_number=$1 FOR UPDATE', [partNumber])).rows[0];
    if (current && sourceTimestamp < new Date(current.source_timestamp)) throw new DomainError(409, 'OUT_OF_ORDER_EVENT', 'An older part event cannot replace newer authoritative state');
    const partId = current?.id || id();
    if (current?.base_unit !== undefined && current.base_unit !== baseUnit) throw new DomainError(409, 'UNIT_CHANGE_REQUIRES_MIGRATION', 'A part base unit cannot be changed by an event');
    if (current) await client.query(`UPDATE sc_parts SET description=$2,safety_stock=$3,lifecycle_state=$4,source_event_id=$5,source_timestamp=$6,version=version+1,updated_at=NOW() WHERE id=$1`, [partId, description, safetyStock, state, eventId, sourceTimestamp]);
    else await client.query(`INSERT INTO sc_parts (id,part_number,description,base_unit,safety_stock,lifecycle_state,source_event_id,source_timestamp) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`, [partId, partNumber, description, baseUnit, safetyStock, state, eventId, sourceTimestamp]);
    if (!current || current.lifecycle_state !== state) await transition(client, { entityType: 'PART', entityId: partId, fromState: current?.lifecycle_state, toState: state, reason: 'Authoritative part event', sourceEventId: eventId, version: (current?.version || 0) + 1 });
    return { entityType: 'PART', entityId: partId };
  },

  async SUPPLIER_UPSERT(client, eventId, { payload, sourceTimestamp }) {
    const externalKey = text(payload.externalSupplierKey, 'externalSupplierKey', 100);
    const name = text(payload.name, 'name');
    const country = payload.country == null ? null : text(payload.country, 'country', 100);
    const state = oneOf(payload.qualificationState, 'qualificationState', ['PENDING', 'APPROVED', 'SUSPENDED', 'REJECTED']);
    const current = (await client.query('SELECT * FROM sc_suppliers WHERE external_key=$1 FOR UPDATE', [externalKey])).rows[0];
    if (current && sourceTimestamp < new Date(current.source_timestamp)) throw new DomainError(409, 'OUT_OF_ORDER_EVENT', 'An older supplier event cannot replace newer authoritative state');
    const supplierId = current?.id || id();
    if (current) await client.query(`UPDATE sc_suppliers SET name=$2,country=$3,qualification_state=$4,source_event_id=$5,source_timestamp=$6,version=version+1,updated_at=NOW() WHERE id=$1`, [supplierId, name, country, state, eventId, sourceTimestamp]);
    else await client.query(`INSERT INTO sc_suppliers (id,external_key,name,country,qualification_state,source_event_id,source_timestamp) VALUES ($1,$2,$3,$4,$5,$6,$7)`, [supplierId, externalKey, name, country, state, eventId, sourceTimestamp]);
    if (!current || current.qualification_state !== state) await transition(client, { entityType: 'SUPPLIER', entityId: supplierId, fromState: current?.qualification_state, toState: state, reason: 'Authoritative supplier event', sourceEventId: eventId, version: (current?.version || 0) + 1 });
    for (const item of payload.parts || []) {
      const partNumber = text(item.partNumber, 'parts.partNumber', 80);
      const part = await queryOne(client, 'SELECT id FROM sc_parts WHERE part_number=$1', [partNumber], 'PART_NOT_FOUND', `Part ${partNumber} must be ingested first`);
      const approved = Boolean(item.approved);
      const lead = integer(item.leadTimeDays, 'parts.leadTimeDays', { min: 0, max: 3650 });
      await client.query(`INSERT INTO sc_supplier_parts (supplier_id,part_id,approved,lead_time_days,source_event_id,source_timestamp)
        VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (supplier_id,part_id) DO UPDATE SET approved=EXCLUDED.approved,lead_time_days=EXCLUDED.lead_time_days,source_event_id=EXCLUDED.source_event_id,source_timestamp=EXCLUDED.source_timestamp`, [supplierId, part.id, approved, lead, eventId, sourceTimestamp]);
    }
    return { entityType: 'SUPPLIER', entityId: supplierId };
  },

  async BOM_REVISION_UPSERT(client, eventId, { payload, sourceTimestamp }) {
    const assembly = await queryOne(client, 'SELECT * FROM sc_parts WHERE part_number=$1', [text(payload.assemblyPartNumber, 'assemblyPartNumber', 80)], 'ASSEMBLY_NOT_FOUND', 'Assembly part must be ingested first');
    const revision = text(payload.revision, 'revision', 40);
    const state = oneOf(payload.state, 'state', ['DRAFT', 'APPROVED']);
    if (!Array.isArray(payload.lines) || !payload.lines.length) throw new DomainError(400, 'VALIDATION_ERROR', 'BOM lines are required');
    if ((await client.query('SELECT 1 FROM sc_bom_revisions WHERE assembly_part_id=$1 AND revision=$2', [assembly.id, revision])).rowCount) throw new DomainError(409, 'IMMUTABLE_REVISION', 'Use a new BOM revision instead of mutating an existing revision');
    if (state === 'APPROVED') {
      const old = (await client.query(`UPDATE sc_bom_revisions SET state='SUPERSEDED',version=version+1 WHERE assembly_part_id=$1 AND state='APPROVED' RETURNING *`, [assembly.id])).rows[0];
      if (old) await transition(client, { entityType: 'BOM_REVISION', entityId: old.id, fromState: 'APPROVED', toState: 'SUPERSEDED', reason: `Superseded by revision ${revision}`, sourceEventId: eventId, version: old.version + 1 });
    }
    const bomId = id();
    await client.query(`INSERT INTO sc_bom_revisions (id,assembly_part_id,revision,state,effective_at,source_event_id,source_timestamp) VALUES ($1,$2,$3,$4,$5,$6,$7)`, [bomId, assembly.id, revision, state, payload.effectiveAt ? timestamp(payload.effectiveAt, 'effectiveAt') : null, eventId, sourceTimestamp]);
    const seen = new Set();
    for (const line of payload.lines) {
      const partNumber = text(line.componentPartNumber, 'componentPartNumber', 80);
      if (seen.has(partNumber)) throw new DomainError(400, 'DUPLICATE_BOM_COMPONENT', `${partNumber} occurs more than once`);
      seen.add(partNumber);
      const component = await queryOne(client, 'SELECT * FROM sc_parts WHERE part_number=$1', [partNumber], 'PART_NOT_FOUND', `Component ${partNumber} must be ingested first`);
      const unit = oneOf(line.unit, 'unit', UNITS);
      if (unit !== component.base_unit) throw new DomainError(409, 'UNIT_MISMATCH', `${partNumber} expects ${component.base_unit}, received ${unit}`);
      await client.query(`INSERT INTO sc_bom_lines (id,bom_revision_id,component_part_id,quantity_per,unit) VALUES ($1,$2,$3,$4,$5)`, [id(), bomId, component.id, number(line.quantityPer, 'quantityPer', { positive: true }), unit]);
    }
    await transition(client, { entityType: 'BOM_REVISION', entityId: bomId, fromState: null, toState: state, reason: 'Authoritative BOM revision', sourceEventId: eventId, version: 1 });
    return { entityType: 'BOM_REVISION', entityId: bomId };
  },

  async INVENTORY_RECEIPT(client, eventId, { payload, sourceTimestamp }) {
    const part = await queryOne(client, 'SELECT * FROM sc_parts WHERE part_number=$1', [text(payload.partNumber, 'partNumber', 80)], 'PART_NOT_FOUND', 'Part must be ingested first');
    const supplier = await queryOne(client, 'SELECT * FROM sc_suppliers WHERE external_key=$1', [text(payload.externalSupplierKey, 'externalSupplierKey', 100)], 'SUPPLIER_NOT_FOUND', 'Supplier must be ingested first');
    if (supplier.qualification_state !== 'APPROVED') throw new DomainError(409, 'SUPPLIER_NOT_APPROVED', 'Inventory cannot be received from an unapproved supplier');
    const mapping = (await client.query('SELECT approved FROM sc_supplier_parts WHERE supplier_id=$1 AND part_id=$2', [supplier.id, part.id])).rows[0];
    if (!mapping?.approved) throw new DomainError(409, 'SUPPLIER_PART_NOT_APPROVED', 'Supplier is not approved for this part');
    const unit = oneOf(payload.unit, 'unit', UNITS);
    if (unit !== part.base_unit) throw new DomainError(409, 'UNIT_MISMATCH', `${part.part_number} expects ${part.base_unit}, received ${unit}`);
    const lotCode = text(payload.lotCode, 'lotCode', 120);
    if ((await client.query('SELECT 1 FROM sc_lots WHERE lot_code=$1', [lotCode])).rowCount) throw new DomainError(409, 'LOT_ALREADY_EXISTS', 'Lot codes are immutable and globally unique');
    const lotId = id();
    await client.query(`INSERT INTO sc_lots (id,lot_code,part_id,supplier_id,quantity_received,unit,state,received_at,source_event_id,source_timestamp) VALUES ($1,$2,$3,$4,$5,$6,'RECEIVED',$7,$8,$9)`, [lotId, lotCode, part.id, supplier.id, number(payload.quantity, 'quantity', { positive: true }), unit, payload.receivedAt ? timestamp(payload.receivedAt, 'receivedAt') : sourceTimestamp, eventId, sourceTimestamp]);
    await transition(client, { entityType: 'LOT', entityId: lotId, fromState: null, toState: 'RECEIVED', reason: 'Authoritative inventory receipt', sourceEventId: eventId, version: 1 });
    return { entityType: 'LOT', entityId: lotId };
  },

  async QUALITY_INSPECTION(client, eventId, { payload }) {
    const lot = await queryOne(client, 'SELECT * FROM sc_lots WHERE lot_code=$1 FOR UPDATE', [text(payload.lotCode, 'lotCode', 120)], 'LOT_NOT_FOUND', 'Lot must be received first');
    if (!['RECEIVED', 'RELEASED', 'QUARANTINED'].includes(lot.state)) throw new DomainError(409, 'LOT_NOT_INSPECTABLE', `Lot state ${lot.state} cannot be inspected`);
    const inspectionCode = text(payload.inspectionCode, 'inspectionCode', 120);
    if ((await client.query('SELECT 1 FROM sc_inspections WHERE inspection_code=$1', [inspectionCode])).rowCount) throw new DomainError(409, 'INSPECTION_ALREADY_EXISTS', 'Inspection codes are immutable and globally unique');
    const inspectedAt = timestamp(payload.inspectedAt, 'inspectedAt');
    const latest = (await client.query('SELECT inspected_at FROM sc_inspections WHERE lot_id=$1 ORDER BY inspected_at DESC LIMIT 1', [lot.id])).rows[0];
    if (latest && inspectedAt < new Date(latest.inspected_at)) throw new DomainError(409, 'OUT_OF_ORDER_EVENT', 'An older inspection cannot replace newer lot quality state');
    const result = oneOf(payload.result, 'result', ['PASSED', 'FAILED', 'WAIVED']);
    const inspectionId = id();
    await client.query(`INSERT INTO sc_inspections (id,inspection_code,lot_id,result,measurements,specification,inspected_at,inspector,source_event_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`, [inspectionId, inspectionCode, lot.id, result, payload.measurements || {}, payload.specification || {}, inspectedAt, text(payload.inspector, 'inspector'), eventId]);
    const next = result === 'FAILED' ? 'QUARANTINED' : 'RELEASED';
    await client.query('UPDATE sc_lots SET state=$2,version=version+1 WHERE id=$1', [lot.id, next]);
    await transition(client, { entityType: 'INSPECTION', entityId: inspectionId, fromState: null, toState: result, reason: `Inspection of ${lot.lot_code}`, sourceEventId: eventId, version: 1 });
    if (lot.state !== next) await transition(client, { entityType: 'LOT', entityId: lot.id, fromState: lot.state, toState: next, reason: `Quality inspection ${result}`, sourceEventId: eventId, version: lot.version + 1 });
    if (result === 'FAILED') {
      const exceptionId = id();
      await client.query(`INSERT INTO sc_exceptions (id,exception_code,entity_type,entity_id,exception_type,severity,state,reason,uncertainty,source_event_id) VALUES ($1,$2,'LOT',$3,'QUALITY_FAILURE','CRITICAL','OPEN',$4,$5,$6)`, [exceptionId, `QUALITY-${inspectionCode}`, lot.id, `Lot ${lot.lot_code} failed inspection`, { inspectionId }, eventId]);
      await transition(client, { entityType: 'EXCEPTION', entityId: exceptionId, fromState: null, toState: 'OPEN', reason: 'Quality failure requires review', sourceEventId: eventId, version: 1 });
      await client.query(`UPDATE sc_plans SET status='NEEDS_REPLAN' WHERE status='APPROVED' AND id IN (SELECT DISTINCT plan_id FROM sc_reservations WHERE lot_id=$1 AND active)`, [lot.id]);
    }
    return { entityType: 'INSPECTION', entityId: inspectionId };
  },

  async WORK_ORDER_UPSERT(client, eventId, { payload, sourceTimestamp }) {
    const assembly = await queryOne(client, 'SELECT * FROM sc_parts WHERE part_number=$1', [text(payload.assemblyPartNumber, 'assemblyPartNumber', 80)], 'ASSEMBLY_NOT_FOUND', 'Assembly part must be ingested first');
    const unit = oneOf(payload.unit, 'unit', UNITS);
    if (unit !== assembly.base_unit) throw new DomainError(409, 'UNIT_MISMATCH', `${assembly.part_number} expects ${assembly.base_unit}, received ${unit}`);
    const code = text(payload.workOrderCode, 'workOrderCode', 120);
    const current = (await client.query('SELECT * FROM sc_work_orders WHERE work_order_code=$1 FOR UPDATE', [code])).rows[0];
    if (current && !['DRAFT', 'BLOCKED'].includes(current.state)) throw new DomainError(409, 'WORK_ORDER_LOCKED', `Work order state ${current.state} cannot be changed by source data`);
    if (current && sourceTimestamp < new Date(current.source_timestamp)) throw new DomainError(409, 'OUT_OF_ORDER_EVENT', 'An older work-order event cannot replace newer authoritative state');
    const workOrderId = current?.id || id();
    const values = [workOrderId, assembly.id, number(payload.quantity, 'quantity', { positive: true }), unit, payload.dueAt ? timestamp(payload.dueAt, 'dueAt') : null, integer(payload.priority ?? 5, 'priority', { min: 1, max: 9 }), eventId, sourceTimestamp];
    if (current) await client.query(`UPDATE sc_work_orders SET assembly_part_id=$2,quantity=$3,unit=$4,due_at=$5,priority=$6,source_event_id=$7,source_timestamp=$8,version=version+1,updated_at=NOW() WHERE id=$1`, values);
    else await client.query(`INSERT INTO sc_work_orders (id,work_order_code,assembly_part_id,quantity,unit,due_at,priority,state,source_event_id,source_timestamp) VALUES ($1,$9,$2,$3,$4,$5,$6,'DRAFT',$7,$8)`, [...values, code]);
    if (!current) await transition(client, { entityType: 'WORK_ORDER', entityId: workOrderId, fromState: null, toState: 'DRAFT', reason: 'Authoritative work-order event', sourceEventId: eventId, version: 1 });
    return { entityType: 'WORK_ORDER', entityId: workOrderId };
  },

  async SCHEDULE_COMMIT(client, eventId, { payload, sourceTimestamp }) {
    const workOrder = await queryOne(client, 'SELECT * FROM sc_work_orders WHERE work_order_code=$1 FOR UPDATE', [text(payload.workOrderCode, 'workOrderCode', 120)], 'WORK_ORDER_NOT_FOUND', 'Work order must be ingested first');
    if (!['DRAFT', 'BLOCKED'].includes(workOrder.state)) throw new DomainError(409, 'WORK_ORDER_LOCKED', `Work order state ${workOrder.state} cannot be rescheduled`);
    if (workOrder.schedule_source_timestamp && sourceTimestamp < new Date(workOrder.schedule_source_timestamp)) throw new DomainError(409, 'OUT_OF_ORDER_EVENT', 'An older schedule event cannot replace a newer commitment');
    await client.query(`UPDATE sc_work_orders SET due_at=$2,priority=$3,schedule_source_event_id=$4,schedule_source_timestamp=$5,version=version+1,updated_at=NOW() WHERE id=$1`, [workOrder.id, timestamp(payload.dueAt, 'dueAt'), integer(payload.priority, 'priority', { min: 1, max: 9 }), eventId, sourceTimestamp]);
    return { entityType: 'WORK_ORDER', entityId: workOrder.id };
  },

  async TELEMETRY_READING(client, eventId, { payload, sourceTimestamp }) {
    const receivedAt = new Date();
    const timeliness = receivedAt.getTime() - sourceTimestamp.getTime() > runtime.maxTelemetryAgeSeconds() * 1000 ? 'LATE' : 'ON_TIME';
    const readingId = id();
    await client.query(`INSERT INTO sc_telemetry_readings (id,asset_key,metric,value,unit,source_timestamp,received_at,timeliness,source_event_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`, [readingId, text(payload.assetKey, 'assetKey', 120), text(payload.metric, 'metric', 100), number(payload.value, 'value', { min: -1e12, max: 1e12 }), text(payload.unit, 'unit', 30), sourceTimestamp, receivedAt, timeliness, eventId]);
    if (timeliness === 'LATE') {
      const exceptionId = id();
      await client.query(`INSERT INTO sc_exceptions (id,exception_code,entity_type,entity_id,exception_type,severity,state,reason,uncertainty,source_event_id) VALUES ($1,$2,'TELEMETRY_READING',$3,'LATE_TELEMETRY','MEDIUM','OPEN',$4,$5,$6)`, [exceptionId, `LATE-${eventId}`, readingId, 'Telemetry arrived outside the accepted freshness window', { sourceTimestamp, receivedAt }, eventId]);
      await transition(client, { entityType: 'EXCEPTION', entityId: exceptionId, fromState: null, toState: 'OPEN', reason: 'Late telemetry requires review', sourceEventId: eventId, version: 1 });
    }
    return { entityType: 'TELEMETRY_READING', entityId: readingId, timeliness };
  },
};

async function dashboard() {
  const [counts, sources, lots, workOrders, exceptions, plans] = await Promise.all([
    db.query(`SELECT (SELECT count(*) FROM sc_parts)::int parts,(SELECT count(*) FROM sc_suppliers)::int suppliers,(SELECT count(*) FROM sc_lots)::int lots,(SELECT count(*) FROM sc_work_orders)::int work_orders,(SELECT count(*) FROM sc_exceptions WHERE state IN ('OPEN','UNDER_REVIEW'))::int open_exceptions`),
    db.query(`SELECT source_system,domain,max(source_timestamp) latest_source_timestamp,max(received_at) latest_received_at,count(*)::int events,count(*) FILTER (WHERE status='REJECTED')::int rejected FROM sc_source_events GROUP BY source_system,domain ORDER BY domain,source_system`),
    db.query(`SELECT l.id,l.lot_code,p.part_number,l.quantity_received,l.quantity_reserved,l.quantity_consumed,l.unit,l.state,l.received_at FROM sc_lots l JOIN sc_parts p ON p.id=l.part_id ORDER BY l.received_at DESC LIMIT 100`),
    db.query(`SELECT w.id,w.work_order_code,p.part_number,w.quantity,w.unit,w.due_at,w.priority,w.state,w.version FROM sc_work_orders w JOIN sc_parts p ON p.id=w.assembly_part_id ORDER BY w.priority,w.due_at NULLS LAST LIMIT 100`),
    db.query(`SELECT * FROM sc_exceptions ORDER BY created_at DESC LIMIT 100`),
    db.query(`SELECT * FROM sc_plans ORDER BY created_at DESC LIMIT 50`),
  ]);
  return { counts: counts.rows[0], sources: sources.rows, lots: lots.rows, workOrders: workOrders.rows, exceptions: exceptions.rows, plans: plans.rows };
}

async function events({ sourceSystem, domain, status, limit = 100 }) {
  const values = []; const where = [];
  for (const [column, value] of [['source_system', sourceSystem], ['domain', domain], ['status', status]]) if (value) { values.push(value); where.push(`${column}=$${values.length}`); }
  values.push(Math.min(500, Math.max(1, Number(limit) || 100)));
  return (await db.query(`SELECT id,source_system,source_record_id,domain,event_type,source_timestamp,received_at,status,error_code,error_message,entity_type,entity_id FROM sc_source_events ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY received_at DESC LIMIT $${values.length}`, values)).rows;
}

async function reconcile({ sourceSystem, domain, sourceRecordIds, from, to }) {
  sourceSystem = text(sourceSystem, 'sourceSystem', 80); domain = oneOf(domain, 'domain', Object.values(DOMAIN_BY_EVENT));
  runtime.assertSourceDomain(sourceSystem, domain);
  if (!Array.isArray(sourceRecordIds) || sourceRecordIds.length > 5000) throw new DomainError(400, 'VALIDATION_ERROR', 'sourceRecordIds must be an array of at most 5000 ids');
  const expected = [...new Set(sourceRecordIds.map(value => text(value, 'sourceRecordId', 180)))];
  const result = await db.query(`SELECT source_record_id,status,payload_checksum,source_timestamp FROM sc_source_events WHERE source_system=$1 AND domain=$2 AND source_timestamp BETWEEN $3 AND $4`, [sourceSystem, domain, timestamp(from, 'from'), timestamp(to, 'to')]);
  const byId = new Map(result.rows.map(row => [row.source_record_id, row]));
  return { sourceSystem, domain, expected: expected.length, present: expected.filter(value => byId.has(value)), missing: expected.filter(value => !byId.has(value)), unexpected: result.rows.filter(row => !expected.includes(row.source_record_id)).map(row => row.source_record_id), records: result.rows };
}

async function createPlan(user, body) {
  const planningKey = text(body.planningKey, 'planningKey', 120);
  const asOf = body.asOf ? timestamp(body.asOf, 'asOf') : new Date();
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`plan:${planningKey}`]);
    const existing = (await client.query('SELECT * FROM sc_plans WHERE planning_key=$1', [planningKey])).rows[0];
    if (existing) { await client.query('COMMIT'); return { replayed: true, plan: existing }; }
    const workOrders = (await client.query(`SELECT * FROM sc_work_orders WHERE state IN ('DRAFT','BLOCKED') ORDER BY priority,due_at NULLS LAST,work_order_code`)).rows;
    if (!workOrders.length) throw new DomainError(409, 'NO_PLANNABLE_WORK_ORDERS', 'No draft or blocked work orders are available');
    const requirements = (await client.query(`SELECT w.id work_order_id,bl.component_part_id,bl.quantity_per,bl.unit,p.part_number
      FROM sc_work_orders w JOIN sc_bom_revisions b ON b.assembly_part_id=w.assembly_part_id AND b.state='APPROVED' AND (b.effective_at IS NULL OR b.effective_at <= $1)
      JOIN sc_bom_lines bl ON bl.bom_revision_id=b.id JOIN sc_parts p ON p.id=bl.component_part_id WHERE w.id=ANY($2::uuid[])`, [asOf, workOrders.map(row => row.id)])).rows;
    const parts = (await client.query('SELECT * FROM sc_parts')).rows;
    const lots = (await client.query(`SELECT * FROM sc_lots WHERE state='RELEASED' ORDER BY received_at,lot_code`)).rows;
    const freshnessRows = (await client.query(`SELECT 'PART' kind,part_number key,source_timestamp ts FROM sc_parts UNION ALL SELECT 'LOT',lot_code,source_timestamp FROM sc_lots UNION ALL SELECT 'WORK_ORDER',work_order_code,source_timestamp FROM sc_work_orders`)).rows;
    const stale = freshnessRows.filter(row => asOf.getTime() - new Date(row.ts).getTime() > runtime.maxPlanningInputAgeSeconds() * 1000).map(row => ({ type: 'STALE_INPUT', entity: row.kind, key: row.key, sourceTimestamp: row.ts }));
    const openExceptions = (await client.query(`SELECT id,exception_type,severity,entity_type,entity_id,reason FROM sc_exceptions WHERE state IN ('OPEN','UNDER_REVIEW') ORDER BY severity DESC,created_at`)).rows;
    const input = { asOf: asOf.toISOString(), workOrders, requirements, parts, lots, openExceptions };
    const inputChecksum = checksum(input);
    const result = buildPlan({ workOrders, requirements, parts, lots, uncertainty: [...stale, ...openExceptions.map(item => ({ type: 'OPEN_EXCEPTION', ...item }))] });
    const planId = id();
    const snapshot = Object.fromEntries(workOrders.map(row => [row.id, { state: row.state, version: row.version }]));
    await client.query(`INSERT INTO sc_plans (id,planning_key,status,policy_version,input_as_of,input_checksum,uncertainty,has_shortage,rollback_snapshot,created_by) VALUES ($1,$2,'DRAFT','fifo-safety-v1',$3,$4,$5,$6,$7,$8)`, [planId, planningKey, asOf, inputChecksum, JSON.stringify(result.uncertainty), result.hasShortage, snapshot, user.id]);
    for (const line of result.lines) await client.query(`INSERT INTO sc_plan_lines (id,plan_id,work_order_id,component_part_id,lot_id,required_quantity,allocated_quantity,shortage_quantity,unit,rationale,uncertainty) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`, [id(), planId, line.workOrderId, line.componentPartId, line.lotId, line.requiredQuantity, line.allocatedQuantity, line.shortageQuantity, line.unit, line.rationale, line.uncertainty]);
    await transition(client, { entityType: 'PLAN', entityId: planId, fromState: null, toState: 'DRAFT', reason: 'Deterministic plan generated', actorUserId: user.id, correlationId: planId, version: 1 });
    await client.query('COMMIT');
    return { replayed: false, plan: { id: planId, planningKey, status: 'DRAFT', policyVersion: 'fifo-safety-v1', inputChecksum, hasShortage: result.hasShortage, uncertainty: result.uncertainty, lines: result.lines } };
  } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
}

async function getPlan(planId) {
  planId = uuid(planId);
  const plan = await queryOne(db, 'SELECT * FROM sc_plans WHERE id=$1', [planId], 'PLAN_NOT_FOUND', 'Plan does not exist');
  plan.lines = (await db.query(`SELECT l.*,w.work_order_code,p.part_number,lot.lot_code FROM sc_plan_lines l JOIN sc_work_orders w ON w.id=l.work_order_id JOIN sc_parts p ON p.id=l.component_part_id LEFT JOIN sc_lots lot ON lot.id=l.lot_id WHERE l.plan_id=$1 ORDER BY w.priority,w.work_order_code,p.part_number,lot.received_at NULLS LAST`, [planId])).rows;
  plan.overrides = (await db.query('SELECT * FROM sc_human_overrides WHERE plan_id=$1 ORDER BY created_at', [planId])).rows;
  return plan;
}

async function approvePlan(user, planId, body) {
  planId = uuid(planId); const decisionId = text(body.clientDecisionId, 'clientDecisionId', 120); const reason = text(body.reason, 'reason', 500);
  const excluded = [...new Set((body.excludePlanLineIds || []).map(value => uuid(value, 'excludePlanLineIds')))];
  const acceptShortage = body.acceptShortage === true;
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const plan = await queryOne(client, 'SELECT * FROM sc_plans WHERE id=$1 FOR UPDATE', [planId], 'PLAN_NOT_FOUND', 'Plan does not exist');
    const replay = (await client.query('SELECT * FROM sc_human_overrides WHERE plan_id=$1 AND client_decision_id=$2', [planId, decisionId])).rows[0];
    if (replay) { await client.query('COMMIT'); return { replayed: true, planId, status: plan.status }; }
    if (plan.status !== 'DRAFT') throw new DomainError(409, 'PLAN_NOT_DRAFT', `Plan state ${plan.status} cannot be approved`);
    const lines = (await client.query('SELECT * FROM sc_plan_lines WHERE plan_id=$1 ORDER BY id', [planId])).rows;
    if (excluded.some(value => !lines.some(line => line.id === value))) throw new DomainError(400, 'UNKNOWN_PLAN_LINE', 'An excluded plan line is not part of this plan');
    const effective = lines.filter(line => !excluded.includes(line.id));
    const shortage = effective.some(line => Number(line.shortage_quantity) > 0) || lines.some(line => excluded.includes(line.id) && Number(line.allocated_quantity) > 0);
    if (shortage && !acceptShortage) throw new DomainError(409, 'SHORTAGE_REQUIRES_OVERRIDE', 'Approval must explicitly accept the remaining shortage with a rationale');
    const allocationLines = effective.filter(line => line.lot_id && Number(line.allocated_quantity) > 0);
    if (allocationLines.length) await client.query('SELECT id FROM sc_lots WHERE id=ANY($1::uuid[]) ORDER BY id FOR UPDATE', [[...new Set(allocationLines.map(line => line.lot_id))]]);
    const byPart = new Map(); for (const line of allocationLines) byPart.set(line.component_part_id, round((byPart.get(line.component_part_id) || 0) + Number(line.allocated_quantity)));
    for (const [partId, requested] of byPart) {
      const capacity = (await client.query(`SELECT p.safety_stock,COALESCE(sum(l.quantity_received-l.quantity_consumed-l.quantity_reserved) FILTER (WHERE l.state='RELEASED'),0) available FROM sc_parts p LEFT JOIN sc_lots l ON l.part_id=p.id WHERE p.id=$1 GROUP BY p.id`, [partId])).rows[0];
      if (requested > Math.max(0, Number(capacity.available) - Number(capacity.safety_stock))) throw new DomainError(409, 'PLAN_CAPACITY_CHANGED', 'Released inventory changed; generate a new plan');
    }
    for (const line of allocationLines) {
      const lot = await queryOne(client, 'SELECT * FROM sc_lots WHERE id=$1', [line.lot_id], 'LOT_NOT_FOUND', 'Planned lot no longer exists');
      if (lot.state !== 'RELEASED' || lot.unit !== line.unit) throw new DomainError(409, 'LOT_NOT_ALLOCATABLE', 'A planned lot is no longer released in the required unit');
      if (Number(lot.quantity_received) - Number(lot.quantity_consumed) - Number(lot.quantity_reserved) < Number(line.allocated_quantity)) throw new DomainError(409, 'PLAN_CAPACITY_CHANGED', 'A planned lot no longer has the required unreserved quantity');
      await client.query('UPDATE sc_lots SET quantity_reserved=quantity_reserved+$2,version=version+1 WHERE id=$1', [lot.id, line.allocated_quantity]);
      await client.query(`INSERT INTO sc_reservations (id,plan_id,plan_line_id,work_order_id,lot_id,quantity,unit) VALUES ($1,$2,$3,$4,$5,$6,$7)`, [id(), planId, line.id, line.work_order_id, line.lot_id, line.allocated_quantity, line.unit]);
    }
    const workOrderIds = [...new Set(lines.map(line => line.work_order_id))];
    for (const workOrderId of workOrderIds) {
      const workOrder = await queryOne(client, 'SELECT * FROM sc_work_orders WHERE id=$1 FOR UPDATE', [workOrderId], 'WORK_ORDER_NOT_FOUND', 'Work order no longer exists');
      const blocked = lines.some(line => line.work_order_id === workOrderId && (Number(line.shortage_quantity) > 0 || (excluded.includes(line.id) && Number(line.allocated_quantity) > 0)));
      const next = blocked ? 'BLOCKED' : 'PLANNED';
      if (workOrder.state !== next) {
        await client.query('UPDATE sc_work_orders SET state=$2,version=version+1,updated_at=NOW() WHERE id=$1', [workOrderId, next]);
        await transition(client, { entityType: 'WORK_ORDER', entityId: workOrderId, fromState: workOrder.state, toState: next, reason: blocked ? `Shortage accepted: ${reason}` : 'Plan approved and inventory reserved', actorUserId: user.id, correlationId: planId, version: workOrder.version + 1 });
      }
    }
    await client.query(`INSERT INTO sc_human_overrides (id,plan_id,client_decision_id,reason,changes,accept_shortage,actor_user_id) VALUES ($1,$2,$3,$4,$5,$6,$7)`, [id(), planId, decisionId, reason, { excludePlanLineIds: excluded }, acceptShortage, user.id]);
    await client.query(`UPDATE sc_plans SET status='APPROVED',approved_by=$2,approved_at=NOW() WHERE id=$1`, [planId, user.id]);
    await transition(client, { entityType: 'PLAN', entityId: planId, fromState: 'DRAFT', toState: 'APPROVED', reason, actorUserId: user.id, correlationId: planId, version: 2 });
    await client.query('COMMIT'); return { replayed: false, planId, status: 'APPROVED', acceptedShortage: shortage };
  } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
}

async function rollbackPlan(user, planId, body) {
  planId = uuid(planId); const reason = text(body.reason, 'reason', 500); const client = await db.connect();
  try {
    await client.query('BEGIN');
    const plan = await queryOne(client, 'SELECT * FROM sc_plans WHERE id=$1 FOR UPDATE', [planId], 'PLAN_NOT_FOUND', 'Plan does not exist');
    if (plan.status === 'ROLLED_BACK') { await client.query('COMMIT'); return { replayed: true, planId, status: 'ROLLED_BACK' }; }
    if (!['APPROVED', 'NEEDS_REPLAN'].includes(plan.status)) throw new DomainError(409, 'PLAN_NOT_ROLLBACKABLE', `Plan state ${plan.status} cannot be rolled back`);
    const reservations = (await client.query('SELECT * FROM sc_reservations WHERE plan_id=$1 AND active ORDER BY lot_id FOR UPDATE', [planId])).rows;
    for (const reservation of reservations) {
      await client.query('UPDATE sc_lots SET quantity_reserved=quantity_reserved-$2,version=version+1 WHERE id=$1', [reservation.lot_id, reservation.quantity]);
      await client.query('UPDATE sc_reservations SET active=false,released_at=NOW() WHERE id=$1', [reservation.id]);
    }
    for (const [workOrderId, snapshot] of Object.entries(plan.rollback_snapshot)) {
      const workOrder = (await client.query('SELECT * FROM sc_work_orders WHERE id=$1 FOR UPDATE', [workOrderId])).rows[0];
      if (!workOrder) continue;
      await client.query('UPDATE sc_work_orders SET state=$2,version=version+1,updated_at=NOW() WHERE id=$1', [workOrderId, snapshot.state]);
      await transition(client, { entityType: 'WORK_ORDER', entityId: workOrderId, fromState: workOrder.state, toState: snapshot.state, reason: `Plan rollback: ${reason}`, actorUserId: user.id, correlationId: planId, version: workOrder.version + 1 });
    }
    await client.query(`UPDATE sc_plans SET status='ROLLED_BACK',rolled_back_at=NOW() WHERE id=$1`, [planId]);
    await transition(client, { entityType: 'PLAN', entityId: planId, fromState: plan.status, toState: 'ROLLED_BACK', reason, actorUserId: user.id, correlationId: planId, version: 3 });
    await client.query('COMMIT'); return { replayed: false, planId, status: 'ROLLED_BACK', releasedReservations: reservations.length };
  } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
}

async function decideException(user, exceptionId, body) {
  exceptionId = uuid(exceptionId); const decision = oneOf(body.decision, 'decision', ['APPROVE', 'REJECT']);
  const decisionId = text(body.clientDecisionId, 'clientDecisionId', 120); const rationale = text(body.rationale, 'rationale', 500); const client = await db.connect();
  try {
    await client.query('BEGIN'); const exception = await queryOne(client, 'SELECT * FROM sc_exceptions WHERE id=$1 FOR UPDATE', [exceptionId], 'EXCEPTION_NOT_FOUND', 'Exception does not exist');
    const existing = (await client.query('SELECT * FROM sc_approvals WHERE exception_id=$1 AND client_decision_id=$2', [exceptionId, decisionId])).rows[0];
    if (existing) { await client.query('COMMIT'); return { replayed: true, exceptionId, state: exception.state }; }
    if (!['OPEN', 'UNDER_REVIEW'].includes(exception.state)) throw new DomainError(409, 'EXCEPTION_ALREADY_DECIDED', 'Exception is no longer awaiting a decision');
    const next = decision === 'APPROVE' ? 'APPROVED' : 'REJECTED';
    await client.query(`INSERT INTO sc_approvals (id,exception_id,client_decision_id,decision,rationale,actor_user_id) VALUES ($1,$2,$3,$4,$5,$6)`, [id(), exceptionId, decisionId, decision, rationale, user.id]);
    await client.query('UPDATE sc_exceptions SET state=$2,version=version+1,updated_at=NOW() WHERE id=$1', [exceptionId, next]);
    await transition(client, { entityType: 'EXCEPTION', entityId: exceptionId, fromState: exception.state, toState: next, reason: rationale, actorUserId: user.id, version: exception.version + 1 });
    await client.query('COMMIT'); return { replayed: false, exceptionId, state: next };
  } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
}

async function createChangeOrder(user, body) {
  const code = text(body.changeOrderCode, 'changeOrderCode', 120); const targetType = oneOf(body.targetType, 'targetType', ['WORK_ORDER']); const targetId = uuid(body.targetId, 'targetId');
  const rationale = text(body.rationale, 'rationale', 500); const changes = body.proposedChanges;
  if (!changes || typeof changes !== 'object' || Array.isArray(changes) || !Object.keys(changes).length) throw new DomainError(400, 'VALIDATION_ERROR', 'proposedChanges must be a non-empty object');
  const allowed = new Set(['quantity', 'dueAt', 'priority']); if (Object.keys(changes).some(key => !allowed.has(key))) throw new DomainError(400, 'UNSAFE_CHANGE', 'Only quantity, dueAt, and priority may be changed');
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    await queryOne(client, 'SELECT id FROM sc_work_orders WHERE id=$1', [targetId], 'WORK_ORDER_NOT_FOUND', 'Work order does not exist');
    if ((await client.query('SELECT 1 FROM sc_change_orders WHERE change_order_code=$1', [code])).rowCount) throw new DomainError(409, 'CHANGE_ORDER_ALREADY_EXISTS', 'Change order codes are immutable and globally unique');
    const changeId = id(); await client.query(`INSERT INTO sc_change_orders (id,change_order_code,target_type,target_id,state,proposed_changes,rationale,requested_by) VALUES ($1,$2,$3,$4,'SUBMITTED',$5,$6,$7)`, [changeId, code, targetType, targetId, changes, rationale, user.id]);
    await transition(client, { entityType: 'CHANGE_ORDER', entityId: changeId, fromState: null, toState: 'SUBMITTED', reason: rationale, actorUserId: user.id, version: 1 });
    await client.query('COMMIT'); return { id: changeId, state: 'SUBMITTED' };
  } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
}

async function decideChangeOrder(user, changeId, body) {
  changeId = uuid(changeId); const decision = oneOf(body.decision, 'decision', ['APPROVE', 'REJECT']); const reason = text(body.reason, 'reason', 500); const client = await db.connect();
  try {
    await client.query('BEGIN'); const change = await queryOne(client, 'SELECT * FROM sc_change_orders WHERE id=$1 FOR UPDATE', [changeId], 'CHANGE_ORDER_NOT_FOUND', 'Change order does not exist');
    if (change.state !== 'SUBMITTED') throw new DomainError(409, 'CHANGE_ORDER_NOT_SUBMITTED', `Change order state ${change.state} cannot be decided`);
    const next = decision === 'APPROVE' ? 'APPROVED' : 'REJECTED';
    await client.query('UPDATE sc_change_orders SET state=$2,approved_by=$3,version=version+1,updated_at=NOW() WHERE id=$1', [changeId, next, user.id]);
    await transition(client, { entityType: 'CHANGE_ORDER', entityId: changeId, fromState: 'SUBMITTED', toState: next, reason, actorUserId: user.id, version: change.version + 1 });
    await client.query('COMMIT'); return { id: changeId, state: next };
  } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
}

async function applyChangeOrder(user, changeId) {
  changeId = uuid(changeId); const client = await db.connect();
  try {
    await client.query('BEGIN'); const change = await queryOne(client, 'SELECT * FROM sc_change_orders WHERE id=$1 FOR UPDATE', [changeId], 'CHANGE_ORDER_NOT_FOUND', 'Change order does not exist');
    if (change.state !== 'APPROVED') throw new DomainError(409, 'CHANGE_ORDER_NOT_APPROVED', `Change order state ${change.state} cannot be applied`);
    const workOrder = await queryOne(client, 'SELECT * FROM sc_work_orders WHERE id=$1 FOR UPDATE', [change.target_id], 'WORK_ORDER_NOT_FOUND', 'Work order does not exist');
    if (!['DRAFT', 'BLOCKED'].includes(workOrder.state)) throw new DomainError(409, 'WORK_ORDER_LOCKED', 'Only draft or blocked work orders may be changed');
    const changes = change.proposed_changes;
    const quantity = changes.quantity == null ? Number(workOrder.quantity) : number(changes.quantity, 'quantity', { positive: true });
    const dueAt = changes.dueAt == null ? workOrder.due_at : timestamp(changes.dueAt, 'dueAt');
    const priority = changes.priority == null ? workOrder.priority : integer(changes.priority, 'priority', { min: 1, max: 9 });
    const snapshot = { quantity: workOrder.quantity, dueAt: workOrder.due_at, priority: workOrder.priority };
    await client.query('UPDATE sc_work_orders SET quantity=$2,due_at=$3,priority=$4,version=version+1,updated_at=NOW() WHERE id=$1', [workOrder.id, quantity, dueAt, priority]);
    await client.query(`UPDATE sc_change_orders SET state='APPLIED',rollback_snapshot=$2,version=version+1,updated_at=NOW() WHERE id=$1`, [changeId, snapshot]);
    await transition(client, { entityType: 'CHANGE_ORDER', entityId: changeId, fromState: 'APPROVED', toState: 'APPLIED', reason: 'Approved work-order change applied', actorUserId: user.id, correlationId: changeId, version: change.version + 1 });
    await transition(client, { entityType: 'WORK_ORDER', entityId: workOrder.id, fromState: workOrder.state, toState: workOrder.state, reason: `Attributes changed by ${change.change_order_code}`, actorUserId: user.id, correlationId: changeId, version: workOrder.version + 1 });
    await client.query('COMMIT'); return { id: changeId, state: 'APPLIED' };
  } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
}

async function rollbackChangeOrder(user, changeId, body) {
  changeId = uuid(changeId); const reason = text(body.reason, 'reason', 500); const client = await db.connect();
  try {
    await client.query('BEGIN'); const change = await queryOne(client, 'SELECT * FROM sc_change_orders WHERE id=$1 FOR UPDATE', [changeId], 'CHANGE_ORDER_NOT_FOUND', 'Change order does not exist');
    if (change.state !== 'APPLIED' || !change.rollback_snapshot) throw new DomainError(409, 'CHANGE_ORDER_NOT_ROLLBACKABLE', 'Only an applied change order can be rolled back');
    const workOrder = await queryOne(client, 'SELECT * FROM sc_work_orders WHERE id=$1 FOR UPDATE', [change.target_id], 'WORK_ORDER_NOT_FOUND', 'Work order does not exist');
    if (!['DRAFT', 'BLOCKED'].includes(workOrder.state)) throw new DomainError(409, 'WORK_ORDER_LOCKED', 'Work order progressed after the change and cannot be rolled back safely');
    const snapshot = change.rollback_snapshot;
    await client.query('UPDATE sc_work_orders SET quantity=$2,due_at=$3,priority=$4,version=version+1,updated_at=NOW() WHERE id=$1', [workOrder.id, snapshot.quantity, snapshot.dueAt, snapshot.priority]);
    await client.query(`UPDATE sc_change_orders SET state='ROLLED_BACK',version=version+1,updated_at=NOW() WHERE id=$1`, [changeId]);
    await transition(client, { entityType: 'CHANGE_ORDER', entityId: changeId, fromState: 'APPLIED', toState: 'ROLLED_BACK', reason, actorUserId: user.id, correlationId: changeId, version: change.version + 1 });
    await client.query('COMMIT'); return { id: changeId, state: 'ROLLED_BACK' };
  } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
}

async function transitions(entityType, entityId) {
  entityType = text(entityType, 'entityType', 40).toUpperCase(); entityId = uuid(entityId);
  return (await db.query('SELECT * FROM sc_state_transitions WHERE entity_type=$1 AND entity_id=$2 ORDER BY occurred_at,id', [entityType, entityId])).rows;
}

module.exports = { DOMAIN_BY_EVENT, approvePlan, applyChangeOrder, createChangeOrder, createPlan, dashboard, decideChangeOrder, decideException, events, getPlan, ingest, reconcile, rollbackChangeOrder, rollbackPlan, transitions };
