const router = require('express').Router();
const auth = require('../middleware/auth');
const db = require('../db');
const { logAudit } = require('../middleware/audit');

const ENTITIES = {
  suppliers: 'SELECT * FROM suppliers ORDER BY tier, name',
  components: 'SELECT c.*, s.name as supplier_name FROM components c LEFT JOIN suppliers s ON c.supplier_id = s.id ORDER BY c.criticality, c.name',
  allocations: 'SELECT a.*, c.name as component_name FROM allocations a LEFT JOIN components c ON a.component_id = c.id ORDER BY a.priority',
  'risk-alerts': 'SELECT r.*, c.name as component_name, s.name as supplier_name FROM risk_alerts r LEFT JOIN components c ON r.component_id = c.id LEFT JOIN suppliers s ON r.supplier_id = s.id ORDER BY r.detected_at DESC',
  fabs: 'SELECT * FROM fabs ORDER BY monthly_capacity_kwafers DESC NULLS LAST',
  intelligence: 'SELECT * FROM market_intelligence ORDER BY published_date DESC',
  'audit-log': 'SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 1000'
};

function csvEscape(v) {
  if (v === null || v === undefined) return '';
  const s = typeof v === 'object' ? JSON.stringify(v) : String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function rowsToCSV(rows) {
  if (!rows.length) return '';
  const cols = Object.keys(rows[0]);
  const header = cols.join(',');
  const body = rows.map(r => cols.map(c => csvEscape(r[c])).join(',')).join('\n');
  return header + '\n' + body;
}

router.get('/:entity', auth, async (req, res) => {
  try {
    const entity = req.params.entity;
    const sql = ENTITIES[entity];
    if (!sql) return res.status(400).json({ error: 'Unknown entity. Available: ' + Object.keys(ENTITIES).join(', ') });
    const r = await db.query(sql);
    const csv = rowsToCSV(r.rows);
    await logAudit(req, 'export', entity, null, { rows: r.rows.length });
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${entity}-${new Date().toISOString().slice(0,10)}.csv"`);
    res.send(csv);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
