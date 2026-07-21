CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name VARCHAR(255),
  role VARCHAR(50) NOT NULL DEFAULT 'operator',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE sc_source_events (
  id UUID PRIMARY KEY,
  source_system VARCHAR(80) NOT NULL,
  source_record_id VARCHAR(180) NOT NULL,
  domain VARCHAR(30) NOT NULL CHECK (domain IN ('BOM','SUPPLIER','INVENTORY','QUALITY','SCHEDULE','TELEMETRY','WORK_ORDER')),
  event_type VARCHAR(50) NOT NULL,
  source_timestamp TIMESTAMPTZ NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payload_checksum CHAR(64) NOT NULL,
  payload JSONB NOT NULL,
  correction_of_id UUID REFERENCES sc_source_events(id) ON DELETE RESTRICT,
  status VARCHAR(20) NOT NULL CHECK (status IN ('RECEIVED','PROCESSED','REJECTED','ERROR')),
  error_code VARCHAR(80),
  error_message VARCHAR(300),
  entity_type VARCHAR(40),
  entity_id UUID,
  UNIQUE (source_system, source_record_id)
);
CREATE INDEX sc_source_events_source_time ON sc_source_events(source_system, source_timestamp);
CREATE INDEX sc_source_events_status ON sc_source_events(status, received_at);

