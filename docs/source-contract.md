# Authoritative source contract

## Envelope

Every adapter submits JSON to `POST /api/traceability/events` with a bearer token assigned the `integration` or `admin` role:

```json
{
  "sourceSystem": "erp",
  "sourceRecordId": "immutable-upstream-event-id",
  "eventType": "INVENTORY_RECEIPT",
  "sourceTimestamp": "2026-07-20T12:00:00Z",
  "correctionOfId": null,
  "payload": {}
}
```

`sourceSystem + sourceRecordId` is globally idempotent. An exact retry returns the original event; different content returns `DUPLICATE_EVENT_CONFLICT`. Corrections get a new source record ID and reference the persisted event UUID in `correctionOfId`. They must remain in the same source and domain. Rejected events remain stored with a bounded error code/message.

## Event types and payloads

| Event | Domain | Required payload |
| --- | --- | --- |
| `PART_UPSERT` | BOM | `partNumber`, `description`, `baseUnit`, `safetyStock`, optional lifecycle state |
| `BOM_REVISION_UPSERT` | BOM | assembly part, immutable revision, state, effective time, non-empty component lines |
| `SUPPLIER_UPSERT` | SUPPLIER | external key, name, qualification state, optional approved part mappings |
| `INVENTORY_RECEIPT` | INVENTORY | lot, part, approved supplier, positive quantity, base unit, receipt time |
| `QUALITY_INSPECTION` | QUALITY | inspection, received lot, `PASSED`/`FAILED`/`WAIVED`, inspector, measurement/specification evidence |
| `WORK_ORDER_UPSERT` | WORK_ORDER | work-order code, assembly, positive quantity, base unit, due time, priority 1–9 |
| `SCHEDULE_COMMIT` | SCHEDULE | existing work order, due time, priority 1–9 |
| `TELEMETRY_READING` | TELEMETRY | asset, metric, finite value, unit; the envelope time is the measurement time |

Allowed inventory/base units are `EA`, `WAFER`, `DIE`, `TRAY`, `KG`, and `L`. There is no implicit conversion. A mismatch is rejected, not rounded or guessed.

## Reconciliation and freshness

`POST /api/traceability/reconciliation` accepts `sourceSystem`, `domain`, `from`, `to`, and up to 5,000 expected source record IDs. The response identifies present, missing, and unexpected records. Monitor rejected event counts, missing records, source timestamps, and `/api/ready`. Late telemetry opens an exception. Planning reports stale master/inventory/work-order inputs according to `MAX_PLANNING_INPUT_AGE_SECONDS`.

Adapters should back off on 429/5xx, retry the same source record ID, alert on 4xx rejection, and never manufacture a replacement ID merely to bypass a conflict.
