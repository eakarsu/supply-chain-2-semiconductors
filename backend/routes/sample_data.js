const router = require('express').Router();
const auth = require('../middleware/auth');
const db = require('../db');

// Realistic semiconductor supply chain sample data per entity.
// Each entity inserts 5-10 rows on POST /api/admin/sample-data/:entity.
// Returns { inserted, entity }.

const SAMPLE_SUPPLIERS = [
  ['UMC', 'Taiwan', 1, 'Hsinchu', 'Specialty foundry: 22nm, 28nm, 40nm, RF/analog, embedded NVM', 86.5, false, 8.9, 19500, 1980, 'ISO9001, IATF16949', 'active'],
  ['GlobalFoundries', 'USA', 1, 'Malta', 'Specialty foundry: 12LP+, 22FDX, RF SOI, automotive-grade', 84.0, false, 7.4, 13000, 2009, 'ISO9001, IATF16949, AEC-Q100', 'active'],
  ['SMIC', 'China', 1, 'Shanghai', 'Logic foundry: 14nm, 28nm, mature nodes - export controlled', 78.0, true, 7.7, 22000, 2000, 'ISO9001', 'active'],
  ['Apple Inc.', 'USA', 1, 'Cupertino', 'Fabless SoC design: A-series, M-series silicon - largest TSMC customer', 99.0, false, 383.0, 161000, 1976, 'ISO9001, ISO14001', 'active'],
  ['AMD', 'USA', 1, 'Santa Clara', 'Fabless: Ryzen, EPYC, Instinct MI300X - TSMC + GlobalFoundries customer', 97.0, true, 22.7, 26000, 1969, 'ISO9001, AEC-Q100', 'active'],
  ['Qualcomm', 'USA', 1, 'San Diego', 'Fabless: Snapdragon mobile SoCs, modems, RF front-end', 96.0, true, 35.8, 51000, 1985, 'ISO9001, IATF16949', 'active'],
  ['MediaTek', 'Taiwan', 1, 'Hsinchu', 'Fabless SoC: Dimensity, Helio, smart TV, IoT - second TSMC customer', 92.0, false, 17.5, 19000, 1997, 'ISO9001, IATF16949', 'active'],
  ['JSR Corporation', 'Japan', 2, 'Tokyo', 'EUV/ArF photoresist, polymers, semiconductor materials', 88.0, true, 3.0, 9100, 1957, 'ISO9001, ISO14001', 'active']
];

const SAMPLE_COMPONENTS = [
  ['2nm Logic Wafers (N2)', 'logic_chip', 2, null, 60, 'Apple, NVIDIA (planned)', 'reserved', 30, 88.0, 22000, 'critical'],
  ['3nm Logic Wafers (N3E)', 'logic_chip', 3, null, 50, 'Apple M5, NVIDIA next-gen', 'allocated', 50, 96.0, 19500, 'critical'],
  ['4nm Logic Wafers (N4P)', 'logic_chip', 4, null, 40, 'NVIDIA Blackwell, Qualcomm', 'constrained', 90, 93.5, 14000, 'critical'],
  ['7nm Logic Wafers (N7)', 'logic_chip', 7, null, 32, 'AMD EPYC, Qualcomm X65', 'available', 150, 80.0, 9500, 'high'],
  ['HBM3e 36GB Stack', 'memory', 5, null, 50, 'NVIDIA B200, AMD MI350', 'constrained', 95, 99.0, 4200, 'critical'],
  ['CoWoS-L Packaging', 'packaging', null, null, 44, 'NVIDIA Blackwell GB200', 'constrained', 40, 98.5, 1800, 'critical'],
  ['SoIC-X 3D Packaging', 'packaging', null, null, 56, 'AMD MI300/MI350, Apple M5', 'reserved', 18, 95.0, 2400, 'critical'],
  ['EUV Mask (3nm)', 'mask', 3, null, 28, 'Apple A19, Snapdragon 8 Gen 4', 'available', 120, 85.0, 1600, 'high'],
  ['ArFi Photoresist', 'chemical', null, null, 10, 'All advanced fabs', 'available', 6500, 70.0, 95, 'medium'],
  ['DRAM HBM2e 16GB', 'memory', 10, null, 20, 'Datacenter GPU legacy', 'available', 800, 65.0, 320, 'medium']
];

