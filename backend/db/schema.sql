CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS suppliers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  country VARCHAR(100),
  tier INTEGER DEFAULT 1,
  city VARCHAR(100),
  capabilities TEXT,
  capacity_utilization DECIMAL,
  export_controlled BOOLEAN DEFAULT FALSE,
  revenue_billions DECIMAL,
  employees INTEGER,
  founded_year INTEGER,
  certifications TEXT,
  status VARCHAR(30) DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS components (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100),
  process_node_nm INTEGER,
  supplier_id INT REFERENCES suppliers(id),
  lead_time_weeks INTEGER,
  allocated_to VARCHAR(255),
  status VARCHAR(30) DEFAULT 'available',
  monthly_capacity_k_units INTEGER,
  current_allocation_pct DECIMAL,
  price_usd DECIMAL,
  criticality VARCHAR(20) DEFAULT 'medium'
);

CREATE TABLE IF NOT EXISTS allocations (
  id SERIAL PRIMARY KEY,
  component_id INT REFERENCES components(id) ON DELETE CASCADE,
  customer VARCHAR(255) NOT NULL,
  quantity_k_units INTEGER,
  priority INTEGER DEFAULT 5,
  locked_until DATE,
  status VARCHAR(30) DEFAULT 'provisional',
  contract_value_millions DECIMAL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS risk_alerts (
  id SERIAL PRIMARY KEY,
  component_id INT REFERENCES components(id),
  supplier_id INT REFERENCES suppliers(id),
  risk_type VARCHAR(50),
  severity VARCHAR(20) DEFAULT 'medium',
  title VARCHAR(255) NOT NULL,
  description TEXT,
  impact TEXT,
  mitigation TEXT,
  status VARCHAR(30) DEFAULT 'open',
  detected_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fabs (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  operator VARCHAR(255),
  location VARCHAR(255),
  country VARCHAR(100),
  process_nodes TEXT,
  monthly_capacity_kwafers INTEGER,
  utilization_pct DECIMAL,
  status VARCHAR(30) DEFAULT 'operational',
  construction_cost_billions DECIMAL,
  opened_year INTEGER,
  customers TEXT
);

CREATE TABLE IF NOT EXISTS market_intelligence (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  topic VARCHAR(100),
  summary TEXT,
  impact_level VARCHAR(20) DEFAULT 'medium',
  source VARCHAR(255),
  published_date DATE,
  affected_components TEXT,
  analyst VARCHAR(255),
  action_items TEXT
);

CREATE TABLE IF NOT EXISTS audit_log (
  id SERIAL PRIMARY KEY,
  user_email VARCHAR(255),
  action VARCHAR(50),
  entity_type VARCHAR(50),
  entity_id INTEGER,
  details TEXT,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity_type, entity_id);

-- ============================================================================
-- Export Compliance: EAR/ECCN/HTS reference + classification log
-- ============================================================================
CREATE TABLE IF NOT EXISTS eccn_codes (
  code VARCHAR(20) PRIMARY KEY,
  category INTEGER,
  product_group VARCHAR(1),
  description TEXT,
  controls TEXT,
  license_required_to TEXT,
  technical_threshold TEXT
);

CREATE TABLE IF NOT EXISTS hts_codes (
  code VARCHAR(20) PRIMARY KEY,
  description TEXT,
  general_rate TEXT,
  special_rate TEXT,
  unit_of_measure TEXT
);

CREATE TABLE IF NOT EXISTS classifications (
  id SERIAL PRIMARY KEY,
  component_id INT REFERENCES components(id),
  eccn VARCHAR(20),
  hts VARCHAR(20),
  destination_country VARCHAR(100),
  license_required BOOLEAN,
  reasoning TEXT,
  classified_at TIMESTAMP DEFAULT NOW(),
  classified_by INT REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_classifications_component ON classifications(component_id);
CREATE INDEX IF NOT EXISTS idx_classifications_dest ON classifications(destination_country);

-- ============================================================================
-- Multi-tier supplier graph
-- ============================================================================
CREATE TABLE IF NOT EXISTS supplier_relationships (
  parent_id INT REFERENCES suppliers(id) ON DELETE CASCADE,
  child_id INT REFERENCES suppliers(id) ON DELETE CASCADE,
  relationship_type VARCHAR(50),
  criticality VARCHAR(20),
  PRIMARY KEY (parent_id, child_id, relationship_type)
);
CREATE INDEX IF NOT EXISTS idx_sr_parent ON supplier_relationships(parent_id);
CREATE INDEX IF NOT EXISTS idx_sr_child ON supplier_relationships(child_id);

-- ============================================================================
-- CoWoS / advanced packaging capacity & bookings
-- ============================================================================
CREATE TABLE IF NOT EXISTS packaging_capacity (
  id SERIAL PRIMARY KEY,
  fab_id INT REFERENCES fabs(id),
  technology VARCHAR(50),
  monthly_capacity_units INT,
  quarter VARCHAR(7),
  reserved_pct DECIMAL,
  available_pct DECIMAL,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_pc_tech_quarter ON packaging_capacity(technology, quarter);

CREATE TABLE IF NOT EXISTS packaging_bookings (
  id SERIAL PRIMARY KEY,
  capacity_id INT REFERENCES packaging_capacity(id) ON DELETE CASCADE,
  customer VARCHAR(255),
  quantity_units INT,
  delivery_quarter VARCHAR(7),
  contract_status VARCHAR(30) DEFAULT 'provisional',
  contract_value_millions DECIMAL,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pb_customer ON packaging_bookings(customer);
CREATE INDEX IF NOT EXISTS idx_pb_quarter ON packaging_bookings(delivery_quarter);

-- ============================================================================
-- HBM bookings monitor
-- ============================================================================
CREATE TABLE IF NOT EXISTS hbm_bookings (
  id SERIAL PRIMARY KEY,
  customer VARCHAR(255),
  hbm_supplier VARCHAR(100),
  generation VARCHAR(20),
  quantity_GB INTEGER,
  delivery_quarter VARCHAR(7),
  contract_value_millions DECIMAL,
  locked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_hbm_supplier_gen ON hbm_bookings(hbm_supplier, generation);
CREATE INDEX IF NOT EXISTS idx_hbm_quarter ON hbm_bookings(delivery_quarter);
