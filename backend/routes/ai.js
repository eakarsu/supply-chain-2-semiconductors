const router = require('express').Router();
const auth = require('../middleware/auth');
const db = require('../db');

async function callAI(userPrompt, systemPrompt = '') {
  if (!process.env.OPENROUTER_API_KEY) {
    const err = new Error('AI service not configured');
    err.code = 'AI_UNAVAILABLE';
    throw err;
  }
  let r;
  try {
    r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`, 'Content-Type': 'application/json', 'HTTP-Referer': 'http://localhost', 'X-Title': 'SemiChain' },
      body: JSON.stringify({ model: process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5', messages: [...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []), { role: 'user', content: userPrompt }] })
    });
  } catch (e) {
    const err = new Error('AI service unreachable: ' + e.message);
    err.code = 'AI_UNAVAILABLE';
    throw err;
  }
  if (!r.ok) {
    const err = new Error(`AI service error: ${r.status}`);
    err.code = 'AI_UNAVAILABLE';
    throw err;
  }
  const data = await r.json();
  return data.choices?.[0]?.message?.content || 'AI unavailable';
}

function aiError(res, err) {
  if (err.code === 'AI_UNAVAILABLE') return res.status(503).json({ error: err.message });
  return res.status(500).json({ error: err.message });
}

router.post('/risk-assessment', auth, async (req, res) => {
  try {
    const { component_id, supplier_id } = req.body;
    let comp = {}, supp = {};
    if (component_id) { const r = await db.query('SELECT c.*, s.name as supplier_name, s.country FROM components c JOIN suppliers s ON c.supplier_id = s.id WHERE c.id = $1', [component_id]); comp = r.rows[0] || {}; }
    if (supplier_id) { const r = await db.query('SELECT * FROM suppliers WHERE id = $1', [supplier_id]); supp = r.rows[0] || {}; }
    const alerts = await db.query('SELECT * FROM risk_alerts WHERE (component_id = $1 OR supplier_id = $2) AND status != $3', [component_id||null, supplier_id||null, 'resolved']);
    const prompt = `Perform a deep risk assessment for this semiconductor supply chain element:\n\nComponent: ${JSON.stringify(comp)}\nSupplier: ${JSON.stringify(supp)}\nActive Risk Alerts: ${JSON.stringify(alerts.rows)}\n\nProvide:\n1. Overall risk score (1-10) with breakdown by category\n2. Critical single-source dependencies\n3. Geopolitical exposure analysis\n4. 6-month supply outlook\n5. Specific mitigation strategies with timelines\n6. Alternative supplier recommendations`;
    const result = await callAI(prompt, 'You are a semiconductor supply chain risk expert with deep knowledge of global chip supply chains, geopolitics, and manufacturing constraints.');
    res.json({ result });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/allocation-optimization', auth, async (req, res) => {
  try {
    const { available_capacity, customers, priorities } = req.body;
    const allocs = await db.query('SELECT a.*, c.name as component_name FROM allocations a JOIN components c ON a.component_id = c.id ORDER BY a.priority LIMIT 20');
    const prompt = `Optimize semiconductor allocation strategy:\n\nAvailable Capacity: ${available_capacity}\nCustomers/Requests: ${JSON.stringify(customers)}\nPriorities: ${JSON.stringify(priorities)}\nCurrent Allocations: ${JSON.stringify(allocs.rows.slice(0,10))}\n\nProvide:\n1. Optimal allocation matrix with justification\n2. Priority ranking methodology\n3. Revenue impact analysis\n4. Strategic customers to protect\n5. Customers to defer and alternative solutions\n6. Long-term capacity planning recommendations`;
    const result = await callAI(prompt, 'You are a semiconductor capacity planning expert. Optimize allocation for maximum strategic value while managing customer relationships.');
    res.json({ result });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/market-forecast', auth, async (req, res) => {
  try {
    const { component, timeframe } = req.body;
    const intel = await db.query('SELECT * FROM market_intelligence ORDER BY published_date DESC LIMIT 10');
    const prompt = `Forecast semiconductor supply/demand and pricing for:\n\nComponent: ${component}\nTimeframe: ${timeframe || 'next 12 months'}\n\nRecent Market Intelligence:\n${intel.rows.map(i => `- ${i.title}: ${i.summary}`).join('\n')}\n\nProvide:\n1. Supply outlook with probability scenarios (bull/base/bear)\n2. Demand drivers by end market\n3. Price trajectory forecast with key inflection points\n4. Technology transitions affecting supply/demand\n5. Geographic concentration risks\n6. Recommended procurement strategy`;
    const result = await callAI(prompt, 'You are a semiconductor industry analyst with expertise in supply/demand dynamics, pricing cycles, and technology roadmaps.');
    res.json({ result });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/resilience-report', auth, async (req, res) => {
  try {
    const { supply_chain_snapshot } = req.body;
    const [suppliers, components, alerts, fabs] = await Promise.all([
      db.query('SELECT name, country, tier, capacity_utilization, status FROM suppliers LIMIT 15'),
      db.query('SELECT name, criticality, status, current_allocation_pct FROM components LIMIT 15'),
      db.query('SELECT title, severity, risk_type, status FROM risk_alerts WHERE status != $1 LIMIT 10', ['resolved']),
      db.query('SELECT name, country, utilization_pct, status FROM fabs LIMIT 10')
    ]);
    const snapshot = supply_chain_snapshot || { suppliers: suppliers.rows, components: components.rows, alerts: alerts.rows, fabs: fabs.rows };
    const prompt = `Generate a comprehensive semiconductor supply chain resilience report:\n\nSupply Chain Snapshot:\n${JSON.stringify(snapshot)}\n\nAnalyze and provide:\n1. Resilience Score (0-100) with category breakdown\n2. Critical vulnerabilities ranked by impact\n3. Geographic concentration analysis\n4. Single-source dependency map\n5. Shock scenario analysis (Taiwan conflict, natural disaster, export controls)\n6. 90-day action plan for resilience improvement\n7. 1-year strategic roadmap`;
    const result = await callAI(prompt, 'You are a supply chain resilience expert specializing in semiconductor supply chains. Provide executive-level strategic analysis.');
    res.json({ result });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// === New AI features ===

// 1. Foundry-Capacity Allocator
router.post('/foundry-allocator', auth, async (req, res) => {
  try {
    const { foundry, total_wafer_starts, demand_requests, strategic_constraints } = req.body;
    const fabs = await db.query('SELECT * FROM fabs WHERE operator ILIKE $1 OR name ILIKE $1 LIMIT 5', [`%${foundry || ''}%`]);
    const comps = await db.query('SELECT name, type, process_node_nm, monthly_capacity_k_units, current_allocation_pct FROM components ORDER BY criticality LIMIT 15');
    const prompt = `Run a foundry capacity allocation optimization:\n\nFoundry: ${foundry || 'TSMC/Samsung/Intel'}\nTotal wafer starts available: ${total_wafer_starts || 'unknown'}\nDemand requests: ${demand_requests || 'see components'}\nStrategic constraints: ${strategic_constraints || 'none'}\n\nMatching fabs: ${JSON.stringify(fabs.rows)}\nKey components: ${JSON.stringify(comps.rows)}\n\nProduce:\n1. Optimal wafer-start allocation per process node (e.g., N3, N5, N7)\n2. Customer-tier allocation matrix with rationale\n3. Capacity bottlenecks and shifts needed\n4. Revenue-weighted allocation justification\n5. Risk-adjusted reserve recommendation\n6. 90-day re-allocation triggers`;
    const result = await callAI(prompt, 'You are a foundry capacity planning expert. Apply mathematical optimization principles balancing strategic value, technical fit, and customer relationships.');
    res.json({ result });
  } catch (err) { aiError(res, err); }
});

// 2. Lead-Time Forecaster
router.post('/lead-time-forecast', auth, async (req, res) => {
  try {
    const { component_id, scenario } = req.body;
    let comp = {};
    if (component_id) { const r = await db.query('SELECT c.*, s.name as supplier_name, s.country, s.capacity_utilization FROM components c JOIN suppliers s ON c.supplier_id = s.id WHERE c.id = $1', [component_id]); comp = r.rows[0] || {}; }
    const peers = await db.query('SELECT name, lead_time_weeks, current_allocation_pct FROM components WHERE process_node_nm = $1 LIMIT 8', [comp.process_node_nm || 0]);
    const alerts = await db.query('SELECT title, severity, risk_type FROM risk_alerts WHERE status != $1 ORDER BY detected_at DESC LIMIT 10', ['resolved']);
    const prompt = `Forecast semiconductor component lead times:\n\nComponent: ${JSON.stringify(comp)}\nPeer components at same node: ${JSON.stringify(peers.rows)}\nActive risk environment: ${JSON.stringify(alerts.rows)}\nScenario: ${scenario || 'baseline'}\n\nProvide:\n1. Lead-time forecast with confidence interval (weeks) for: today, 3M, 6M, 12M\n2. Drivers (utilization, geopolitics, packaging bottlenecks)\n3. Best/expected/worst case scenarios\n4. Buffer-stock recommendation (weeks of cover)\n5. Early-warning signals to monitor\n6. Procurement timing recommendation`;
    const result = await callAI(prompt, 'You are a semiconductor procurement analyst expert in lead-time forecasting using statistical and structural drivers.');
    res.json({ result });
  } catch (err) { aiError(res, err); }
});

// 3. Geopolitical-Disruption Analyzer
router.post('/geopolitical-analyzer', auth, async (req, res) => {
  try {
    const { region, scenario, horizon } = req.body;
    const suppliers = await db.query('SELECT name, country, tier, capacity_utilization, export_controlled FROM suppliers WHERE country ILIKE $1 OR $1 = $2', [`%${region || ''}%`, '']);
    const fabs = await db.query('SELECT name, operator, country, monthly_capacity_kwafers, process_nodes FROM fabs WHERE country ILIKE $1 OR $1 = $2', [`%${region || ''}%`, '']);
    const prompt = `Analyze geopolitical disruption impact on semiconductor supply chain:\n\nRegion of concern: ${region || 'global'}\nScenario: ${scenario || 'baseline tensions'}\nHorizon: ${horizon || '12 months'}\n\nExposed suppliers: ${JSON.stringify(suppliers.rows.slice(0,15))}\nExposed fabs: ${JSON.stringify(fabs.rows.slice(0,10))}\n\nProvide:\n1. Disruption probability (low/med/high) with key triggers\n2. Affected supply chain nodes (suppliers, fabs, logistics)\n3. Cascade-failure analysis (1st/2nd/3rd order effects)\n4. Capacity at risk (k-wafers/month) by node size\n5. Mitigation playbook with phased timeline\n6. Diversification targets (regions, suppliers, fabs)`;
    const result = await callAI(prompt, 'You are a geopolitical risk analyst specializing in semiconductor supply chains, export controls, and great-power competition.');
    res.json({ result });
  } catch (err) { aiError(res, err); }
});

// 4. Yield-Loss Predictor
router.post('/yield-loss-predictor', auth, async (req, res) => {
  try {
    const { component_id, process_node_nm, defect_signals } = req.body;
    let comp = {};
    if (component_id) { const r = await db.query('SELECT c.*, s.name as supplier_name FROM components c JOIN suppliers s ON c.supplier_id = s.id WHERE c.id = $1', [component_id]); comp = r.rows[0] || {}; }
    const node = process_node_nm || comp.process_node_nm;
    const peers = await db.query('SELECT name, monthly_capacity_k_units, current_allocation_pct FROM components WHERE process_node_nm = $1 LIMIT 8', [node || 0]);
    const prompt = `Predict yield-loss risk for a semiconductor component:\n\nComponent: ${JSON.stringify(comp)}\nProcess Node: ${node || 'unknown'} nm\nPeer components: ${JSON.stringify(peers.rows)}\nReported defect signals: ${defect_signals || 'none'}\n\nProvide:\n1. Predicted yield range (D0-based) with confidence band\n2. Top defect modes for this node\n3. Yield ramp curve estimate (initial → mature)\n4. Capacity loss in k-wafers if yield drops 5/10/15 pp\n5. Recommended process control measures\n6. Re-spin / re-tape decision threshold`;
    const result = await callAI(prompt, 'You are a semiconductor yield engineer with deep expertise in advanced-node defect physics and yield-learning curves.');
    res.json({ result });
  } catch (err) { aiError(res, err); }
});

// 5. Export-Control Compliance Flagger
router.post('/export-compliance', auth, async (req, res) => {
  try {
    const { destination_country, end_use, component_id, supplier_id } = req.body;
    let comp = {}, supp = {};
    if (component_id) { const r = await db.query('SELECT c.*, s.name as supplier_name, s.country, s.export_controlled FROM components c JOIN suppliers s ON c.supplier_id = s.id WHERE c.id = $1', [component_id]); comp = r.rows[0] || {}; }
    if (supplier_id) { const r = await db.query('SELECT * FROM suppliers WHERE id = $1', [supplier_id]); supp = r.rows[0] || {}; }
    const prompt = `Perform US/EU/Japan export-control compliance screening for a semiconductor transaction:\n\nComponent: ${JSON.stringify(comp)}\nSupplier: ${JSON.stringify(supp)}\nDestination country: ${destination_country || 'unspecified'}\nEnd use: ${end_use || 'unspecified'}\n\nProvide:\n1. Likely ECCN classification (e.g., 3A001, 3A090, 4A090) and basis\n2. Applicable controls: EAR, ITAR, FDPR, Entity List, Section 1759\n3. License-required flag with confidence (low/med/high)\n4. Red-flag indicators in the transaction\n5. Required due-diligence steps (KYC, end-use certificates)\n6. Compliant-path recommendation or escalation`;
    const result = await callAI(prompt, 'You are an export-control compliance officer with deep semiconductor regulatory expertise (BIS, OFAC, EAR, FDPR, Wassenaar). Always flag uncertainty conservatively.');
    res.json({ result });
  } catch (err) { aiError(res, err); }
});

module.exports = router;
