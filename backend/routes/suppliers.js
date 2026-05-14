const router = require('express').Router();
const auth = require('../middleware/auth');
const db = require('../db');

router.get('/', auth, async (req, res) => {
  try { const r = await db.query('SELECT * FROM suppliers ORDER BY tier, name'); res.json(r.rows); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
router.get('/:id', auth, async (req, res) => {
  try { const r = await db.query('SELECT * FROM suppliers WHERE id = $1', [req.params.id]); if (!r.rows[0]) return res.status(404).json({ error: 'Not found' }); res.json(r.rows[0]); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
router.post('/', auth, async (req, res) => {
  try {
    const { name, country, tier, city, capabilities, capacity_utilization, export_controlled, revenue_billions, employees, founded_year, certifications, status } = req.body;
    const r = await db.query('INSERT INTO suppliers (name, country, tier, city, capabilities, capacity_utilization, export_controlled, revenue_billions, employees, founded_year, certifications, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *', [name, country, tier, city, capabilities, capacity_utilization, export_controlled||false, revenue_billions, employees, founded_year, certifications, status||'active']);
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, country, tier, city, capabilities, capacity_utilization, export_controlled, revenue_billions, employees, founded_year, certifications, status } = req.body;
    const r = await db.query('UPDATE suppliers SET name=$1, country=$2, tier=$3, city=$4, capabilities=$5, capacity_utilization=$6, export_controlled=$7, revenue_billions=$8, employees=$9, founded_year=$10, certifications=$11, status=$12 WHERE id=$13 RETURNING *', [name, country, tier, city, capabilities, capacity_utilization, export_controlled, revenue_billions, employees, founded_year, certifications, status, req.params.id]);
    if (!r.rows[0]) return res.status(404).json({ error: 'Not found' }); res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.delete('/:id', auth, async (req, res) => {
  try { await db.query('DELETE FROM suppliers WHERE id = $1', [req.params.id]); res.json({ success: true }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
module.exports = router;