CREATE TABLE sc_parts (
  id UUID PRIMARY KEY,
  part_number VARCHAR(80) UNIQUE NOT NULL,
  description VARCHAR(300) NOT NULL,
  base_unit VARCHAR(12) NOT NULL CHECK (base_unit IN ('EA','WAFER','DIE','TRAY','KG','L')),
  safety_stock NUMERIC(20,6) NOT NULL DEFAULT 0 CHECK (safety_stock >= 0),
  lifecycle_state VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (lifecycle_state IN ('ACTIVE','HOLD','OBSOLETE')),
  source_event_id UUID NOT NULL REFERENCES sc_source_events(id) ON DELETE RESTRICT,
  source_timestamp TIMESTAMPTZ NOT NULL,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE sc_suppliers (
  id UUID PRIMARY KEY,
  external_key VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  country VARCHAR(100),
  qualification_state VARCHAR(20) NOT NULL CHECK (qualification_state IN ('PENDING','APPROVED','SUSPENDED','REJECTED')),
  source_event_id UUID NOT NULL REFERENCES sc_source_events(id) ON DELETE RESTRICT,
  source_timestamp TIMESTAMPTZ NOT NULL,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE sc_supplier_parts (
  supplier_id UUID NOT NULL REFERENCES sc_suppliers(id) ON DELETE RESTRICT,
  part_id UUID NOT NULL REFERENCES sc_parts(id) ON DELETE RESTRICT,
  approved BOOLEAN NOT NULL DEFAULT FALSE,
  lead_time_days INTEGER NOT NULL CHECK (lead_time_days >= 0),
  source_event_id UUID NOT NULL REFERENCES sc_source_events(id) ON DELETE RESTRICT,
  source_timestamp TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (supplier_id, part_id)
);

CREATE TABLE sc_bom_revisions (
  id UUID PRIMARY KEY,
  assembly_part_id UUID NOT NULL REFERENCES sc_parts(id) ON DELETE RESTRICT,
  revision VARCHAR(40) NOT NULL,
  state VARCHAR(20) NOT NULL CHECK (state IN ('DRAFT','APPROVED','SUPERSEDED')),
  effective_at TIMESTAMPTZ,
  source_event_id UUID NOT NULL REFERENCES sc_source_events(id) ON DELETE RESTRICT,
  source_timestamp TIMESTAMPTZ NOT NULL,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  UNIQUE (assembly_part_id, revision)
);
CREATE UNIQUE INDEX sc_bom_one_approved ON sc_bom_revisions(assembly_part_id) WHERE state = 'APPROVED';

CREATE TABLE sc_bom_lines (
  id UUID PRIMARY KEY,
  bom_revision_id UUID NOT NULL REFERENCES sc_bom_revisions(id) ON DELETE CASCADE,
  component_part_id UUID NOT NULL REFERENCES sc_parts(id) ON DELETE RESTRICT,
  quantity_per NUMERIC(20,6) NOT NULL CHECK (quantity_per > 0),
  unit VARCHAR(12) NOT NULL CHECK (unit IN ('EA','WAFER','DIE','TRAY','KG','L')),
  UNIQUE (bom_revision_id, component_part_id)
);

CREATE TABLE sc_lots (
  id UUID PRIMARY KEY,
  lot_code VARCHAR(120) UNIQUE NOT NULL,
  part_id UUID NOT NULL REFERENCES sc_parts(id) ON DELETE RESTRICT,
  supplier_id UUID NOT NULL REFERENCES sc_suppliers(id) ON DELETE RESTRICT,
  quantity_received NUMERIC(20,6) NOT NULL CHECK (quantity_received > 0),
  quantity_reserved NUMERIC(20,6) NOT NULL DEFAULT 0 CHECK (quantity_reserved >= 0),
  quantity_consumed NUMERIC(20,6) NOT NULL DEFAULT 0 CHECK (quantity_consumed >= 0),
  unit VARCHAR(12) NOT NULL CHECK (unit IN ('EA','WAFER','DIE','TRAY','KG','L')),
  state VARCHAR(24) NOT NULL CHECK (state IN ('RECEIVED','QUARANTINED','RELEASED','CONSUMED','REJECTED')),
  received_at TIMESTAMPTZ NOT NULL,
  source_event_id UUID NOT NULL REFERENCES sc_source_events(id) ON DELETE RESTRICT,
  source_timestamp TIMESTAMPTZ NOT NULL,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  CHECK (quantity_reserved + quantity_consumed <= quantity_received)
);
CREATE INDEX sc_lots_part_state ON sc_lots(part_id, state, received_at);

CREATE TABLE sc_inspections (
  id UUID PRIMARY KEY,
  inspection_code VARCHAR(120) UNIQUE NOT NULL,
  lot_id UUID NOT NULL REFERENCES sc_lots(id) ON DELETE RESTRICT,
  result VARCHAR(20) NOT NULL CHECK (result IN ('PASSED','FAILED','WAIVED')),
  measurements JSONB NOT NULL DEFAULT '{}',
  specification JSONB NOT NULL DEFAULT '{}',
  inspected_at TIMESTAMPTZ NOT NULL,
  inspector VARCHAR(255) NOT NULL,
  source_event_id UUID NOT NULL REFERENCES sc_source_events(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE sc_work_orders (
  id UUID PRIMARY KEY,
  work_order_code VARCHAR(120) UNIQUE NOT NULL,
  assembly_part_id UUID NOT NULL REFERENCES sc_parts(id) ON DELETE RESTRICT,
  quantity NUMERIC(20,6) NOT NULL CHECK (quantity > 0),
  unit VARCHAR(12) NOT NULL CHECK (unit IN ('EA','WAFER','DIE','TRAY','KG','L')),
  due_at TIMESTAMPTZ,
  priority INTEGER NOT NULL DEFAULT 5 CHECK (priority BETWEEN 1 AND 9),
  state VARCHAR(24) NOT NULL CHECK (state IN ('DRAFT','PLANNED','RELEASED','IN_PROGRESS','BLOCKED','COMPLETE','CANCELLED')),
  source_event_id UUID NOT NULL REFERENCES sc_source_events(id) ON DELETE RESTRICT,
  source_timestamp TIMESTAMPTZ NOT NULL,
  schedule_source_event_id UUID REFERENCES sc_source_events(id) ON DELETE RESTRICT,
  schedule_source_timestamp TIMESTAMPTZ,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX sc_work_orders_state_due ON sc_work_orders(state, priority, due_at);

CREATE TABLE sc_telemetry_readings (
  id UUID PRIMARY KEY,
  asset_key VARCHAR(120) NOT NULL,
  metric VARCHAR(100) NOT NULL,
  value NUMERIC(24,8) NOT NULL,
  unit VARCHAR(30) NOT NULL,
  source_timestamp TIMESTAMPTZ NOT NULL,
  received_at TIMESTAMPTZ NOT NULL,
  timeliness VARCHAR(12) NOT NULL CHECK (timeliness IN ('ON_TIME','LATE')),
  source_event_id UUID UNIQUE NOT NULL REFERENCES sc_source_events(id) ON DELETE RESTRICT
);
CREATE INDEX sc_telemetry_asset_metric_time ON sc_telemetry_readings(asset_key, metric, source_timestamp DESC);

CREATE TABLE sc_exceptions (
  id UUID PRIMARY KEY,
  exception_code VARCHAR(120) UNIQUE NOT NULL,
  entity_type VARCHAR(40) NOT NULL,
  entity_id UUID NOT NULL,
  exception_type VARCHAR(60) NOT NULL,
  severity VARCHAR(12) NOT NULL CHECK (severity IN ('LOW','MEDIUM','HIGH','CRITICAL')),
  state VARCHAR(24) NOT NULL CHECK (state IN ('OPEN','UNDER_REVIEW','APPROVED','REJECTED','RESOLVED')),
  reason VARCHAR(500) NOT NULL,
  uncertainty JSONB NOT NULL DEFAULT '{}',
  source_event_id UUID REFERENCES sc_source_events(id) ON DELETE RESTRICT,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX sc_exceptions_entity_state ON sc_exceptions(entity_type, entity_id, state);

CREATE TABLE sc_approvals (
  id UUID PRIMARY KEY,
  exception_id UUID NOT NULL REFERENCES sc_exceptions(id) ON DELETE RESTRICT,
  client_decision_id VARCHAR(120) NOT NULL,
  decision VARCHAR(12) NOT NULL CHECK (decision IN ('APPROVE','REJECT')),
  rationale VARCHAR(500) NOT NULL,
  actor_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  decided_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (exception_id, client_decision_id)
);

CREATE TABLE sc_change_orders (
  id UUID PRIMARY KEY,
  change_order_code VARCHAR(120) UNIQUE NOT NULL,
  target_type VARCHAR(40) NOT NULL,
  target_id UUID NOT NULL,
  state VARCHAR(24) NOT NULL CHECK (state IN ('DRAFT','SUBMITTED','APPROVED','REJECTED','APPLIED','ROLLED_BACK')),
  proposed_changes JSONB NOT NULL,
  rollback_snapshot JSONB,
  rationale VARCHAR(500) NOT NULL,
  requested_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  approved_by INTEGER REFERENCES users(id) ON DELETE RESTRICT,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE sc_plans (
  id UUID PRIMARY KEY,
  planning_key VARCHAR(120) UNIQUE NOT NULL,
  status VARCHAR(24) NOT NULL CHECK (status IN ('DRAFT','APPROVED','NEEDS_REPLAN','ROLLED_BACK')),
  policy_version VARCHAR(40) NOT NULL,
  input_as_of TIMESTAMPTZ NOT NULL,
  input_checksum CHAR(64) NOT NULL,
  uncertainty JSONB NOT NULL,
  has_shortage BOOLEAN NOT NULL,
  rollback_snapshot JSONB NOT NULL,
  created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  approved_by INTEGER REFERENCES users(id) ON DELETE RESTRICT,
  approved_at TIMESTAMPTZ,
  rolled_back_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE sc_plan_lines (
  id UUID PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES sc_plans(id) ON DELETE CASCADE,
  work_order_id UUID NOT NULL REFERENCES sc_work_orders(id) ON DELETE RESTRICT,
  component_part_id UUID NOT NULL REFERENCES sc_parts(id) ON DELETE RESTRICT,
  lot_id UUID REFERENCES sc_lots(id) ON DELETE RESTRICT,
  required_quantity NUMERIC(20,6) NOT NULL CHECK (required_quantity > 0),
  allocated_quantity NUMERIC(20,6) NOT NULL CHECK (allocated_quantity >= 0),
  shortage_quantity NUMERIC(20,6) NOT NULL CHECK (shortage_quantity >= 0),
  unit VARCHAR(12) NOT NULL,
  rationale VARCHAR(400) NOT NULL,
  uncertainty JSONB NOT NULL DEFAULT '{}'
);
CREATE INDEX sc_plan_lines_plan_work ON sc_plan_lines(plan_id, work_order_id);

CREATE TABLE sc_human_overrides (
  id UUID PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES sc_plans(id) ON DELETE RESTRICT,
  client_decision_id VARCHAR(120) NOT NULL,
  reason VARCHAR(500) NOT NULL,
  changes JSONB NOT NULL,
  accept_shortage BOOLEAN NOT NULL DEFAULT FALSE,
  actor_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (plan_id, client_decision_id)
);

CREATE TABLE sc_reservations (
  id UUID PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES sc_plans(id) ON DELETE RESTRICT,
  plan_line_id UUID NOT NULL REFERENCES sc_plan_lines(id) ON DELETE RESTRICT,
  work_order_id UUID NOT NULL REFERENCES sc_work_orders(id) ON DELETE RESTRICT,
  lot_id UUID NOT NULL REFERENCES sc_lots(id) ON DELETE RESTRICT,
  quantity NUMERIC(20,6) NOT NULL CHECK (quantity > 0),
  unit VARCHAR(12) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  released_at TIMESTAMPTZ,
  UNIQUE (plan_id, plan_line_id)
);

CREATE TABLE sc_state_transitions (
  id UUID PRIMARY KEY,
  entity_type VARCHAR(40) NOT NULL,
  entity_id UUID NOT NULL,
  from_state VARCHAR(40),
  to_state VARCHAR(40) NOT NULL,
  reason VARCHAR(500) NOT NULL,
  actor_user_id INTEGER REFERENCES users(id) ON DELETE RESTRICT,
  source_event_id UUID REFERENCES sc_source_events(id) ON DELETE RESTRICT,
  correlation_id UUID,
  entity_version INTEGER NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX sc_transitions_entity_time ON sc_state_transitions(entity_type, entity_id, occurred_at);

CREATE OR REPLACE FUNCTION sc_prevent_append_only_mutation() RETURNS trigger AS $$
BEGIN RAISE EXCEPTION '% is append-only', TG_TABLE_NAME; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER sc_inspections_append_only BEFORE UPDATE OR DELETE ON sc_inspections FOR EACH ROW EXECUTE FUNCTION sc_prevent_append_only_mutation();
CREATE TRIGGER sc_approvals_append_only BEFORE UPDATE OR DELETE ON sc_approvals FOR EACH ROW EXECUTE FUNCTION sc_prevent_append_only_mutation();
CREATE TRIGGER sc_plan_lines_append_only BEFORE UPDATE OR DELETE ON sc_plan_lines FOR EACH ROW EXECUTE FUNCTION sc_prevent_append_only_mutation();
CREATE TRIGGER sc_transitions_append_only BEFORE UPDATE OR DELETE ON sc_state_transitions FOR EACH ROW EXECUTE FUNCTION sc_prevent_append_only_mutation();
