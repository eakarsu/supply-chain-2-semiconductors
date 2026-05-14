const router = require('express').Router();
const auth = require('../middleware/auth');
const db = require('../db');

// Cross-entity unified search + filter
router.get('/', auth, async (req, res) => {
  try {
    const { q, types, country, tier, status, severity, criticality, limit } = req.query;
    const lim = Math.min(parseInt(limit) || 25, 100);
    const term = q ? `%${q}%` : null;
    const include = (types ? String(types).split(',') : ['suppliers','components','fabs','risk_alerts','intelligence']).map(s => s.trim());

    const out = { suppliers: [], components: [], fabs: [], risk_alerts: [], intelligence: [], total: 0 };

    if (include.includes('suppliers')) {
      const conds = []; const params = [];
      if (term) { params.push(term); conds.push(`(name ILIKE $${params.length} OR capabilities ILIKE $${params.length} OR country ILIKE $${params.length})`); }
      if (country) { params.push(country); conds.push(`country = $${params.length}`); }
      if (tier) { params.push(parseInt(tier)); conds.push(`tier = $${params.length}`); }
      if (status) { params.push(status); conds.push(`status = $${params.length}`); }
      params.push(lim);
      const r = await db.query(`SELECT id,name,country,tier,status,capacity_utilization,export_controlled FROM suppliers ${conds.length?'WHERE '+conds.join(' AND '):''} ORDER BY tier, name LIMIT $${params.length}`, params);
      out.suppliers = r.rows;
    }

    if (include.includes('components')) {
      const conds = []; const params = [];
      if (term) { params.push(term); conds.push(`(c.name ILIKE $${params.length} OR c.type ILIKE $${params.length})`); }
      if (criticality) { params.push(criticality); conds.push(`c.criticality = $${params.length}`); }
      if (status) { params.push(status); conds.push(`c.status = $${params.length}`); }
      params.push(lim);
      const r = await db.query(`SELECT c.id,c.name,c.type,c.process_node_nm,c.criticality,c.status,s.name as supplier_name FROM components c LEFT JOIN suppliers s ON c.supplier_id = s.id ${conds.length?'WHERE '+conds.join(' AND '):''} ORDER BY c.criticality, c.name LIMIT $${params.length}`, params);
      out.components = r.rows;
    }

    if (include.includes('fabs')) {
      const conds = []; const params = [];
      if (term) { params.push(term); conds.push(`(name ILIKE $${params.length} OR operator ILIKE $${params.length} OR location ILIKE $${params.length})`); }
      if (country) { params.push(country); conds.push(`country = $${params.length}`); }
      if (status) { params.push(status); conds.push(`status = $${params.length}`); }
      params.push(lim);
      const r = await db.query(`SELECT id,name,operator,country,utilization_pct,status FROM fabs ${conds.length?'WHERE '+conds.join(' AND '):''} ORDER BY monthly_capacity_kwafers DESC NULLS LAST LIMIT $${params.length}`, params);
      out.fabs = r.rows;
    }

    if (include.includes('risk_alerts')) {
      const conds = []; const params = [];
      if (term) { params.push(term); conds.push(`(r.title ILIKE $${params.length} OR r.description ILIKE $${params.length})`); }
      if (severity) { params.push(severity); conds.push(`r.severity = $${params.length}`); }
      if (status) { params.push(status); conds.push(`r.status = $${params.length}`); }
      params.push(lim);
      const r = await db.query(`SELECT r.id,r.title,r.severity,r.risk_type,r.status,r.detected_at,c.name as component_name,s.name as supplier_name FROM risk_alerts r LEFT JOIN components c ON r.component_id=c.id LEFT JOIN suppliers s ON r.supplier_id=s.id ${conds.length?'WHERE '+conds.join(' AND '):''} ORDER BY r.detected_at DESC LIMIT $${params.length}`, params);
      out.risk_alerts = r.rows;
    }

    if (include.includes('intelligence')) {
      const conds = []; const params = [];
      if (term) { params.push(term); conds.push(`(title ILIKE $${params.length} OR summary ILIKE $${params.length} OR analyst ILIKE $${params.length})`); }
      params.push(lim);
      const r = await db.query(`SELECT id,title,topic,impact_level,published_date,analyst FROM market_intelligence ${conds.length?'WHERE '+conds.join(' AND '):''} ORDER BY published_date DESC LIMIT $${params.length}`, params);
      out.intelligence = r.rows;
    }

    out.total = out.suppliers.length + out.components.length + out.fabs.length + out.risk_alerts.length + out.intelligence.length;
    res.json(out);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
