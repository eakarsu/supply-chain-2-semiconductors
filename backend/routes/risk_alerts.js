const router = require('express').Router();
const auth = require('../middleware/auth');
const db = require('../db');

router.get('/', auth, async (req, res) => {
  try { const r = await db.query('SELECT ra.*, c.name as component_name, s.name as supplier_name FROM risk_alerts ra LEFT JOIN components c ON ra.component_id = c.id LEFT JOIN suppliers s ON ra.supplier_id = s.id ORDER BY CASE ra.severity WHEN \'critical\' THEN 1 WHEN \'high\' THEN 2 WHEN \'medium\' THEN 3 ELSE 4 END'); res.json(r.rows); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
router.get('/:id', auth, async (req, res) => {
  try { const r = await db.query('SELECT ra.*, c.name as component_name, s.name as supplier_name FROM risk_alerts ra LEFT JOIN components c ON ra.component_id = c.id LEFT JOIN suppliers s ON ra.supplier_id = s.id WHERE ra.id = $1', [req.params.id]); if (!r.rows[0]) return res.status(404).json({ error: 'Not found' }); res.json(r.rows[0]); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
router.post('/', auth, async (req, res) => {
  try {
    const { component_id, supplier_id, risk_type, severity, title, description, impact, mitigation, status } = req.body;
    const r = await db.query('INSERT INTO risk_alerts (component_id, supplier_id, risk_type, severity, title, description, impact, mitigation, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *', [component_id, supplier_id, risk_type, severity||'medium', title, description, impact, mitigation, status||'open']);
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.put('/:id', auth, async (req, res) => {
  try {
    const { component_id, supplier_id, risk_type, severity, title, description, impact, mitigation, status, resolved_at } = req.body;
    const r = await db.query('UPDATE risk_alerts SET component_id=$1, supplier_id=$2, risk_type=$3, severity=$4, title=$5, description=$6, impact=$7, mitigation=$8, status=$9, resolved_at=$10 WHERE id=$11 RETURNING *', [component_id, supplier_id, risk_type, severity, title, description, impact, mitigation, status, resolved_at, req.params.id]);
    if (!r.rows[0]) return res.status(404).json({ error: 'Not found' }); res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.delete('/:id', auth, async (req, res) => {
  try { await db.query('DELETE FROM risk_alerts WHERE id = $1', [req.params.id]); res.json({ success: true }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
module.exports = router;