// Allocations: [placeholder_for_component_id, customer, qty_k, priority, days_until_locked, status, contract_M, notes]
const SAMPLE_ALLOCATIONS = [
  [null, 'NVIDIA', 75, 1, 365, 'confirmed', 18500, 'Blackwell B200 wafer-start reservation - 75k wafers/yr at TSMC N4P'],
  [null, 'Apple Inc.', 60, 1, 540, 'confirmed', 22000, 'A19 / M5 silicon at TSMC N3E - locked through FY2026'],
  [null, 'AMD', 30, 2, 270, 'confirmed', 6500, 'EPYC Turin Dense + MI350 wafer commitment'],
  [null, 'Qualcomm', 40, 2, 270, 'confirmed', 7800, 'Snapdragon 8 Gen 4 / X Elite Gen 2 mobile SoC capacity'],
  [null, 'MediaTek', 35, 3, 180, 'provisional', 5400, 'Dimensity 9400 flagship SoC - awaiting volume confirmation'],
  [null, 'NVIDIA', 90, 1, 365, 'confirmed', 27000, 'HBM3e allocation - SK Hynix + Samsung dual-source for B200'],
  [null, 'Google', 20, 2, 180, 'confirmed', 4800, 'TPUv6 trainium wafer-start at TSMC N3'],
  [null, 'Tesla', 15, 3, 180, 'provisional', 2200, 'AI5 inference chip - Samsung Foundry 4nm pilot run']
];

const SAMPLE_RISK_ALERTS = [
  [null, null, 'geopolitical', 'critical', 'Taiwan Strait Tensions Q3 2026', 'Escalating cross-strait military activity. PLA exercises around Taiwan increasing in frequency. TSMC Hsinchu / Tainan fab access at risk.', 'Loss of TSMC capacity halts >90% of leading-edge logic wafer supply globally. Apple, NVIDIA, AMD, Qualcomm production stops.', 'Accelerate TSMC Arizona N3 ramp; pre-position 12-week strategic chip inventory; activate Samsung 3nm GAA dual-source plan.', 'monitoring'],
  [null, null, 'capacity', 'high', 'CoWoS-L Packaging Bottleneck for Blackwell', 'TSMC CoWoS-L capacity for NVIDIA Blackwell GB200 fully booked through Q4 2026. Cannot accept new packaging orders.', 'NVIDIA cannot ramp Blackwell shipments to meet hyperscaler demand. AMD MI350 also packaging-constrained.', 'Fund TSMC CoWoS expansion (+40% by 2027); qualify ASE/Amkor for advanced packaging fallback.', 'open'],
  [null, null, 'export_control', 'high', 'BIS Expanded HBM Export Controls', 'US BIS rule restricts HBM2e+ exports to PRC entities. Affects SK Hynix, Samsung, Micron China shipments.', 'Chinese AI accelerator programs lose access to leading HBM. Domestic CXMT HBM unable to meet demand.', 'Audit all HBM export licenses; ensure compliance documentation; isolate PRC-bound SKUs.', 'monitoring'],
  [null, null, 'single_source', 'critical', 'ASML High-NA EUV Single Source for 2nm', 'ASML is sole supplier of High-NA EUV scanners required for 2nm and below. $400M per system, 36-month lead time.', 'Any High-NA delivery delay pushes 2nm production out by 1-2 years across TSMC, Samsung, Intel.', 'Lock multi-system orders with ASML; co-fund High-NA throughput improvements; monitor ASML supply chain.', 'open'],
  [null, null, 'natural_disaster', 'medium', 'Taiwan Earthquake Risk - Hsinchu Science Park', 'Hsinchu Science Park sits near active fault lines. M7+ earthquake could damage TSMC Fab 12, Fab 18 cleanrooms.', 'Yield loss + cleanroom requalification: 4-12 weeks of leading-edge wafer supply.', 'Maintain 6-week wafer buffer; insure against business interruption; verify seismic isolation upgrades.', 'monitoring'],
  [null, null, 'cyber', 'high', 'Ransomware Targeting Foundry OT Networks', 'Threat actors targeting semiconductor fab OT/MES systems. TSMC and Foxconn previously hit. New campaign observed Q2 2026.', 'OT compromise can halt wafer production for days; recipe leakage threatens IP.', 'Air-gap critical OT segments; deploy SBOM monitoring; run tabletop incident response with foundry partners.', 'open'],
  [null, null, 'financial', 'medium', 'Memory Vendor Capex Pullback Risk', 'DRAM/NAND price recovery uneven. SK Hynix and Micron may delay HBM4 capex if AI demand softens late 2026.', 'HBM4 capacity insufficient for 2027 AI accelerator ramp; constrains NVIDIA Rubin / AMD MI400 launches.', 'Pre-fund HBM4 capacity reservation contracts; track memory vendor earnings guidance monthly.', 'monitoring']
];

