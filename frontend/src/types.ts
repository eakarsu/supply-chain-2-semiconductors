export interface Supplier {
  id: number;
  name: string;
  country: string;
  tier: number;
  city: string;
  capabilities: string;
  capacity_utilization: number;
  export_controlled: boolean;
  revenue_billions: number;
  employees: number;
  founded_year: number;
  certifications: string;
  status: string;
}

export interface Component {
  id: number;
  name: string;
  type: string;
  process_node_nm: number;
  supplier_id: number;
  supplier_name: string;
  lead_time_weeks: number;
  allocated_to: string;
  status: string;
  monthly_capacity_k_units: number;
  current_allocation_pct: number;
  price_usd: number;
  criticality: string;
}

export interface Allocation {
  id: number;
  component_id: number;
  component_name: string;
  customer: string;
  quantity_k_units: number;
  priority: number;
  locked_until: string;
  status: string;
  contract_value_millions: number;
  notes: string;
  created_at: string;
}

export interface RiskAlert {
  id: number;
  component_id: number;
  component_name: string;
  supplier_id: number;
  supplier_name: string;
  risk_type: string;
  severity: string;
  title: string;
  description: string;
  impact: string;
  mitigation: string;
  status: string;
  detected_at: string;
  resolved_at: string;
}

export interface Fab {
  id: number;
  name: string;
  operator: string;
  location: string;
  country: string;
  process_nodes: string;
  monthly_capacity_kwafers: number;
  utilization_pct: number;
  status: string;
  construction_cost_billions: number;
  opened_year: number;
  customers: string;
}

export interface MarketIntelligence {
  id: number;
  title: string;
  topic: string;
  summary: string;
  impact_level: string;
  source: string;
  published_date: string;
  affected_components: string;
  analyst: string;
  action_items: string;
}
