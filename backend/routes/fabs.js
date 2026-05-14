const router = require('express').Router();
const auth = require('../middleware/auth');
const db = require('../db');

router.get('/', auth, async (req, res) => {
  try { const r = await db.query('SELECT * FROM fabs ORDER BY monthly_capacity_kwafers DESC NULLS LAST'); res.json(r.rows); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
router.get('/:id', auth, async (req, res) => {
  try { const r = await db.query('SELECT * FROM fabs WHERE id = $1', [req.params.id]); if (!r.rows[0]) return res.status(404).json({ error: 'Not found' }); res.json(r.rows[0]); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
router.post('/', auth, async (req, res) => {
  try {
    const { name, operator, location, country, process_nodes, monthly_capacity_kwafers, utilization_pct, status, construction_cost_billions, opened_year, customers } = req.body;
    const r = await db.query('INSERT INTO fabs (name, operator, location, country, process_nodes, monthly_capacity_kwafers, utilization_pct, status, construction_cost_billions, opened_year, customers) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *', [name, operator, location, country, process_nodes, monthly_capacity_kwafers, utilization_pct, status||'operational', construction_cost_billions, opened_year, customers]);
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, operator, location, country, process_nodes, monthly_capacity_kwafers, utilization_pct, status, construction_cost_billions, opened_year, customers } = req.body;
    const r = await db.query('UPDATE fabs SET name=$1, operator=$2, location=$3, country=$4, process_nodes=$5, monthly_capacity_kwafers=$6, utilization_pct=$7, status=$8, construction_cost_billions=$9, opened_year=$10, customers=$11 WHERE id=$12 RETURNING *', [name, operator, location, country, process_nodes, monthly_capacity_kwafers, utilization_pct, status, construction_cost_billions, opened_year, customers, req.params.id]);
    if (!r.rows[0]) return res.status(404).json({ error: 'Not found' }); res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.delete('/:id', auth, async (req, res) => {
  try { await db.query('DELETE FROM fabs WHERE id = $1', [req.params.id]); res.json({ success: true }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
module.exports = router;