const SAMPLE_FABS = [
  ['Fab 20 (N2)', 'TSMC', 'Hsinchu, Taiwan', 'Taiwan', '2nm GAA, 3nm', 30, 35.0, 'ramp', 22.0, 2025, 'Apple, NVIDIA, AMD'],
  ['Fab 22 (N2 Arizona)', 'TSMC', 'Phoenix, Arizona', 'USA', '2nm GAA', 0, 0.0, 'construction', 25.0, 2028, 'Apple, DoD'],
  ['Pyeongtaek P4 (HBM4)', 'Samsung', 'Pyeongtaek, South Korea', 'South Korea', 'HBM4, DRAM 1c', 50, 60.0, 'ramp', 12.0, 2026, 'NVIDIA, AMD'],
  ['Magdeburg Fab', 'Intel', 'Magdeburg, Germany', 'Germany', 'Intel 18A, Intel 14A', 0, 0.0, 'planned', 33.0, 2030, 'European OEMs (planned)'],
  ['Fab 8 (Malta)', 'GlobalFoundries', 'Malta, New York', 'USA', '12LP+, 22FDX, 14nm', 60, 88.0, 'operational', 8.0, 2012, 'AMD, Qualcomm, Cisco'],
  ['Kumamoto JASM Fab', 'TSMC', 'Kumamoto, Japan', 'Japan', '12/16nm, 22/28nm', 55, 78.0, 'operational', 8.6, 2024, 'Sony, Denso, Renesas'],
  ['Veldhoven HQ (EUV Assembly)', 'ASML', 'Veldhoven, Netherlands', 'Netherlands', 'EUV / High-NA EUV scanner assembly', 0, 95.0, 'operational', 5.5, 1984, 'TSMC, Samsung, Intel']
];

// Intelligence: [title, topic, summary, impact_level, source, days_ago, affected, analyst, action_items]
const SAMPLE_INTELLIGENCE = [
  ['NVIDIA Rubin Architecture Capacity Reservations Open', 'demand', 'NVIDIA opened wafer-start reservations for Rubin (R100) on TSMC N3P with HBM4. Hyperscaler demand already 2.5x baseline allocation.', 'high', 'Semiconductor Industry Daily', 2, 'N3P wafers, HBM4 memory, CoWoS-L', 'Sarah Chen', 'Lock HBM4 reservation; confirm CoWoS-L capacity share with TSMC'],
  ['Samsung 2nm GAA Yield Reaches 60% Milestone', 'technology', 'Samsung Foundry reports 2nm GAA process yield at 60% on test silicon. Closing competitive gap with TSMC N2.', 'medium', 'EE Times', 6, '2nm logic wafers', 'Robert Kim', 'Begin Samsung 2nm qualification for risk-mitigation second source'],
  ['Intel 18A First Customer Tape-Out Successful', 'technology', 'Microsoft completed first external tape-out on Intel 18A. Validates Intel Foundry as credible TSMC alternative for US-domestic AI silicon.', 'high', 'Intel Foundry Direct', 4, 'Intel 18A wafers', 'David Martinez', 'Evaluate Intel 18A for next-gen accelerator dual-source strategy'],
  ['ASML High-NA EUV Productivity Reaches 175 wph', 'supply', 'ASML High-NA EXE:5200 throughput improved to 175 wafers/hour, up from 145. Reduces 2nm cost-per-wafer by ~12%.', 'medium', 'ASML Investor Update', 9, '2nm logic wafers', 'Michael Torres', 'Update 2nm cost model; reassess High-NA system order quantity'],
  ['HBM4 Spec Finalized - 2TB/s per Stack', 'technology', 'JEDEC ratified HBM4 standard: 2TB/s bandwidth, 36GB max stack size, 1024-bit interface. Mass production targeted 2026 by SK Hynix and Samsung.', 'high', 'JEDEC', 14, 'HBM4 memory', 'Lisa Wang', 'Lock HBM4 reservation contracts; coordinate with NVIDIA/AMD on bandwidth roadmap'],
  ['China CXMT Achieves 16Gb DDR5 Production', 'supply', 'CXMT (ChangXin Memory) ramping 16Gb DDR5 at Hefei fab. Reduces China dependence on Samsung/Hynix/Micron for commodity DRAM.', 'medium', 'TechInsights', 21, 'DRAM DDR5', 'Jennifer Park', 'Monitor CXMT capacity additions; assess pricing pressure on commodity DRAM'],
  ['TSMC Arizona Fab 21 Phase 2 Construction Accelerating', 'capacity', 'TSMC Arizona Fab 21 Phase 2 (N3/N2) construction 8 months ahead of schedule. CHIPS Act milestone payments unlocked.', 'medium', 'TSMC Press Release', 1, '3nm/2nm wafers', 'Kevin Brown', 'Update US-domestic supply forecast for FY2027; coordinate with Apple on Arizona allocation share']
];

