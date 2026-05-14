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