const SAMPLE_DEFS = {
  suppliers: {
    sql: 'INSERT INTO suppliers (name, country, tier, city, capabilities, capacity_utilization, export_controlled, revenue_billions, employees, founded_year, certifications, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) ON CONFLICT DO NOTHING',
    rows: SAMPLE_SUPPLIERS
  },
  components: {
    sql: 'INSERT INTO components (name, type, process_node_nm, supplier_id, lead_time_weeks, allocated_to, status, monthly_capacity_k_units, current_allocation_pct, price_usd, criticality) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) ON CONFLICT DO NOTHING',
    rows: SAMPLE_COMPONENTS
  },
  allocations: {
    sql: 'INSERT INTO allocations (component_id, customer, quantity_k_units, priority, locked_until, status, contract_value_millions, notes) VALUES ($1,$2,$3,$4, CURRENT_DATE + ($5)::int, $6,$7,$8)',
    rows: SAMPLE_ALLOCATIONS,
    needsComponentId: true
  },
  'risk-alerts': {
    sql: 'INSERT INTO risk_alerts (component_id, supplier_id, risk_type, severity, title, description, impact, mitigation, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
    rows: SAMPLE_RISK_ALERTS
  },
  fabs: {
    sql: 'INSERT INTO fabs (name, operator, location, country, process_nodes, monthly_capacity_kwafers, utilization_pct, status, construction_cost_billions, opened_year, customers) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) ON CONFLICT DO NOTHING',
    rows: SAMPLE_FABS
  },
  intelligence: {
    sql: 'INSERT INTO market_intelligence (title, topic, summary, impact_level, source, published_date, affected_components, analyst, action_items) VALUES ($1,$2,$3,$4,$5, CURRENT_DATE - ($6)::int, $7,$8,$9)',
    rows: SAMPLE_INTELLIGENCE
  }
};

const ALLOWED = Object.keys(SAMPLE_DEFS);

router.post('/sample-data/:entity', auth, async (req, res) => {
  const entity = req.params.entity;
  if (!ALLOWED.includes(entity)) {
    return res.status(400).json({ error: `Unknown entity '${entity}'. Allowed: ${ALLOWED.join(', ')}` });
  }
  const def = SAMPLE_DEFS[entity];

  // For allocations we need a real component_id (FK). Pick the first existing one.
  let componentId = null;
  if (def.needsComponentId) {
    try {
      const r = await db.query('SELECT id FROM components ORDER BY id LIMIT 1');
      if (!r.rows[0]) {
        return res.status(409).json({ error: 'Cannot insert sample allocations: no components exist. Run /sample-data/components first.' });
      }
      componentId = r.rows[0].id;
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  let inserted = 0;
  try {
    for (const row of def.rows) {
      let params = row;
      if (entity === 'allocations') {
        params = [componentId, row[1], row[2], row[3], row[4], row[5], row[6], row[7]];
      }
      const r = await db.query(def.sql, params);
      inserted += r.rowCount || 0;
    }
    return res.json({ inserted, entity });
  } catch (err) {
    return res.status(500).json({ error: err.message, inserted });
  }
});

module.exports = router;
